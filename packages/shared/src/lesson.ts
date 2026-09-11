import { z } from 'zod';

import { evalScoreSchema } from './profile';
import { playerRatingContextSchema } from './rating';

export const lessonSpeakerSchema = z.enum(['gotham', 'hikaru', 'naroditsky']);
export type LessonSpeaker = z.infer<typeof lessonSpeakerSchema>;

export const lessonArrowSchema = z.object({
  from: z.string().length(2),
  to: z.string().length(2),
  brush: z.enum(['green', 'paleGreen', 'blue', 'paleBlue', 'red', 'paleRed', 'yellow']),
});
export type LessonArrow = z.infer<typeof lessonArrowSchema>;

export const lessonSegmentSchema = z.object({
  id: z.string().min(1).max(64),
  text: z.string().min(1).max(500),
  lineUci: z.array(z.string().min(4).max(5)).max(16).optional(),
  lineSan: z.array(z.string().min(2).max(16)).max(16).optional(),
});
export type LessonSegment = z.infer<typeof lessonSegmentSchema>;

export const lessonAlternativeSchema = z.object({
  san: z.string().min(2).max(16),
  uci: z.string().min(4).max(5),
  pvSan: z.array(z.string().min(2).max(16)).max(12),
  pvUci: z.array(z.string().min(4).max(5)).max(12),
  score: evalScoreSchema.optional(),
  why: z.string().min(1).max(280),
});
export type LessonAlternative = z.infer<typeof lessonAlternativeSchema>;

export const slowRunHitSchema = z.object({
  speaker: lessonSpeakerSchema,
  videoId: z.string().min(1),
  title: z.string().min(1).max(300),
  tSec: z.number().nonnegative(),
  quote: z.string().min(1).max(600),
  epd: z.string().min(1).max(120).optional(),
});
export type SlowRunHit = z.infer<typeof slowRunHitSchema>;

export const lessonSchema = z.object({
  ply: z.number().int().nonnegative(),
  fen: z.string().min(1),
  headline: z.string().min(1).max(160),
  segments: z.array(lessonSegmentSchema).min(1).max(8),
  arrows: z.array(lessonArrowSchema).max(8),
  alternatives: z.array(lessonAlternativeSchema).max(4),
  sources: z.array(slowRunHitSchema).max(4),
});
export type Lesson = z.infer<typeof lessonSchema>;

export const lessonRequestSchema = z.object({
  ply: z.coerce.number().int().min(0).max(600),
  variationUci: z.array(z.string().min(4).max(5)).max(24).optional(),
  refresh: z.boolean().optional(),
});
export type LessonRequest = z.infer<typeof lessonRequestSchema>;

export const lessonAskRequestSchema = lessonRequestSchema.extend({
  question: z.string().trim().min(1).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(['player', 'coach']),
        text: z.string().min(1).max(2000),
      }),
    )
    .max(8)
    .optional(),
});
export type LessonAskRequest = z.infer<typeof lessonAskRequestSchema>;

export const lessonAskResponseSchema = z.object({
  answer: lessonSchema,
});
export type LessonAskResponse = z.infer<typeof lessonAskResponseSchema>;

export const gameBriefKeyPlySchema = z.object({
  ply: z.number().int().positive(),
  san: z.string().min(1).max(16),
  why: z.string().min(1).max(240),
});
export type GameBriefKeyPly = z.infer<typeof gameBriefKeyPlySchema>;

export const gameBriefDraftSchema = z.object({
  headline: z.string().min(1).max(160),
  story: z.string().min(1).max(900),
  keyPlies: z.array(gameBriefKeyPlySchema).max(6),
  opening: z.string().max(120).nullable(),
  decidedBy: z.string().min(1).max(240),
});
export type GameBriefDraft = z.infer<typeof gameBriefDraftSchema>;

export const gameBriefSchema = gameBriefDraftSchema.extend({
  playerRating: playerRatingContextSchema.nullable(),
});
export type GameBrief = z.infer<typeof gameBriefSchema>;

export const gameBriefRequestSchema = z.object({
  refresh: z.boolean().optional(),
});
export type GameBriefRequest = z.infer<typeof gameBriefRequestSchema>;
