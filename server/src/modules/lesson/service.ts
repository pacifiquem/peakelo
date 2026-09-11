import { annotatePly, applyUciLine, applyUciLineFrom, isSquare, replayPgn, START_FEN } from '@peakelo/engine';
import {
  analyzedPlySchema,
  LESSON_MODEL,
  lessonSchema,
  type AnalyzedPly,
  type Lesson,
  type LessonAlternative,
  type LessonArrow,
  type LessonAskRequest,
  type LessonRequest,
  type LessonSegment,
  type SlowRunHit,
} from '@peakelo/shared';
import type { Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError, ServiceUnavailableError } from '../../common/errors';
import { env } from '../../config/env';
import { getPrisma } from '../../db/prisma';
import { logger } from '../../lib/logger';
import { getGame } from '../games/service';
import {
  generateLessonWithAgent,
  isLessonConfigured,
  parseGeneratedLesson,
  type GenerateBrief,
  type GenerateLesson,
} from './agent';
import { createGameBrief, readCachedBrief } from './brief';
import { levelGuidance } from './level';
import { loadSlowRunIndex, resolveSlowRunIndexPath, searchSlowRunIndex } from './search-index';
import {
  formatVoiceExamples,
  loadTeachingIndex,
  pickVoiceExamples,
  resolveTeachingPath,
} from './teaching';

export type LessonDeps = {
  isConfigured?: () => boolean;
  generateLesson?: GenerateLesson;
  generateBrief?: GenerateBrief;
};

export async function createLesson(
  userId: string,
  gameId: string,
  request: LessonRequest,
  deps: LessonDeps = {},
): Promise<Lesson> {
  return runLesson(userId, gameId, request, deps);
}

export async function askLesson(
  userId: string,
  gameId: string,
  request: LessonAskRequest,
  deps: LessonDeps = {},
): Promise<Lesson> {
  return runLesson(userId, gameId, request, deps, { ask: true });
}

async function runLesson(
  userId: string,
  gameId: string,
  request: LessonRequest & Partial<LessonAskRequest>,
  deps: LessonDeps,
  flags: { ask?: boolean } = {},
): Promise<Lesson> {
  const configured = deps.isConfigured ?? isLessonConfigured;
  if (!configured()) {
    throw new ServiceUnavailableError('The lesson coach is offline right now.');
  }

  const game = await getGame(userId, gameId);
  if (!game) throw new NotFoundError('Game');

  const replayed = replayPgn(game.pgn);
  if (request.ply > replayed.plies.length) {
    throw new BadRequestError('Ply is past the end of this game');
  }

  const analyzed = parseReadyPlies(game.analysis);
  const analyzedPly = request.ply === 0 ? null : (analyzed?.find((item) => item.ply === request.ply) ?? null);
  const replayPly = request.ply === 0 ? null : (replayed.plies[request.ply - 1] ?? null);
  const fenAfter =
    request.ply === 0 ? replayed.startFen : (replayPly?.fen ?? analyzedPly?.fenAfter ?? START_FEN);
  const fenBefore =
    request.ply === 0 ? replayed.startFen : (replayPly?.fenBefore ?? analyzedPly?.fenBefore ?? fenAfter);

  const variation = request.variationUci ?? [];
  let fen = fenAfter;
  let variationSan: string[] = [];
  if (variation.length > 0) {
    const applied = applyUciLine(fenAfter, variation);
    if (!applied.legal) {
      throw new BadRequestError('That variation is not legal from this position');
    }
    fen = applied.fen;
    variationSan = applied.plies.map((ply) => ply.san);
  }

  const cacheable = !flags.ask && variation.length === 0;
  if (cacheable && !request.refresh) {
    const cached = await readCachedLesson(gameId, request.ply);
    if (cached) return cached;
  }

  let brief = await readCachedBrief(gameId);
  if (!brief && !flags.ask && !variation.length) {
    const shouldWriteBrief = !deps.generateLesson || Boolean(deps.generateBrief);
    if (shouldWriteBrief) {
      brief = await createGameBrief(userId, gameId, {
        isConfigured: configured,
        generateBrief: deps.generateBrief,
      });
    }
  }

  const userMessage = buildUserMessage({
    ply: request.ply,
    fen,
    fenBefore: variation.length > 0 ? fen : fenBefore,
    fenAfter: variation.length > 0 ? fen : fenAfter,
    playerColor: game.userColor,
    analysisStatus: game.analysis.status,
    analyzedPly,
    replaySan: replayPly?.san ?? null,
    replayUci: replayPly?.uci ?? null,
    variationUci: variation,
    variationSan,
    clocks:
      analyzedPly || replayPly
        ? {
            clockAfterMs: analyzedPly?.clockAfterMs ?? replayPly?.clockAfterMs ?? null,
            timeSpentMs: analyzedPly?.timeSpentMs ?? null,
          }
        : null,
    voice: formatVoiceExamples(
      pickVoiceExamples(loadTeachingIndex(resolveTeachingPath(env.SLOW_RUN_INDEX_PATH)), tagsForPly(analyzedPly)),
    ),
    level: levelGuidance(game.playerRating),
    brief: brief
      ? `Whole-game brief (write the ply inside this story, do not retell it):\n${JSON.stringify({
          headline: brief.headline,
          story: brief.story,
          keyPlies: brief.keyPlies,
          decidedBy: brief.decidedBy,
          opening: brief.opening,
        })}`
      : '',
  });

  const generate = deps.generateLesson ?? generateLessonWithAgent;
  const raw = await generate({
    userMessage,
    history: request.history,
    question: request.question,
  });
  const parsed = parseGeneratedLesson(raw);
  const originFens = variation.length > 0 ? [fen] : [fenAfter, fenBefore];
  const lesson = sanitizeLesson(parsed, { ply: request.ply, fen, originFens });

  if (cacheable) {
    await writeCachedLesson(gameId, request.ply, fen, lesson);
  }

  logger.info(
    { gameId, ply: request.ply, ask: Boolean(flags.ask), cached: false },
    'lesson generated',
  );
  return lesson;
}

