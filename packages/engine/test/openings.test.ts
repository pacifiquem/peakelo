import { describe, expect, it } from 'vitest';
import { lookupOpening, openingFromSans } from '../src/openings/lookup';

describe('openingFromSans', () => {
  it('names the Sicilian after 1. e4 c5', () => {
    expect(openingFromSans(['e4', 'c5'])).toEqual({
      eco: 'B20',
      name: 'Sicilian Defense',
      pgn: '1. e4 c5',
    });
  });

  it('names an Open Game after 1. e4 e5', () => {
    const opening = openingFromSans(['e4', 'e5']);
    expect(opening?.eco.startsWith('C')).toBe(true);
    expect(opening?.name.length).toBeGreaterThan(0);
  });

  it('returns null for a position that is not in the book', () => {
    expect(openingFromSans(['a3', 'h6'])).toBeNull();
    expect(openingFromSans(['e4', 'e4'])).toBeNull();
  });
});

describe('lookupOpening', () => {
  it('matches by EPD after the same moves', () => {
    const fromSans = openingFromSans(['e4', 'c5']);
    const fen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';
    expect(lookupOpening(fen)).toEqual({ eco: fromSans?.eco, name: fromSans?.name });
  });

  it('returns null for an unknown position', () => {
    expect(lookupOpening('8/8/8/8/8/8/8/8 w - - 0 1')).toBeNull();
  });
});
