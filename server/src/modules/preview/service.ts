import { annotatePly, replayPgn } from '@peakelo/engine';
import { analyzePlayerGame } from '@peakelo/engine/pass';
import {
  COURSE_SKILL_BAND_LABEL,
  LESSON_MODEL,
  PUBLIC_REVIEW_MAX_PLIES,
  analyzedPlySchema,
  courseSkillBand,
  publicReviewSchema,
  publicReviewWriteupSchema,
  type AnalyzedPly,
  type PublicReview,
  type PublicReviewWriteup,
} from '@peakelo/shared';
import { Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError, ServiceUnavailableError } from '../../common/errors';
import { env } from '../../config/env';
import { getPrisma } from '../../db/prisma';
import { logger } from '../../lib/logger';
import { UpstreamError } from '../../lib/http';
import { getDefaultAdapter } from '../engine';
import { fetchChesscomGameById } from '../games/platforms/chesscom';
import { fetchLichessGameById } from '../games/platforms/lichess';
import {
  PREVIEW_FAILED_MESSAGE,
  generatePublicReviewWithAgent,
  isPreviewConfigured,
  parseGeneratedPublicReview,
  type GeneratePublicReview,
} from './agent';
import { parseGameUrl } from './parse-url';

export type PreviewDeps = {
  fetchGame?: typeof fetchPublicGame;
  analyze?: typeof analyzePublicGame;
  generateReview?: GeneratePublicReview;
  isConfigured?: () => boolean;
};

export async function startPublicReview(url: string, deps: PreviewDeps = {}): Promise<PublicReview> {
  const parsed = parseGameUrl(url);
  if (!parsed) {
    throw new BadRequestError('Paste a Chess.com or Lichess game link.');
  }
  if (parsed.source === 'chesscom' && parsed.kind === 'daily') {
    throw new BadRequestError('We only review live bullet, blitz, and rapid.');
  }

  const prisma = getPrisma();
  const existing = await prisma.publicReview.findUnique({
    where: { source_externalId: { source: parsed.source, externalId: parsed.externalId } },
  });
  if (existing) {
    const cached = toPublic(existing);
    const configured = deps.isConfigured ?? isPreviewConfigured;
    const retryCoach = cached.status === 'ready' && !cached.review && configured();
    const retryEngine = cached.status === 'failed';
    if (retryCoach || retryEngine) {
      await prisma.publicReview.update({
        where: { id: existing.id },
        data: {
          status: 'queued',
          error: null,
          ...(retryEngine ? { plies: Prisma.JsonNull, review: Prisma.JsonNull } : {}),
        },
      });
      return getPublicReview(existing.id);
    }
    return cached;
  }

  const fetchGame = deps.fetchGame ?? fetchPublicGame;
  let game;
  try {
    game = await fetchGame(parsed);
  } catch (error) {
    if (error instanceof UpstreamError) {
      throw new ServiceUnavailableError('That chess site did not return the game.');
    }
    throw error;
  }
  if (!game) {
    throw new NotFoundError('Public game');
  }
  const replayed = replayPgn(game.pgn);
  if (replayed.plies.length === 0) {
    throw new BadRequestError('That game has no moves we can replay.');
  }
  if (replayed.plies.length > PUBLIC_REVIEW_MAX_PLIES) {
    throw new BadRequestError('That game is longer than we review on the public desk.');
  }

  try {
    const created = await prisma.publicReview.create({
      data: {
        source: parsed.source,
        externalId: parsed.externalId,
        url: url.trim(),
        pgn: game.pgn,
        whiteName: game.whiteName,
        blackName: game.blackName,
        result: game.result,
        timeControl: game.timeControl,
        playedAt: game.playedAt,
        whiteRating: game.whiteRating,
        blackRating: game.blackRating,
        status: 'queued',
      },
    });
    return toPublic(created);
  } catch (error) {
    const raced = await prisma.publicReview.findUnique({
      where: { source_externalId: { source: parsed.source, externalId: parsed.externalId } },
    });
    if (raced) return toPublic(raced);
    throw error;
  }
}

export async function getPublicReview(id: string): Promise<PublicReview> {
  const row = await getPrisma().publicReview.findUnique({ where: { id } });
  if (!row) throw new NotFoundError('Review');
  return toPublic(row);
}

export async function recoverInterruptedPublicReviews(): Promise<number> {
  const result = await getPrisma().publicReview.updateMany({
    where: { status: 'running' },
    data: { status: 'queued' },
  });
  return result.count;
}

