import type { ImportStatus, OnboardingStep, TrainingFocus } from '@peakelo/shared';

export function resolveOnboardingStep(input: {
  hasChessPlatform: boolean;
  trainingFocus: TrainingFocus | null;
  noteAsked: boolean;
  importStatus: ImportStatus;
  completedAt: Date | null;
}): OnboardingStep {
  if (input.completedAt && input.importStatus === 'completed') return 'done';
  if (!input.hasChessPlatform) return 'connect';
  if (!input.trainingFocus) return 'focus';
  if (!input.noteAsked) return 'note';
  if (input.importStatus !== 'completed') return 'import';
  return 'done';
}
