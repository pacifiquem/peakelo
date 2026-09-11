import { describe, expect, it } from 'vitest';
import {
  START_FEN,
  applyUciLine,
  applyUciLineFrom,
  normalizeEpd,
  piecesFromFen,
  ratingsFromPgn,
  replayPgn,
} from '../src/pgn';

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

describe('normalizeEpd', () => {
  it('drops halfmove and fullmove clocks', () => {
    expect(normalizeEpd('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1')).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3',
    );
  });
});

describe('applyUciLine', () => {
  it('plays a legal line from a fen and returns san', () => {
    const line = applyUciLine(START_FEN, ['e2e4', 'e7e5', 'g1f3']);
    expect(line.legal).toBe(true);
    expect(line.plies.map((ply) => ply.san)).toEqual(['e4', 'e5', 'Nf3']);
    expect(line.fen.startsWith('rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/')).toBe(true);
  });

  it('stops on an illegal move and reports legal false', () => {
    const line = applyUciLine(START_FEN, ['e2e4', 'e2e4']);
    expect(line.legal).toBe(false);
    expect(line.plies.map((ply) => ply.san)).toEqual(['e4']);
  });
});

describe('applyUciLineFrom', () => {
  it('uses the first fen where the line is legal', () => {
    const afterE4 = applyUciLine(START_FEN, ['e2e4']).fen;
    const line = applyUciLineFrom([afterE4, START_FEN], ['e7e5']);
    expect(line.legal).toBe(true);
    expect(line.fromFen).toBe(afterE4);
    expect(line.plies.map((ply) => ply.san)).toEqual(['e5']);
  });

  it('falls back to an earlier fen for an instead-of line', () => {
    const afterE4 = applyUciLine(START_FEN, ['e2e4']).fen;
    const line = applyUciLineFrom([afterE4, START_FEN], ['d2d4']);
    expect(line.legal).toBe(true);
    expect(line.fromFen).toBe(START_FEN);
    expect(line.plies.map((ply) => ply.san)).toEqual(['d4']);
  });
});

describe('ratingsFromPgn', () => {
  it('reads WhiteElo and BlackElo and treats ? as missing', () => {
    const pgn = `[WhiteElo "1842"]
[BlackElo "?"]

1. e4 e5 1-0`;
    expect(ratingsFromPgn(pgn)).toEqual({ white: 1842, black: null });
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
