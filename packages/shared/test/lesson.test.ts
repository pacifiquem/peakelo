import { describe, expect, it } from 'vitest';
import { lessonAskRequestSchema, lessonRequestSchema, lessonSchema } from '../src/lesson';

describe('lessonRequestSchema', () => {
  it('coerces ply and allows an empty variation', () => {
    expect(lessonRequestSchema.parse({ ply: '12' })).toEqual({ ply: 12 });
  });

  it('rejects a huge variation', () => {
    expect(() =>
      lessonRequestSchema.parse({ ply: 1, variationUci: Array.from({ length: 25 }, () => 'e2e4') }),
    ).toThrow();
  });
});

describe('lessonAskRequestSchema', () => {
  it('requires a question', () => {
    expect(() => lessonAskRequestSchema.parse({ ply: 3, question: '   ' })).toThrow();
  });
});

describe('lessonSchema', () => {
  it('accepts a two-segment lesson with a clickable line', () => {
    const parsed = lessonSchema.parse({
      ply: 13,
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      headline: 'Take the hanging bishop.',
      segments: [
        { id: 'a', text: 'Bh6 hangs the bishop.' },
        { id: 'b', text: 'Black can take it.', lineUci: ['g7h6'], lineSan: ['Bxh6'] },
      ],
      arrows: [{ from: 'g7', to: 'h6', brush: 'green' }],
      alternatives: [
        {
          san: 'Rad1',
          uci: 'a1d1',
          pvSan: ['Rad1'],
          pvUci: ['a1d1'],
          why: 'Develop and keep the bishop.',
        },
      ],
      sources: [],
    });
    expect(parsed.segments[1]?.lineSan).toEqual(['Bxh6']);
  });
});
