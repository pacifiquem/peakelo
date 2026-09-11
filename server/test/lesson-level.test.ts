import { describe, expect, it } from 'vitest';
import { levelGuidance } from '../src/modules/lesson/level';

describe('levelGuidance', () => {
  it('does not guess a rating when the game has none', () => {
    expect(levelGuidance(null)).toContain('No rating');
  });

  it('tells a 200-rated student the center can be a paragraph', () => {
    const text = levelGuidance({
      rating: 200,
      source: 'chesscom',
      timeControl: 'rapid',
      band: 'under400',
      bandLabel: 'Under 400',
    });
    expect(text).toContain('Under 400');
    expect(text).toContain('center');
  });

  it('forbids an e4/d4 lecture at over 2000', () => {
    const text = levelGuidance({
      rating: 2100,
      source: 'lichess',
      timeControl: 'blitz',
      band: 'over2000',
      bandLabel: 'Over 2000',
    });
    expect(text).toContain('Do not lecture e4/d4');
    expect(text).toContain('lichess blitz 2100');
  });
});
