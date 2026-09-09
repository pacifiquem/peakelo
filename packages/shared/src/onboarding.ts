import { z } from 'zod';
import { FOCUS_NOTE_MAX_LENGTH } from './constants';
import {
  gameSourceSchema,
  importStatusSchema,
  onboardingStepSchema,
  timeControlSchema,
  trainingFocusSchema,
} from './enums';

export const onboardingIntentBodySchema = z.object({
  trainingFocus: trainingFocusSchema,
  focusNote: z
    .string()
    .trim()
    .max(FOCUS_NOTE_MAX_LENGTH)
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
});
export type OnboardingIntentBody = z.infer<typeof onboardingIntentBodySchema>;

export const onboardingNoteBodySchema = z.object({
  focusNote: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => (value ?? '').trim())
    .pipe(z.string().max(FOCUS_NOTE_MAX_LENGTH)),
});
export type OnboardingNoteBody = z.infer<typeof onboardingNoteBodySchema>;

export const onboardingImportBodySchema = z.object({
  timeControls: z.array(timeControlSchema).min(1),
  sources: z.array(gameSourceSchema).min(1),
});
export type OnboardingImportBody = z.infer<typeof onboardingImportBodySchema>;

export const onboardingStateSchema = z.object({
  step: onboardingStepSchema,
  completed: z.boolean(),
  trainingFocus: trainingFocusSchema.nullable(),
  focusNote: z.string().nullable(),
  noteAsked: z.boolean(),
  timeControls: z.array(timeControlSchema),
  importSource: gameSourceSchema.nullable(),
  importStatus: importStatusSchema,
  importedCount: z.number().int().nonnegative(),
  importError: z.string().nullable(),
  hasChessPlatform: z.boolean(),
});
export type OnboardingState = z.infer<typeof onboardingStateSchema>;
