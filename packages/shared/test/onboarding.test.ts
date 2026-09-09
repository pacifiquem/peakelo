import { describe, expect, it } from 'vitest';
import { FOCUS_NOTE_MAX_LENGTH } from '../src/constants';
import {
  onboardingImportBodySchema,
  onboardingIntentBodySchema,
  onboardingNoteBodySchema,
} from '../src/onboarding';
import { gameSourcesFromAccounts, linkChesscomBodySchema } from '../src/auth';

describe('onboardingIntentBodySchema', () => {
  it('requires a known focus', () => {
    expect(onboardingIntentBodySchema.parse({ trainingFocus: 'tactics' })).toEqual({
      trainingFocus: 'tactics',
    });
  });

  it('drops an empty note', () => {
    expect(
      onboardingIntentBodySchema.parse({ trainingFocus: 'positional', focusNote: '' }),
    ).toEqual({ trainingFocus: 'positional' });
  });

  it('rejects a note that is too long', () => {
    expect(() =>
      onboardingIntentBodySchema.parse({
        trainingFocus: 'tactics',
        focusNote: 'x'.repeat(FOCUS_NOTE_MAX_LENGTH + 1),
      }),
    ).toThrow();
  });
});

describe('onboardingNoteBodySchema', () => {
  it('treats skip as an empty string', () => {
    expect(onboardingNoteBodySchema.parse({ focusNote: null })).toEqual({ focusNote: '' });
  });
});

describe('onboardingImportBodySchema', () => {
  it('requires at least one time control and one source', () => {
    expect(
      onboardingImportBodySchema.parse({
        timeControls: ['rapid'],
        sources: ['lichess', 'chesscom'],
      }),
    ).toEqual({ timeControls: ['rapid'], sources: ['lichess', 'chesscom'] });
  });

  it('rejects an empty time-control or source list', () => {
    expect(() =>
      onboardingImportBodySchema.parse({ timeControls: [], sources: ['chesscom'] }),
    ).toThrow();
    expect(() =>
      onboardingImportBodySchema.parse({ timeControls: ['blitz'], sources: [] }),
    ).toThrow();
  });
});

describe('gameSourcesFromAccounts', () => {
  it('returns both platforms when both are linked', () => {
    expect(
      gameSourcesFromAccounts([
        { provider: 'google' },
        { provider: 'lichess' },
        { provider: 'chesscom' },
      ]),
    ).toEqual(['lichess', 'chesscom']);
  });
});

describe('linkChesscomBodySchema', () => {
  it('accepts a public username', () => {
    expect(linkChesscomBodySchema.parse({ username: 'Hikaru' })).toEqual({ username: 'Hikaru' });
  });

  it('rejects a profile URL', () => {
    expect(() =>
      linkChesscomBodySchema.parse({ username: 'https://www.chess.com/member/hikaru' }),
    ).toThrow();
  });
});