export async function runPreviewTick(deps: PreviewDeps = {}): Promise<number> {
  const prisma = getPrisma();
  const queued = await prisma.publicReview.findFirst({
    where: { status: 'queued' },
    orderBy: { createdAt: 'asc' },
  });
  if (!queued) return 0;
  const claimed = await prisma.publicReview.updateMany({
    where: { id: queued.id, status: 'queued' },
    data: { status: 'running', error: null },
  });
  if (claimed.count !== 1) return 0;

  try {
    const stored = Array.isArray(queued.plies) ? analyzedPlySchema.array().safeParse(queued.plies) : null;
    const analyze = deps.analyze ?? analyzePublicGame;
    const plies = stored?.success ? stored.data : await analyze(queued.pgn);
    let review: PublicReviewWriteup | null = null;
    let reviewError: string | null = null;
    const configured = deps.isConfigured ?? isPreviewConfigured;
    if (configured()) {
      try {
        const generate = deps.generateReview ?? generatePublicReviewWithAgent;
        review = parseGeneratedPublicReview(
          await generate({ userMessage: buildReviewMessage(queued, plies) }),
          plies,
        );
      } catch (error) {
        reviewError = error instanceof Error ? error.message : PREVIEW_FAILED_MESSAGE;
        logger.warn({ err: error, id: queued.id }, 'public review coach failed');
      }
    } else {
      reviewError = 'The coach is offline right now.';
    }
    await prisma.publicReview.update({
      where: { id: queued.id },
      data: {
        status: 'ready',
        plies: plies as Prisma.InputJsonValue,
        review: review ? (review as Prisma.InputJsonValue) : Prisma.JsonNull,
        model: review ? (env.LESSON_MODEL ?? LESSON_MODEL) : null,
        error: reviewError,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not analyze that game.';
    logger.error({ err: error, id: queued.id }, 'public review engine failed');
    await prisma.publicReview.update({
      where: { id: queued.id },
      data: { status: 'failed', error: message.slice(0, 500) },
    });
  }
  return 1;
}

export async function fetchPublicGame(parsed: ReturnType<typeof parseGameUrl>) {
  if (!parsed) return null;
  if (parsed.source === 'lichess') {
    return fetchLichessGameById(parsed.externalId);
  }
  if (parsed.kind !== 'live' && parsed.kind !== 'daily') return null;
  return fetchChesscomGameById({ kind: parsed.kind, id: parsed.externalId });
}

export async function analyzePublicGame(pgn: string): Promise<AnalyzedPly[]> {
  const adapter = getDefaultAdapter();
  const result = await analyzePlayerGame({
    pgn,
    userColor: 'white',
    evaluate: (fen) => adapter.evaluate(fen),
  });
  return result.plies;
}

export function buildReviewMessage(
  game: {
    source: string;
    timeControl: string | null;
    whiteName: string;
    blackName: string;
    result: string;
    whiteRating: number | null;
    blackRating: number | null;
    pgn: string;
  },
  plies: AnalyzedPly[],
): string {
  const notable = [...plies]
    .filter((ply) => ply.judgment === 'blunder' || ply.judgment === 'mistake' || ply.cpl >= 100)
    .sort((a, b) => b.cpl - a.cpl)
    .slice(0, 10)
    .map((ply) => ({
      ply: ply.ply,
      san: ply.san,
      color: ply.color,
      glyph: annotatePly(ply),
      judgment: ply.judgment,
      cpl: ply.cpl,
      overlooked: ply.overlooked,
      bestSan: ply.bestSan,
      fenBefore: ply.fenBefore,
      evalBefore: ply.evalBefore,
      evalAfter: ply.evalAfter,
    }));
  const opening = [...plies].reverse().find((ply) => ply.opening)?.opening ?? null;
  const scoresheet = plies.map(
    (ply) =>
      `${ply.ply} ${ply.color} ${ply.san} ${annotatePly(ply)} cpl=${ply.cpl} best=${ply.bestSan}`,
  );
  return [
    `Spectator review of THIS game. White ${game.whiteName} vs Black ${game.blackName}. Result ${game.result}.`,
    `Source ${game.source}${game.timeControl ? ` ${game.timeControl}` : ''}.`,
    spectatorGuidance(game),
    opening ? `Stored opening (last book hit): ${opening.eco} ${opening.name}.` : 'No stored opening name.',
    `Engine pass is ready. ${plies.length} plies. keyPlies must use ply+san+color from this pass.`,
    notable.length > 0
      ? `Highest-CPL plies (from the pass, not invented):\n${JSON.stringify(notable)}`
      : 'No blunder or mistake plies in the pass. Cite a real turning ply from the scoresheet.',
    `Scoresheet:\n${scoresheet.join('\n')}`,
    `PGN:\n${game.pgn}`,
    'Write the structured spectator review now. Do not invent SAN, eval, or a student.',
  ].join('\n');
}

function spectatorGuidance(game: {
  whiteRating: number | null;
  blackRating: number | null;
}): string {
  const sides: string[] = [];
  if (game.whiteRating) {
    const band = courseSkillBand(game.whiteRating);
    sides.push(`White ${game.whiteRating} (${COURSE_SKILL_BAND_LABEL[band]})`);
  }
  if (game.blackRating) {
    const band = courseSkillBand(game.blackRating);
    sides.push(`Black ${game.blackRating} (${COURSE_SKILL_BAND_LABEL[band]})`);
  }
  if (sides.length === 0) {
    return 'No ratings. Teach from the board. Spectator review — do not invent a student.';
  }
  return `Ratings: ${sides.join('; ')}. Spectator review of both names. Do not invent a student. Speak at that course skill range.`;
}

function toPublic(row: {
  id: string;
  source: string;
  externalId: string;
  url: string;
  pgn: string;
  whiteName: string;
  blackName: string;
  result: string;
  timeControl: string | null;
  playedAt: Date | null;
  whiteRating: number | null;
  blackRating: number | null;
  status: string;
  error: string | null;
  plies: Prisma.JsonValue | null;
  review: Prisma.JsonValue | null;
}): PublicReview {
  const plies = Array.isArray(row.plies) ? analyzedPlySchema.array().safeParse(row.plies) : null;
  const review = row.review ? publicReviewWriteupSchema.safeParse(row.review) : null;
  const result = publicReviewSchema.parse({
    id: row.id,
    status: row.status,
    source: row.source,
    externalId: row.externalId,
    url: row.url,
    pgn: row.pgn,
    whiteName: row.whiteName,
    blackName: row.blackName,
    result: row.result,
    timeControl: row.timeControl,
    playedAt: row.playedAt?.toISOString() ?? null,
    whiteRating: row.whiteRating,
    blackRating: row.blackRating,
    analysis: {
      status: row.status === 'ready' && plies?.success ? 'ready' : row.status === 'failed' ? 'failed' : row.status === 'running' ? 'running' : 'pending',
      plies: plies?.success ? plies.data : null,
    },
    review: review?.success ? review.data : null,
    error: row.error,
  });
  return result;
}
