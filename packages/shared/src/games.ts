import { z } from 'zod';
import { gameSourceSchema, timeControlSchema } from './enums';

export const gameResultSchema = z.enum(['1-0', '0-1', '1/2-1/2', '*']);
export type GameResult = z.infer<typeof gameResultSchema>;

export const publicGameSchema = z.object({
  id: z.string(),
  source: gameSourceSchema,
  externalId: z.string(),
  timeControl: timeControlSchema,
  playedAt: z.string().datetime(),
  whiteName: z.string(),
  blackName: z.string(),
  result: gameResultSchema,
  userColor: z.enum(['white', 'black']),
});
export type PublicGame = z.infer<typeof publicGameSchema>;

export const gamesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  timeControl: timeControlSchema.optional(),
  source: gameSourceSchema.optional(),
});
export type GamesQuery = z.infer<typeof gamesQuerySchema>;
