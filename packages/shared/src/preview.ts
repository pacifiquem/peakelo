import { z } from 'zod';

import { gameSourceSchema, timeControlSchema } from './enums';
import { gameResultSchema, publicGameAnalysisSchema } from './games';


export const publicReviewStatusSchema = z.enum(['queued', 'running', 'ready', 'failed']);
export type PublicReviewStatus = z.infer<typeof publicReviewStatusSchema>;

export const publicReviewRequestSchema = z.object({
  url: z.string().trim().min(12).max(400),
});
export type PublicReviewRequest = z.infer<typeof publicReviewRequestSchema>;

export const publicReviewKeyPlySchema = z.object({
  ply: z.number().int().positive(),
  san: z.string().min(1).max(16),
  color: z.enum(['white', 'black']),
  why: z.string().min(1).max(240),
});
export type PublicReviewKeyPly = z.infer<typeof publicReviewKeyPlySchema>;

export const publicReviewWriteupSchema = z.object({
  headline: z.string().min(1).max(160),
  story: z.string().min(1).max(1600),
  decidedBy: z.string().min(1).max(240),
  opening: z.string().max(120).nullable(),
  keyPlies: z.array(publicReviewKeyPlySchema).min(1).max(8),
  whiteHabit: z.string().min(1).max(240),
  blackHabit: z.string().min(1).max(240),
});
export type PublicReviewWriteup = z.infer<typeof publicReviewWriteupSchema>;

export const publicReviewSchema = z.object({
  id: z.string(),
  status: publicReviewStatusSchema,
  source: gameSourceSchema,
  externalId: z.string(),
  url: z.string(),
  pgn: z.string(),
  whiteName: z.string(),
  blackName: z.string(),
  result: gameResultSchema,
  timeControl: timeControlSchema.nullable(),
  playedAt: z.string().datetime().nullable(),
  whiteRating: z.number().int().positive().nullable(),
  blackRating: z.number().int().positive().nullable(),
  analysis: publicGameAnalysisSchema,
  review: publicReviewWriteupSchema.nullable(),
  error: z.string().nullable(),
});
export type PublicReview = z.infer<typeof publicReviewSchema>;

export const parsedGameUrlSchema = z.object({
  source: gameSourceSchema,
  externalId: z.string().min(1).max(40),
  kind: z.enum(['live', 'daily']).nullable(),
});
export type ParsedGameUrl = z.infer<typeof parsedGameUrlSchema>;