function parseReadyPlies(analysis: { status: string; plies: unknown }): AnalyzedPly[] | null {
  if (analysis.status !== 'ready' || analysis.plies == null) return null;
  const parsed = analyzedPlySchema.array().safeParse(analysis.plies);
  return parsed.success ? parsed.data : null;
}

async function readCachedLesson(gameId: string, ply: number): Promise<Lesson | null> {
  const row = await getPrisma().gameLesson.findUnique({
    where: { gameId_ply: { gameId, ply } },
  });
  if (!row) return null;
  const parsed = lessonSchema.safeParse(row.payload);
  if (!parsed.success) return null;
  return sanitizeLesson(parsed.data, { ply: row.ply, fen: row.fen, originFens: [row.fen] });
}

async function writeCachedLesson(gameId: string, ply: number, fen: string, lesson: Lesson): Promise<void> {
  await getPrisma().gameLesson.upsert({
    where: { gameId_ply: { gameId, ply } },
    create: {
      gameId,
      ply,
      fen,
      payload: lesson as Prisma.InputJsonValue,
      model: env.LESSON_MODEL ?? LESSON_MODEL,
    },
    update: {
      fen,
      payload: lesson as Prisma.InputJsonValue,
      model: env.LESSON_MODEL ?? LESSON_MODEL,
    },
  });
}

export function sanitizeLesson(
  lesson: Lesson,
  actual: { ply: number; fen: string; originFens: string[] },
): Lesson {
  const origins = actual.originFens.filter(Boolean);
  const segments = lesson.segments
    .map((segment) => sanitizeSegment(segment, origins))
    .filter((segment): segment is LessonSegment => Boolean(segment));
  if (segments.length === 0) {
    throw new ServiceUnavailableError('The lesson coach could not finish this position.');
  }
  return {
    ...lesson,
    ply: actual.ply,
    fen: actual.fen,
    segments,
    arrows: lesson.arrows
      .map((arrow) => sanitizeArrow(arrow, origins))
      .filter((arrow): arrow is LessonArrow => Boolean(arrow)),
    alternatives: lesson.alternatives
      .map((alt) => sanitizeAlternative(alt, origins))
      .filter((alt): alt is LessonAlternative => Boolean(alt)),
    sources: keepIndexedSources(lesson.sources, origins),
  };
}

function sanitizeSegment(segment: LessonSegment, origins: string[]): LessonSegment | null {
  if (!segment.lineUci || segment.lineUci.length === 0) {
    return { id: segment.id, text: segment.text };
  }
  const applied = applyUciLineFrom(origins, segment.lineUci);
  if (!applied.legal) {
    return { id: segment.id, text: segment.text };
  }
  return {
    ...segment,
    lineUci: applied.plies.map((ply) => ply.uci),
    lineSan: applied.plies.map((ply) => ply.san),
  };
}

function sanitizeAlternative(alt: LessonAlternative, origins: string[]): LessonAlternative | null {
  const line = alt.pvUci.length > 0 ? alt.pvUci : [alt.uci];
  const applied = applyUciLineFrom(origins, line);
  if (!applied.legal || applied.plies.length === 0) return null;
  const first = applied.plies[0]!;
  return {
    ...alt,
    uci: first.uci,
    san: first.san,
    pvUci: applied.plies.map((ply) => ply.uci),
    pvSan: applied.plies.map((ply) => ply.san),
  };
}

function sanitizeArrow(arrow: LessonArrow, origins: string[]): LessonArrow | null {
  if (!isSquare(arrow.from) || !isSquare(arrow.to)) return null;
  if (arrow.from === arrow.to) return arrow;
  const applied = applyUciLineFrom(origins, [`${arrow.from}${arrow.to}`]);
  return applied.legal ? arrow : null;
}

