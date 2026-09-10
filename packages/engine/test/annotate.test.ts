import type { AnalyzedPly } from '@peakelo/shared';
import { describe, expect, it } from 'vitest';
import {
  annotatePly,
  evalAtPly,
  formatEvalScore,
  isBrilliant,
  isMiss,
  isPieceSacrifice,
  nextBestUci,
  whiteEvalShare,
} from '../src/annotate';
import { START_FEN } from '../src/pgn';

const afterE4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const hangingQueenBefore = '4k3/6p1/8/8/8/8/3Q4/4K3 w - - 0 1';
const hangingQueenAfter = '4k3/6p1/7Q/8/8/8/8/4K3 b - - 0 1';
const rxc1Before = 'r3k2r/pp3ppp/5n2/4N3/3pP3/P1bP3P/5PB1/2n2RK1 w kq - 0 19';
const rxc1After = 'r3k2r/pp3ppp/5n2/4N3/3pP3/P1bP3P/5PB1/2R3K1 b kq - 0 19';

function ply(partial: Partial<AnalyzedPly> & Pick<AnalyzedPly, 'judgment'>): AnalyzedPly {
  return {
    ply: 1,
    san: 'e4',
    uci: 'e2e4',
    fenBefore: START_FEN,
    fenAfter: afterE4,
    color: 'white',
    isPlayer: true,
    clockAfterMs: null,
    timeSpentMs: null,
    evalBefore: { kind: 'cp', value: 20 },
    evalAfter: { kind: 'cp', value: 20 },
    bestEval: { kind: 'cp', value: 20 },
    bestUci: 'e2e4',
    bestSan: 'e4',
    pvUci: ['e2e4'],
    pvSan: ['e4'],
    cpl: 0,
    phase: 'opening',
    opening: null,
    opponentFast: false,
    overlooked: [],
    ...partial,
  };
}

describe('annotatePly — Chess.com specials', () => {
  it('keeps a developing best move as best, not brilliant', () => {
    expect(annotatePly(ply({ judgment: 'best' }))).toBe('best');
  });

  it('tags a sound hanging-piece offer as brilliant when not already winning', () => {
    const move = ply({
      judgment: 'best',
      cpl: 0,
      uci: 'd2h6',
      san: 'Qh6',
      bestUci: 'd2h6',
      fenBefore: hangingQueenBefore,
      fenAfter: hangingQueenAfter,
      evalBefore: { kind: 'cp', value: 40 },
      evalAfter: { kind: 'cp', value: 80 },
      bestEval: { kind: 'cp', value: 80 },
    });
    expect(isPieceSacrifice(move)).toBe(true);
    expect(isBrilliant(move)).toBe(true);
    expect(annotatePly(move)).toBe('brilliant');
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

  it('marks a miss only when the best move was winning and the played move was not', () => {
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
