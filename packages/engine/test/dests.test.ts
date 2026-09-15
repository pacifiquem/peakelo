import { describe, expect, it } from 'vitest';
import { START_FEN } from '../src/pgn';
import { isPawnPromotion, legalDests, sideToMove, uciFromSquares } from '../src/dests';

describe('legalDests', () => {
  it('gives the two legal pawn pushes from the start', () => {
    const dests = legalDests(START_FEN);
    expect(dests.e2).toEqual(['e3', 'e4']);
    expect(dests.g1).toEqual(['f3', 'h3']);
    expect(dests.e7).toBeUndefined();
  });

  it('returns nothing for an illegal FEN', () => {
    expect(legalDests('not-a-fen')).toEqual({});
  });

  it('gives black dests when it is black to move', () => {
    const fen = '5r2/q4p1k/3NpQ1p/1P1bP1p1/8/5P1P/6PK/2R5 b - - 0 35';
    const dests = legalDests(fen);
    expect(sideToMove(fen)).toBe('black');
    expect(dests.h7?.length).toBeGreaterThan(0);
    expect(dests.e2).toBeUndefined();
  });
});

describe('sideToMove and promotion', () => {
  it('reads the turn from the FEN', () => {
    expect(sideToMove(START_FEN)).toBe('white');
    expect(sideToMove('8/4P3/8/8/8/8/8/4K2k b - - 0 1')).toBe('black');
  });

  it('marks a white pawn stepping onto the 8th as a promotion', () => {
    const fen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1';
    expect(isPawnPromotion(fen, 'e7', 'e8')).toBe(true);
    expect(uciFromSquares(fen, 'e7', 'e8')).toBe('e7e8q');
    expect(uciFromSquares(START_FEN, 'e2', 'e4')).toBe('e2e4');
  });
});
