import { describe, expect, it } from 'vitest';
import { START_FEN, piecesFromFen, replayPgn } from '../src/pgn';

describe('replayPgn', () => {
  it('replays a short mainline and records fen after each ply', () => {
    const replayed = replayPgn('1. e4 e5 2. Nf3 *');
    expect(replayed.startFen).toBe(START_FEN);
    expect(replayed.plies.map((ply) => ply.san)).toEqual(['e4', 'e5', 'Nf3']);
    expect(replayed.plies[0]?.uci).toBe('e2e4');
    expect(replayed.plies[0]?.fen).toContain('/4P3/');
    expect(replayed.plies[2]?.fen.startsWith('rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/')).toBe(true);
  });

  it('reads headers and clock comments from a lichess-style pgn', () => {
    const pgn = `[Event "Rated Rapid"]
[White "alice"]
[Black "bob"]
[Result "1-0"]

1. e4 {[%clk 0:10:00]} e5 {[%clk 0:10:00]} 1-0`;
    const replayed = replayPgn(pgn);
    expect(replayed.plies.map((ply) => ply.san)).toEqual(['e4', 'e5']);
    expect(replayed.plies[0]?.clockAfterMs).toBe(10 * 60 * 1000);
    expect(replayed.plies[1]?.clockAfterMs).toBe(10 * 60 * 1000);
    expect(replayed.plies[0]?.fenBefore).toBe(START_FEN);
  });

  it('reads increment and base time from TimeControl', () => {
    const pgn = `[TimeControl "180+2"]

1. e4 e5 1-0`;
    const replayed = replayPgn(pgn);
    expect(replayed.baseTimeMs).toBe(180_000);
    expect(replayed.incrementMs).toBe(2000);
  });

  it('returns the start position when the pgn has no legal moves', () => {
    expect(replayPgn('')).toEqual({
      startFen: START_FEN,
      plies: [],
      incrementMs: 0,
      baseTimeMs: null,
    });
    expect(replayPgn('not a game').plies).toEqual([]);
  });
});

describe('piecesFromFen', () => {
  it('places the kings and a pawn', () => {
    const pieces = piecesFromFen('4k3/8/8/8/4P3/8/8/4K3 w - - 0 1');
    expect(pieces).toEqual([
      { square: 'e8', role: 'king', color: 'black' },
      { square: 'e4', role: 'pawn', color: 'white' },
      { square: 'e1', role: 'king', color: 'white' },
    ]);
  });
});
