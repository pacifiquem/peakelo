import { z } from 'zod';

import { trainingFocusSchema } from './enums';
import { lessonArrowSchema, lessonSegmentSchema } from './lesson';
import { evalScoreSchema, overlookedSchema } from './profile';
import { publicWriteupSchema } from './writeup';

export const drillKindSchema = z.enum([
  'blunder_preventer',
  'replay_mistake',
  'defend_worse',
  'convert_advantage',
  'make_plan',
]);
export type DrillKind = z.infer<typeof drillKindSchema>;

export const DRILL_KIND_LABEL: Record<DrillKind, string> = {
  blunder_preventer: 'Blunder-preventer',
  replay_mistake: 'Replay the miss',
  defend_worse: 'Defend worse',
  convert_advantage: 'Convert the edge',
  make_plan: 'Make a plan',
};

export const drillStatusSchema = z.enum(['assigned', 'due', 'done', 'retired']);
export type DrillStatus = z.infer<typeof drillStatusSchema>;

export const drillAttemptResultSchema = z.enum(['hit', 'miss', 'abandoned']);
export type DrillAttemptResult = z.infer<typeof drillAttemptResultSchema>;

export const roadmapStepStatusSchema = z.enum(['current', 'upcoming', 'done']);
export type RoadmapStepStatus = z.infer<typeof roadmapStepStatusSchema>;

export const destsSchema = z.record(z.string().length(2), z.array(z.string().length(2)));

export const drillInsightSchema = z.object({
  headline: z.string().min(1).max(160),
  segments: z.array(lessonSegmentSchema).min(1).max(6),
  arrows: z.array(lessonArrowSchema).max(8),
});
export type DrillInsight = z.infer<typeof drillInsightSchema>;

export const publicDrillSchema = z.object({
  id: z.string(),
  kind: drillKindSchema,
  stepId: z.string(),
  fen: z.string().min(1),
  playerColor: z.enum(['white', 'black']),
  sourceGameId: z.string(),
  sourcePly: z.number().int().positive(),
  stem: z.string().min(1).max(500),
  status: drillStatusSchema,
  dueAt: z.string().datetime().nullable(),
  lastAttemptAt: z.string().datetime().nullable(),
  lastResult: drillAttemptResultSchema.nullable(),
  attemptCount: z.number().int().nonnegative(),
  hitCount: z.number().int().nonnegative(),
});
export type PublicDrill = z.infer<typeof publicDrillSchema>;

export const drillPlaySchema = publicDrillSchema.extend({
  dests: destsSchema,
  sideToMove: z.enum(['white', 'black']),
  playedUci: z.array(z.string().min(4).max(5)).max(24),
  playedSan: z.array(z.string().min(2).max(16)).max(24),
  solved: z.boolean(),
  insight: drillInsightSchema.nullable(),
  eval: evalScoreSchema.nullable(),
});
export type DrillPlay = z.infer<typeof drillPlaySchema>;

export const drillMoveBodySchema = z.object({
  playedUci: z.array(z.string().min(4).max(5)).max(24).default([]),
  uci: z.string().min(4).max(5),
});
export type DrillMoveBody = z.infer<typeof drillMoveBodySchema>;

export const drillMoveResultSchema = z.enum(['continue', 'hit', 'miss']);
export type DrillMoveResult = z.infer<typeof drillMoveResultSchema>;

export const drillMoveResponseSchema = z.object({
  result: drillMoveResultSchema,
  fen: z.string(),
  dests: destsSchema,
  lastMove: z.object({ from: z.string().length(2), to: z.string().length(2) }),
  san: z.string().min(2).max(16),
  playedUci: z.array(z.string().min(4).max(5)),
  playedSan: z.array(z.string().min(2).max(16)),
  opponentReply: z
    .object({
      uci: z.string().min(4).max(5),
      san: z.string().min(2).max(16),
    })
    .nullable(),
  insight: drillInsightSchema.nullable(),
  solved: z.boolean(),
  eval: evalScoreSchema.nullable(),
});
export type DrillMoveResponse = z.infer<typeof drillMoveResponseSchema>;

export const drillAskRequestSchema = z.object({
  question: z.string().trim().min(1).max(500),
  playedUci: z.array(z.string().min(4).max(5)).max(24).optional(),
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
export type DrillAskRequest = z.infer<typeof drillAskRequestSchema>;

export const drillsQuerySchema = z.object({
  status: z.enum(['due', 'done', 'all']).default('due'),
  kind: drillKindSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type DrillsQuery = z.infer<typeof drillsQuerySchema>;

export const roadmapStepSchema = z.object({
  id: z.string().min(1).max(40),
  kind: drillKindSchema,
  title: z.string().min(1).max(80),
  why: z.string().min(1).max(400),
  doneWhen: z.string().min(1).max(240),
  status: roadmapStepStatusSchema,
  evidenceGameIds: z.array(z.string()).max(12),
  drillIds: z.array(z.string()).max(40),
  leak: overlookedSchema.nullable(),
  drillsDone: z.number().int().nonnegative().default(0),
  drillsTotal: z.number().int().nonnegative().default(0),
});
export type RoadmapStep = z.infer<typeof roadmapStepSchema>;

export const publicRoadmapSchema = z.object({
  goldRule: z.string().min(1).max(200),
  goal: trainingFocusSchema,
  steps: z.array(roadmapStepSchema).min(1).max(24),
  generatedAt: z.string().datetime(),
});
export type PublicRoadmap = z.infer<typeof publicRoadmapSchema>;

export const drillSetProgressSchema = z.object({
  kind: drillKindSchema,
  due: z.number().int().nonnegative(),
  done: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type DrillSetProgress = z.infer<typeof drillSetProgressSchema>;

export const trainingProgressSchema = z.object({
  goal: trainingFocusSchema,
  goalLabel: z.string(),
  stepsDone: z.number().int().nonnegative(),
  stepsTotal: z.number().int().nonnegative(),
  drillsDue: z.number().int().nonnegative(),
  drillsDone: z.number().int().nonnegative(),
  drillsTotal: z.number().int().nonnegative(),
  drillsDoneThisWeek: z.number().int().nonnegative(),
  sets: z.array(drillSetProgressSchema).max(5),
  leaksStillPresent: z.array(
    z.object({
      overlooked: overlookedSchema,
      label: z.string(),
      recentCount: z.number().int().nonnegative(),
    }),
  ),
  nextDrill: z
    .object({
      id: z.string(),
      stem: z.string(),
      kind: drillKindSchema,
    })
    .nullable(),
});
export type TrainingProgress = z.infer<typeof trainingProgressSchema>;

export const trainingDeskSchema = z.object({
  writeup: publicWriteupSchema,
  roadmap: publicRoadmapSchema.nullable(),
  progress: trainingProgressSchema,
  dueDrills: z.array(publicDrillSchema).max(20),
});
export type TrainingDesk = z.infer<typeof trainingDeskSchema>;

export const writeupRequestSchema = z.object({
  refresh: z.boolean().optional(),
});
export type WriteupRequest = z.infer<typeof writeupRequestSchema>;
