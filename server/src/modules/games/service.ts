import { ratingsFromPgn } from '@peakelo/engine';
import {
  analyzedPlySchema,
  courseSkillBand,
  COURSE_SKILL_BAND_LABEL,
  paginate,
  paginationQuerySchema,
  type GameSource,
  type PlayerRatingContext,
  type PublicGameAnalysis,
  type TimeControl,
} from '@peakelo/shared';
import type { Prisma } from '@prisma/client';
import { getPrisma } from '../../db/prisma';

export async function listGames(
  userId: string,
  query: { page: number; pageSize: number; timeControl?: TimeControl; source?: GameSource },
) {
  const parsed = paginationQuerySchema.parse(query);
  const where = {
    userId,
    ...(query.timeControl ? { timeControl: query.timeControl } : {}),
    ...(query.source ? { source: query.source } : {}),
  };
  const [total, rows] = await Promise.all([
    getPrisma().game.count({ where }),
    getPrisma().game.findMany({
      where,
      orderBy: { playedAt: 'desc' },
      skip: (parsed.page - 1) * parsed.pageSize,
      take: parsed.pageSize,
    }),
  ]);
  return paginate(
    rows.map(toPublicGame),
    total,
    parsed,
  );
}

export async function getGame(userId: string, id: string) {
  const game = await getPrisma().game.findFirst({
    where: { id, userId },
    include: { analysis: true },
  });
  if (!game) return null;
  const ratings = resolveGameRatings(game);
  return {
    ...toPublicGame(game),
    pgn: game.pgn,
    analysis: toPublicAnalysis(game.analysis),
    playerRating: ratings.player,
    opponentRating: ratings.opponent,
  };
}

export function resolveGameRatings(game: {
  source: GameSource;
  timeControl: TimeControl;
  userColor: string;
  pgn: string;
  whiteRating?: number | null;
  blackRating?: number | null;
}): { player: PlayerRatingContext | null; opponent: number | null } {
  const fromPgn = ratingsFromPgn(game.pgn);
  const white = game.whiteRating ?? fromPgn.white;
  const black = game.blackRating ?? fromPgn.black;
  const isBlack = game.userColor === 'black';
  const playerValue = isBlack ? black : white;
  const opponent = isBlack ? white : black;
  if (playerValue == null) return { player: null, opponent };
  const band = courseSkillBand(playerValue);
  return {
    player: {
      rating: playerValue,
      source: game.source,
      timeControl: game.timeControl,
      band,
      bandLabel: COURSE_SKILL_BAND_LABEL[band],
    },
    opponent,
  };
}

function toPublicAnalysis(
  analysis: {
    status: string;
    plies: Prisma.JsonValue | null;
  } | null,
): PublicGameAnalysis {
  if (!analysis) return { status: 'none', plies: null };
  if (analysis.status === 'ready') {
    if (analysis.plies == null) return { status: 'ready', plies: [] };
    const parsed = analyzedPlySchema.array().safeParse(analysis.plies);
    if (!parsed.success) return { status: 'failed', plies: null };
    return { status: 'ready', plies: parsed.data };
  }
  if (
    analysis.status === 'pending' ||
    analysis.status === 'running' ||
    analysis.status === 'failed'
  ) {
    return { status: analysis.status, plies: null };
  }
  return { status: 'none', plies: null };
}

function toPublicGame(game: {
  id: string;
  source: GameSource;
  externalId: string;
  timeControl: TimeControl;
  playedAt: Date;
  whiteName: string;
  blackName: string;
  result: string;
  userColor: string;
}) {
  return {
    id: game.id,
    source: game.source,
    externalId: game.externalId,
    timeControl: game.timeControl,
    playedAt: game.playedAt.toISOString(),
    whiteName: game.whiteName,
    blackName: game.blackName,
    result: game.result,
    userColor: game.userColor === 'black' ? ('black' as const) : ('white' as const),
  };
}
