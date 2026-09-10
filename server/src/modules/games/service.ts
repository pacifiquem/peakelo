import {
  paginate,
  paginationQuerySchema,
  type GameSource,
  type TimeControl,
} from '@peakelo/shared';
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
  const game = await getPrisma().game.findFirst({ where: { id, userId } });
  if (!game) return null;
  return { ...toPublicGame(game), pgn: game.pgn };
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
