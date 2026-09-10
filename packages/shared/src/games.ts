import { z } from 'zod';
import { gameSourceSchema, timeControlSchema } from './enums';
import { analyzedPlySchema, gameAnalysisStatusSchema } from './profile';

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

export const publicGameAnalysisSchema = z.object({
  status: z.enum(['none', ...gameAnalysisStatusSchema.options]),
  plies: z.array(analyzedPlySchema).nullable(),
});
export type PublicGameAnalysis = z.infer<typeof publicGameAnalysisSchema>;

export const publicGameDetailSchema = publicGameSchema.extend({
  pgn: z.string(),
  analysis: publicGameAnalysisSchema,
});
export type PublicGameDetail = z.infer<typeof publicGameDetailSchema>;

export const gamesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  timeControl: timeControlSchema.optional(),
  source: gameSourceSchema.optional(),
});
export type GamesQuery = z.infer<typeof gamesQuerySchema>;
