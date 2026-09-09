import { z } from 'zod';

export const timeControlSchema = z.enum(['bullet', 'blitz', 'rapid']);
export type TimeControl = z.infer<typeof timeControlSchema>;

export const planSchema = z.enum(['analysis', 'training']);
export type Plan = z.infer<typeof planSchema>;

export const gameSourceSchema = z.enum(['chesscom', 'lichess']);
export type GameSource = z.infer<typeof gameSourceSchema>;

export const authProviderSchema = z.enum(['google', 'chesscom', 'lichess']);
export type AuthProvider = z.infer<typeof authProviderSchema>;

export const trainingFocusSchema = z.enum([
  'tactics',
  'positional',
  'blunders',
  'openings',
  'endgames',
  'rating',
  'unknown',
]);
export type TrainingFocus = z.infer<typeof trainingFocusSchema>;

export const TRAINING_FOCUS_LABELS: Record<TrainingFocus, string> = {
  tactics: 'Be good at tactics',
  positional: 'Improve positional play',
  blunders: 'Make fewer blunders',
  openings: 'Build a reliable opening repertoire',
  endgames: 'Convert endgames',
  rating: 'Climb my rating',
  unknown: "I don't know (get from engine analysis)",
};

export const importStatusSchema = z.enum(['idle', 'running', 'completed', 'failed']);
export type ImportStatus = z.infer<typeof importStatusSchema>;

export const onboardingStepSchema = z.enum(['connect', 'focus', 'note', 'import', 'done']);
export type OnboardingStep = z.infer<typeof onboardingStepSchema>;
