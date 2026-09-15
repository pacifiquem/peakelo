import { z } from 'zod';
import { timeControlSchema } from './enums';

export const enginePassStatusSchema = z.enum(['idle', 'queued', 'running', 'ready', 'failed']);
export type EnginePassStatus = z.infer<typeof enginePassStatusSchema>;

export const gameAnalysisStatusSchema = z.enum(['pending', 'running', 'ready', 'failed']);
export type GameAnalysisStatus = z.infer<typeof gameAnalysisStatusSchema>;

export const judgmentSchema = z.enum(['best', 'good', 'inaccuracy', 'mistake', 'blunder']);
export type Judgment = z.infer<typeof judgmentSchema>;

export const gamePhaseSchema = z.enum(['opening', 'middlegame', 'endgame']);
export type GamePhase = z.infer<typeof gamePhaseSchema>;

export const overlookedSchema = z.enum([
  'hanging_piece',
  'missed_hanging',
  'missed_capture',
  'missed_check',
  'missed_mate',
  'missed_combination',
  'material_loss',
  'time_scramble',
]);
export type Overlooked = z.infer<typeof overlookedSchema>;

export const OVERLOOKED_LABEL: Record<Overlooked, string> = {
  hanging_piece: 'Hanging piece',
  missed_hanging: 'Missed hanging',
  missed_capture: 'Missed capture',
  missed_check: 'Missed check',
  missed_mate: 'Missed mate',
  missed_combination: 'Missed combination',
  material_loss: 'Material loss',
  time_scramble: 'Time scramble',
};

export const evalScoreSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('cp'), value: z.number().int() }),
  z.object({ kind: z.literal('mate'), value: z.number().int() }),
]);
export type EvalScore = z.infer<typeof evalScoreSchema>;

export const openingRefSchema = z.object({
  eco: z.string(),
  name: z.string(),
});
export type OpeningRef = z.infer<typeof openingRefSchema>;

export const citationSchema = z.object({
  gameId: z.string(),
  ply: z.number().int().positive(),
  san: z.string(),
  playedSan: z.string(),
  bestSan: z.string(),
  fenBefore: z.string(),
  cpl: z.number().nonnegative(),
});
export type Citation = z.infer<typeof citationSchema>;

export const enginePassSchema = z.object({
  status: enginePassStatusSchema,
  gamesQueued: z.number().int().nonnegative(),
  gamesReady: z.number().int().nonnegative(),
  gamesFailed: z.number().int().nonnegative(),
  movesAnalyzed: z.number().int().nonnegative(),
  movesTotal: z.number().int().nonnegative(),
  depth: z.number().int().positive(),
  error: z.string().nullable(),
  startedAt: z.string().datetime().nullable(),
  readyAt: z.string().datetime().nullable(),
});
export type EnginePass = z.infer<typeof enginePassSchema>;

export const idleEnginePass = (): EnginePass => ({
  status: 'idle',
  gamesQueued: 0,
  gamesReady: 0,
  gamesFailed: 0,
  movesAnalyzed: 0,
  movesTotal: 0,
  depth: 12,
  error: null,
  startedAt: null,
  readyAt: null,
});

export const analyzedPlySchema = z.object({
  ply: z.number().int().positive(),
  san: z.string(),
  uci: z.string(),
  fenBefore: z.string(),
  fenAfter: z.string(),
  color: z.enum(['white', 'black']),
  isPlayer: z.boolean(),
  clockAfterMs: z.number().int().nonnegative().nullable(),
  timeSpentMs: z.number().int().nonnegative().nullable(),
  evalBefore: evalScoreSchema,
  evalAfter: evalScoreSchema,
  bestEval: evalScoreSchema,
  bestUci: z.string(),
  bestSan: z.string(),
  secondBestUci: z.string().optional(),
  secondBestEval: evalScoreSchema.optional(),
  pvUci: z.array(z.string()),
  pvSan: z.array(z.string()),
  cpl: z.number().nonnegative(),
  judgment: judgmentSchema,
  phase: gamePhaseSchema,
  opening: openingRefSchema.nullable(),
  opponentFast: z.boolean(),
  overlooked: z.array(overlookedSchema),
});
export type AnalyzedPly = z.infer<typeof analyzedPlySchema>;

const scorelineSchema = z.object({
  games: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  draws: z.number().int().nonnegative(),
  acpl: z.number().nonnegative(),
  blundersPerGame: z.number().nonnegative(),
});

export const bareProfileSchema = z.object({
  generatedAt: z.string().datetime(),
  depth: z.number().int().positive(),
  games: z.number().int().nonnegative(),
  playerMoves: z.number().int().nonnegative(),
  byTimeControl: z.record(timeControlSchema, scorelineSchema),
  asWhite: z.object({
    games: z.number().int().nonnegative(),
    score: z.number().nonnegative(),
    acpl: z.number().nonnegative(),
    firstMoves: z.array(
      z.object({
        san: z.string(),
        games: z.number().int().nonnegative(),
        score: z.number().nonnegative(),
        acpl: z.number().nonnegative(),
      }),
    ),
  }),
  asBlack: z.object({
    games: z.number().int().nonnegative(),
    score: z.number().nonnegative(),
    acpl: z.number().nonnegative(),
    firstMoves: z.array(
      z.object({
        san: z.string(),
        games: z.number().int().nonnegative(),
        score: z.number().nonnegative(),
        acpl: z.number().nonnegative(),
      }),
    ),
  }),
  openings: z.array(
    z.object({
      eco: z.string(),
      name: z.string(),
      color: z.enum(['white', 'black']),
      games: z.number().int().nonnegative(),
      score: z.number().nonnegative(),
      acpl: z.number().nonnegative(),
      blunders: z.number().int().nonnegative(),
      citations: z.array(citationSchema),
    }),
  ),
  structures: z.array(
    z.object({
      fingerprint: z.string(),
      games: z.number().int().nonnegative(),
      acpl: z.number().nonnegative(),
      blunders: z.number().int().nonnegative(),
      citations: z.array(citationSchema),
    }),
  ),
  mistakes: z.array(
    z.object({
      overlooked: overlookedSchema,
      count: z.number().int().nonnegative(),
      avgCpl: z.number().nonnegative(),
      citations: z.array(citationSchema),
    }),
  ),
  tactics: z.array(
    z.object({
      depth: z.number().int().positive(),
      missed: z.number().int().nonnegative(),
      citations: z.array(citationSchema),
    }),
  ),
  clock: z.object({
    avgTimeSpentMs: z.number().nonnegative().nullable(),
    blundersUnder3s: z.number().int().nonnegative(),
    blundersWithUnder20sLeft: z.number().int().nonnegative(),
    opponentFastBlunders: z.number().int().nonnegative(),
  }),
  phases: z.record(
    gamePhaseSchema,
    z.object({
      moves: z.number().int().nonnegative(),
      acpl: z.number().nonnegative(),
      blunders: z.number().int().nonnegative(),
      blunderRate: z.number().nonnegative(),
    }),
  ),
});
export type BareProfile = z.infer<typeof bareProfileSchema>;

export const publicProfileSchema = z.object({
  pass: enginePassSchema,
  profile: bareProfileSchema.nullable(),
});
export type PublicProfile = z.infer<typeof publicProfileSchema>;
