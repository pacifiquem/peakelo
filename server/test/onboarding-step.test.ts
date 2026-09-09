import { describe, expect, it } from 'vitest';
import { resolveOnboardingStep } from '../src/modules/onboarding/step';

describe('resolveOnboardingStep', () => {
  it('asks Google users to connect a chess account first', () => {
    expect(
      resolveOnboardingStep({
        hasChessPlatform: false,
        trainingFocus: null,
        noteAsked: false,
        importStatus: 'idle',
        completedAt: null,
      }),
    ).toBe('connect');
  });

  it('asks for a training focus after a platform is linked', () => {
    expect(
      resolveOnboardingStep({
        hasChessPlatform: true,
        trainingFocus: null,
        noteAsked: false,
        importStatus: 'idle',
        completedAt: null,
      }),
    ).toBe('focus');
  });

  it('shows the optional note once', () => {
    expect(
      resolveOnboardingStep({
        hasChessPlatform: true,
        trainingFocus: 'tactics',
        noteAsked: false,
        importStatus: 'idle',
        completedAt: null,
      }),
    ).toBe('note');
  });

  it('imports after the note step', () => {
    expect(
      resolveOnboardingStep({
        hasChessPlatform: true,
        trainingFocus: 'positional',
        noteAsked: true,
        importStatus: 'idle',
        completedAt: null,
      }),
    ).toBe('import');
  });

  it('is done only after a completed import', () => {
    expect(
      resolveOnboardingStep({
        hasChessPlatform: true,
        trainingFocus: 'tactics',
        noteAsked: true,
        importStatus: 'completed',
        completedAt: new Date(),
      }),
    ).toBe('done');
  });
});
