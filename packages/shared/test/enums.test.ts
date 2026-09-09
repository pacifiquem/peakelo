import { describe, expect, it } from 'vitest';
import {
  authProviderSchema,
  timeControlSchema,
  TRAINING_FOCUS_LABELS,
  trainingFocusSchema,
} from '../src/enums';

describe('timeControlSchema', () => {
  it('accepts the three import controls', () => {
    expect(timeControlSchema.parse('blitz')).toBe('blitz');
  });

  it('rejects unknown controls', () => {
    expect(() => timeControlSchema.parse('classical')).toThrow();
  });
});

describe('authProviderSchema', () => {
  it('accepts the three login providers', () => {
    expect(authProviderSchema.parse('google')).toBe('google');
    expect(authProviderSchema.parse('lichess')).toBe('lichess');
    expect(authProviderSchema.parse('chesscom')).toBe('chesscom');
  });
});

describe('trainingFocusSchema', () => {
  it('accepts product intents', () => {
    expect(trainingFocusSchema.parse('tactics')).toBe('tactics');
    expect(trainingFocusSchema.parse('positional')).toBe('positional');
    expect(trainingFocusSchema.parse('unknown')).toBe('unknown');
    expect(trainingFocusSchema.parse('blunders')).toBe('blunders');
  });

  it('rejects clock-only and free text', () => {
    expect(() => trainingFocusSchema.parse('time')).toThrow();
    expect(() => trainingFocusSchema.parse('whatever I feel like')).toThrow();
  });

  it('uses general blunder wording and an engine-unknown option', () => {
    expect(TRAINING_FOCUS_LABELS.blunders).toBe('Make fewer blunders');
    expect(TRAINING_FOCUS_LABELS.unknown).toBe("I don't know (get from engine analysis)");
    expect(TRAINING_FOCUS_LABELS).not.toHaveProperty('time');
  });
});
