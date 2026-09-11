import type { AnalyzedPly } from '@peakelo/shared';
import { describe, expect, it } from 'vitest';
import {
  annotatePly,
  evalAtPly,
  formatEvalScore,
  isBrilliant,
  isGreat,
  isMiss,
  isPieceSacrifice,
  nextBestUci,
  whiteEvalShare,
} from '../src/annotate';
import { START_FEN } from '../src/pgn';

const afterE4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const quietBefore = '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1';
const quietAfter = '4k3/8/8/8/4P3/8/8/4K3 b - - 0 1';
const hangingQueenBefore = '4k3/6p1/8/8/8/8/3Q4/4K3 w - - 0 1';
const hangingQueenAfter = '4k3/6p1/7Q/8/8/8/8/4K3 b - - 0 1';
const rxc1Before = 'r3k2r/pp3ppp/5n2/4N3/3pP3/P1bP3P/5PB1/2n2RK1 w kq - 0 19';
const rxc1After = 'r3k2r/pp3ppp/5n2/4N3/3pP3/P1bP3P/5PB1/2R3K1 b kq - 0 19';

function ply(partial: Partial<AnalyzedPly> & Pick<AnalyzedPly, 'judgment'>): AnalyzedPly {
  return {
    ply: 40,
    san: 'e4',
    uci: 'e2e4',
    fenBefore: quietBefore,
    fenAfter: quietAfter,
    color: 'white',
    isPlayer: true,
    clockAfterMs: null,
    timeSpentMs: null,
    evalBefore: { kind: 'cp', value: 0 },
    evalAfter: { kind: 'cp', value: 0 },
    bestEval: { kind: 'cp', value: 0 },
    bestUci: 'e2e4',
    bestSan: 'e4',
    pvUci: ['e2e4'],
    pvSan: ['e4'],
    cpl: 0,
    phase: 'endgame',
    opening: null,
    opponentFast: false,
    overlooked: [],
    ...partial,
  };
}

describe('annotatePly — Chess.com Classification V2 expected points', () => {
  it('labels an exact engine top move as best', () => {
    expect(annotatePly(ply({ judgment: 'best' }))).toBe('best');
  });

  it('labels a tiny expected-points leak as excellent, not best', () => {
    expect(
      annotatePly(
        ply({
          judgment: 'best',
          uci: 'e1e2',
          bestUci: 'e2e4',
          evalAfter: { kind: 'cp', value: -15 },
          bestEval: { kind: 'cp', value: 0 },
          cpl: 15,
        }),
      ),
    ).toBe('excellent');
  });

  it('labels a small expected-points leak as good', () => {
    expect(
      annotatePly(
        ply({
          judgment: 'good',
          uci: 'e1e2',
          bestUci: 'e2e4',
          evalAfter: { kind: 'cp', value: -30 },
          bestEval: { kind: 'cp', value: 0 },
          cpl: 30,
        }),
      ),
    ).toBe('good');
  });

  it('keeps the published inaccuracy / mistake / blunder cuts', () => {
    expect(
      annotatePly(
        ply({
          judgment: 'inaccuracy',
          uci: 'e1e2',
          bestUci: 'e2e4',
          evalAfter: { kind: 'cp', value: -80 },
          bestEval: { kind: 'cp', value: 0 },
          cpl: 80,
        }),
      ),
    ).toBe('inaccuracy');
    expect(
      annotatePly(
        ply({
          judgment: 'mistake',
          uci: 'e1e2',
          bestUci: 'e2e4',
          evalAfter: { kind: 'cp', value: -150 },
          bestEval: { kind: 'cp', value: 0 },
          cpl: 150,
        }),
      ),
    ).toBe('mistake');
    expect(
      annotatePly(
        ply({
          judgment: 'blunder',
          uci: 'e1e2',
          bestUci: 'e2e4',
          evalAfter: { kind: 'cp', value: -300 },
          bestEval: { kind: 'cp', value: 0 },
          cpl: 300,
        }),
      ),
    ).toBe('blunder');
  });
});

