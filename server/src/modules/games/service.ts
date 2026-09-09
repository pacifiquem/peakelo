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
    rows.map((game) => ({
      id: game.id,
      source: game.source,
      externalId: game.externalId,
      timeControl: game.timeControl,
      playedAt: game.playedAt.toISOString(),
      whiteName: game.whiteName,
      blackName: game.blackName,
      result: game.result,
      userColor: game.userColor === 'black' ? ('black' as const) : ('white' as const),
    })),
    total,
    parsed,
  );
}