function keepIndexedSources(sources: SlowRunHit[], origins: string[]): SlowRunHit[] {
  if (sources.length === 0) return [];
  const allowed = new Set<string>();
  const index = loadSlowRunIndex(resolveSlowRunIndexPath(env.SLOW_RUN_INDEX_PATH));
  for (const fen of origins) {
    for (const hit of searchSlowRunIndex(index, fen, { limit: 8 })) {
      allowed.add(`${hit.speaker}:${hit.videoId}:${hit.tSec}`);
    }
  }
  return sources.filter((hit) => allowed.has(`${hit.speaker}:${hit.videoId}:${hit.tSec}`)).slice(0, 4);
}

function buildUserMessage(input: {
  ply: number;
  fen: string;
  fenBefore: string;
  fenAfter: string;
  playerColor: 'white' | 'black';
  analysisStatus: string;
  analyzedPly: AnalyzedPly | null;
  replaySan: string | null;
  replayUci: string | null;
  variationUci: string[];
  variationSan: string[];
  clocks: { clockAfterMs: number | null; timeSpentMs: number | null } | null;
  voice: string;
  level: string;
  brief: string;
}): string {
  const analysisReady = input.analysisStatus === 'ready' && input.analyzedPly;
  const plyJson = analysisReady
    ? {
        ply: input.analyzedPly!.ply,
        san: input.analyzedPly!.san,
        uci: input.analyzedPly!.uci,
        judgment: input.analyzedPly!.judgment,
        glyph: annotatePly(input.analyzedPly!),
        fenBefore: input.analyzedPly!.fenBefore,
        fenAfter: input.analyzedPly!.fenAfter,
        bestSan: input.analyzedPly!.bestSan,
        bestUci: input.analyzedPly!.bestUci,
        pvSan: input.analyzedPly!.pvSan,
        pvUci: input.analyzedPly!.pvUci,
        secondBestUci: input.analyzedPly!.secondBestUci,
        overlooked: input.analyzedPly!.overlooked,
        evalBefore: input.analyzedPly!.evalBefore,
        evalAfter: input.analyzedPly!.evalAfter,
        cpl: input.analyzedPly!.cpl,
        phase: input.analyzedPly!.phase,
        opening: input.analyzedPly!.opening,
        isPlayer: input.analyzedPly!.isPlayer,
        color: input.analyzedPly!.color,
      }
    : null;

  const lines = [
    `Player color: ${input.playerColor}.`,
    `Ply: ${input.ply}.`,
    `FEN: ${input.fen}.`,
    `FEN before the ply: ${input.fenBefore}.`,
    `FEN after the ply: ${input.fenAfter}.`,
    input.ply === 0
      ? 'This is the starting position (ply 0).'
      : `Move that reached this ply: ${input.replaySan ?? 'unknown'} (${input.replayUci ?? 'unknown'}).`,
  ];

  if (input.variationUci.length > 0) {
    lines.push(
      `The board is on a variation from the mainline after-fen ${input.fenAfter}: ${input.variationSan.join(' ')} (${input.variationUci.join(' ')}). Clickable lines must start from the variation FEN.`,
    );
  } else {
    lines.push(
      'Clickable "instead" lines start from FEN before the ply. "What happens next" lines start from FEN after the ply.',
    );
  }

  if (plyJson) {
    lines.push('Stored engine ply JSON (do not invent numbers beyond this):');
    lines.push(JSON.stringify(plyJson));
  } else if (input.analysisStatus === 'pending' || input.analysisStatus === 'running') {
    lines.push('The engine pass is still running. Do not invent eval, CPL, or glyphs.');
  } else if (input.analysisStatus === 'failed') {
    lines.push('The engine pass failed. Teach from the replay only. Do not invent eval or glyphs.');
  } else {
    lines.push('No stored engine analysis for this ply. Do not invent eval, CPL, or glyphs.');
  }

  if (input.clocks && (input.clocks.timeSpentMs !== null || input.clocks.clockAfterMs !== null)) {
    lines.push(
      `Clocks (only mention if they decided the ply): spentMs=${input.clocks.timeSpentMs ?? 'unknown'} remainingMs=${input.clocks.clockAfterMs ?? 'unknown'}.`,
    );
  }

  if (input.level) lines.push(input.level);
  if (input.brief) lines.push(input.brief);
  if (input.voice) lines.push(input.voice);

  lines.push('Write the structured lesson now.');
  return lines.join('\n');
}

function tagsForPly(ply: AnalyzedPly | null): string[] {
  if (!ply) return ['idea'];
  const tags = new Set<string>();
  if (ply.overlooked.includes('hanging_piece') || ply.overlooked.includes('missed_hanging')) {
    tags.add('hanging');
  }
  if (ply.overlooked.includes('missed_combination') || ply.judgment === 'blunder' || ply.judgment === 'mistake') {
    tags.add('miss');
  }
  if (ply.phase === 'opening') tags.add('develop');
  if (ply.phase === 'endgame') tags.add('king');
  if (tags.size === 0) tags.add('idea');
  return [...tags];
}
