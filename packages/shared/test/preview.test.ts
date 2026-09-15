import { describe, expect, it } from 'vitest';
import { publicReviewRequestSchema, publicReviewWriteupSchema } from '../src/preview';

describe('publicReviewRequestSchema', () => {
  it('rejects an empty paste', () => {
    expect(() => publicReviewRequestSchema.parse({ url: '' })).toThrow();
  });

  it('accepts a long game URL', () => {
    expect(
      publicReviewRequestSchema.parse({ url: 'https://lichess.org/q7ZvsdUF' }).url,
    ).toBe('https://lichess.org/q7ZvsdUF');
  });
});

describe('publicReviewWriteupSchema', () => {
  it('requires a cited key ply', () => {
    expect(() =>
      publicReviewWriteupSchema.parse({
        headline: 'The hang on e3 decided it.',
        story: 'White left the queen.',
        decidedBy: 'A hanging queen.',
        opening: null,
        keyPlies: [],
        whiteHabit: 'Check the queen.',
        blackHabit: 'Take free pieces.',
      }),
    ).toThrow();
  });
});