describe('annotatePly — Chess.com specials', () => {
  it('tags a sound hanging-piece offer as brilliant when not already winning', () => {
    const move = ply({
      judgment: 'best',
      cpl: 0,
      uci: 'd2h6',
      san: 'Qh6',
      bestUci: 'd2h6',
      fenBefore: hangingQueenBefore,
      fenAfter: hangingQueenAfter,
      evalBefore: { kind: 'cp', value: 80 },
      evalAfter: { kind: 'cp', value: 80 },
      bestEval: { kind: 'cp', value: 80 },
      secondBestUci: 'e1e2',
      secondBestEval: { kind: 'cp', value: 40 },
    });
    expect(isPieceSacrifice(move)).toBe(true);
    expect(isBrilliant(move)).toBe(true);
    expect(annotatePly(move)).toBe('brilliant');
  });

  it('still tags a winning sacrifice as brilliant when the second line is not already winning', () => {
    const move = ply({
      judgment: 'best',
      cpl: 0,
      uci: 'd2h6',
      san: 'Qh6',
      bestUci: 'd2h6',
      fenBefore: hangingQueenBefore,
      fenAfter: hangingQueenAfter,
      evalBefore: { kind: 'cp', value: 400 },
      evalAfter: { kind: 'cp', value: 400 },
      bestEval: { kind: 'cp', value: 400 },
      secondBestUci: 'e1e2',
      secondBestEval: { kind: 'cp', value: 40 },
    });
    expect(isBrilliant(move)).toBe(true);
    expect(annotatePly(move)).toBe('brilliant');
  });

  it('does not tag a sacrifice as brilliant when you were already winning without it', () => {
    const move = ply({
      judgment: 'best',
      cpl: 0,
      uci: 'd2h6',
      san: 'Qh6',
      bestUci: 'd2h6',
      fenBefore: hangingQueenBefore,
      fenAfter: hangingQueenAfter,
      evalBefore: { kind: 'cp', value: 400 },
      evalAfter: { kind: 'cp', value: 400 },
      bestEval: { kind: 'cp', value: 400 },
      secondBestUci: 'e1e2',
      secondBestEval: { kind: 'cp', value: 400 },
    });
    expect(isBrilliant(move)).toBe(false);
    expect(annotatePly(move)).toBe('best');
  });

  it('does not call Rxc1 a brilliant recapture while already losing', () => {
    const move = ply({
      judgment: 'best',
      cpl: 0,
      ply: 37,
      san: 'Rxc1',
      uci: 'f1c1',
      bestUci: 'f1c1',
      bestSan: 'Rxc1',
      fenBefore: rxc1Before,
      fenAfter: rxc1After,
      evalBefore: { kind: 'cp', value: -500 },
      evalAfter: { kind: 'cp', value: -500 },
      bestEval: { kind: 'cp', value: -500 },
    });
    expect(isPieceSacrifice(move)).toBe(false);
    expect(isBrilliant(move)).toBe(false);
    expect(annotatePly(move)).toBe('best');
  });

  it('marks a miss when the best line was winning and the played line was not', () => {
    const move = ply({
      judgment: 'inaccuracy',
      cpl: 80,
      uci: 'e2e3',
      bestUci: 'd1h5',
      evalBefore: { kind: 'cp', value: 40 },
      evalAfter: { kind: 'cp', value: 30 },
      bestEval: { kind: 'cp', value: 420 },
    });
    expect(isMiss(move)).toBe(true);
    expect(annotatePly(move)).toBe('miss');
  });

  it('does not call a self-destruct a miss', () => {
    const move = ply({
      judgment: 'blunder',
      cpl: 500,
      uci: 'd1h5',
      bestUci: 'e2e4',
      evalBefore: { kind: 'cp', value: 20 },
      evalAfter: { kind: 'cp', value: -800 },
      bestEval: { kind: 'cp', value: 20 },
    });
    expect(isMiss(move)).toBe(false);
    expect(annotatePly(move)).toBe('blunder');
  });

  it('tags a swing from losing to even as a great move', () => {
    const move = ply({
      judgment: 'best',
      uci: 'e2e4',
      bestUci: 'e2e4',
      evalBefore: { kind: 'cp', value: -400 },
      evalAfter: { kind: 'cp', value: 0 },
      bestEval: { kind: 'cp', value: 0 },
      cpl: 0,
    });
    expect(isGreat(move)).toBe(true);
    expect(annotatePly(move)).toBe('great');
  });

  it('tags a swing from even to winning as a great move', () => {
    const move = ply({
      judgment: 'best',
      uci: 'e2e4',
      bestUci: 'e2e4',
      evalBefore: { kind: 'cp', value: 0 },
      evalAfter: { kind: 'cp', value: 400 },
      bestEval: { kind: 'cp', value: 400 },
      cpl: 0,
    });
    expect(isGreat(move)).toBe(true);
    expect(annotatePly(move)).toBe('great');
  });

  it('tags the only good move when every alternative is already a mistake', () => {
    const move = ply({
      judgment: 'best',
      uci: 'e2e4',
      bestUci: 'e2e4',
      evalBefore: { kind: 'cp', value: 0 },
      evalAfter: { kind: 'cp', value: 0 },
      bestEval: { kind: 'cp', value: 0 },
      secondBestUci: 'e1e2',
      secondBestEval: { kind: 'cp', value: -150 },
      cpl: 0,
    });
    expect(isGreat(move)).toBe(true);
    expect(annotatePly(move)).toBe('great');
  });

  it('does not tag a routine best move as great when the second line is only an inaccuracy', () => {
    const move = ply({
      judgment: 'best',
      uci: 'e2e4',
      bestUci: 'e2e4',
      evalBefore: { kind: 'cp', value: 0 },
      evalAfter: { kind: 'cp', value: 0 },
      bestEval: { kind: 'cp', value: 0 },
      secondBestUci: 'e1e2',
      secondBestEval: { kind: 'cp', value: -80 },
      cpl: 0,
    });
    expect(isGreat(move)).toBe(false);
    expect(annotatePly(move)).toBe('best');
  });

  it('labels a named opening move as book when it is not a mistake', () => {
    expect(
      annotatePly(
        ply({
          judgment: 'best',
          ply: 1,
          phase: 'opening',
          opening: { eco: 'B00', name: "King's Pawn Game" },
          fenBefore: START_FEN,
          fenAfter: afterE4,
          evalBefore: { kind: 'cp', value: 20 },
          evalAfter: { kind: 'cp', value: 20 },
          bestEval: { kind: 'cp', value: 20 },
        }),
      ),
    ).toBe('book');
  });

  it('does not label a named but weak opening move as book', () => {
    expect(
      annotatePly(
        ply({
          judgment: 'inaccuracy',
          ply: 1,
          phase: 'opening',
          opening: { eco: 'A00', name: 'Barnes Opening' },
          san: 'f3',
          uci: 'f2f3',
          bestUci: 'e2e4',
          fenBefore: START_FEN,
          fenAfter: 'rnbqkbnr/pppppppp/8/8/8/5P2/PPPPP1PP/RNBQKBNR b KQkq - 0 1',
          evalBefore: { kind: 'cp', value: 20 },
          evalAfter: { kind: 'cp', value: -80 },
          bestEval: { kind: 'cp', value: 20 },
          cpl: 100,
        }),
      ),
    ).toBe('inaccuracy');
  });

  it('calls dumping a win into a lost position a blunder, not a miss', () => {
    const move = ply({
      judgment: 'blunder',
      cpl: 1200,
      uci: 'e1e2',
      bestUci: 'e2e4',
      evalBefore: { kind: 'cp', value: 420 },
      evalAfter: { kind: 'cp', value: -800 },
      bestEval: { kind: 'cp', value: 420 },
    });
    expect(isMiss(move)).toBe(false);
    expect(annotatePly(move)).toBe('blunder');
  });
});

describe('formatEvalScore', () => {
  it('prints pawns with a sign and mates with M', () => {
    expect(formatEvalScore({ kind: 'cp', value: 124 })).toBe('+1.2');
    expect(formatEvalScore({ kind: 'cp', value: -30 })).toBe('-0.3');
    expect(formatEvalScore({ kind: 'cp', value: 0 })).toBe('0.0');
    expect(formatEvalScore({ kind: 'mate', value: 3 })).toBe('M3');
    expect(formatEvalScore({ kind: 'mate', value: -2 })).toBe('-M2');
  });
});

describe('evalAtPly and nextBestUci', () => {
  it('reads eval after the current ply and the next ply’s best UCI', () => {
    const first = ply({ judgment: 'best', ply: 1, evalAfter: { kind: 'cp', value: 40 } });
    const second = ply({
      judgment: 'good',
      ply: 2,
      bestUci: 'g8f6',
      evalBefore: { kind: 'cp', value: 40 },
    });
    expect(evalAtPly([first, second], 0)).toEqual(first.evalBefore);
    expect(evalAtPly([first, second], 1)).toEqual({ kind: 'cp', value: 40 });
    expect(nextBestUci([first, second], 0)).toBe('e2e4');
    expect(nextBestUci([first, second], 1)).toBe('g8f6');
    expect(nextBestUci([first, second], 2)).toBeNull();
  });
});

describe('whiteEvalShare', () => {
  it('is above half when white is better', () => {
    expect(whiteEvalShare({ kind: 'cp', value: 200 })).toBeGreaterThan(0.5);
    expect(whiteEvalShare({ kind: 'cp', value: -200 })).toBeLessThan(0.5);
    expect(whiteEvalShare({ kind: 'mate', value: 1 })).toBeGreaterThan(0.9);
  });
});
