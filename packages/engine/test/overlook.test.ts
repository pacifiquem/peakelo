import { describe, expect, it } from 'vitest';
import { detectOverlooked, type OverlookInput } from '../src/overlook';

const hangingQueenBefore = '4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1';
const dropQueen = '4k3/8/8/8/3Q4/8/8/4K2r w - - 0 1';
const recaptureBefore = '4k3/8/8/3r4/8/4n3/3Q4/4K3 w - - 0 1';
const checkBefore = '4k3/8/8/8/8/R7/4K3/8 w - - 0 1';
const backRankBefore = '6k1/5ppp/8/8/8/8/8/4K2R w - - 0 1';

function input(partial: Partial<OverlookInput> & Pick<OverlookInput, 'fenBefore' | 'playedUci' | 'bestUci'>): OverlookInput {
  return {
    pvUci: [partial.bestUci],
    judgment: 'good',
    timeSpentMs: null,
    clockAfterMs: null,
    bestScore: { kind: 'cp', value: 80 },
    playedScore: { kind: 'cp', value: 80 },
    ...partial,
  };
}

describe('detectOverlooked', () => {
  it('tags hanging_piece when this move newly leaves a piece en prise', () => {
    const tags = detectOverlooked(
      input({
        fenBefore: '4k3/8/8/8/r7/8/8/3QK3 w - - 0 1',
        playedUci: 'd1d4',
        bestUci: 'e1e2',
        bestScore: { kind: 'cp', value: 80 },
        playedScore: { kind: 'cp', value: -800 },
      }),
    );
    expect(tags).toContain('hanging_piece');
  });

  it('tags hanging_piece when a capture lands on an undefended square', () => {
    const tags = detectOverlooked(
      input({
        fenBefore: recaptureBefore,
        playedUci: 'd2d5',
        bestUci: 'e1e2',
        bestScore: { kind: 'cp', value: 0 },
        playedScore: { kind: 'cp', value: -800 },
      }),
    );
    expect(tags).toContain('hanging_piece');
  });

  it('does not tag hanging_piece on a book move that happens to leave a pawn en prise', () => {
    const tags = detectOverlooked(
      input({
        fenBefore: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
        playedUci: 'g1f3',
        bestUci: 'g1f3',
        judgment: 'best',
        bestScore: { kind: 'cp', value: 30 },
        playedScore: { kind: 'cp', value: 30 },
      }),
    );
    expect(tags).not.toContain('hanging_piece');
  });

  it('tags missed_hanging when the best move takes a hanging piece and the played move does not', () => {
    const tags = detectOverlooked(
      input({
        fenBefore: hangingQueenBefore,
        playedUci: 'e1e2',
        bestUci: 'd2d5',
        bestScore: { kind: 'cp', value: 900 },
        playedScore: { kind: 'cp', value: 0 },
      }),
    );
    expect(tags).toContain('missed_hanging');
  });

  it('tags missed_capture when the best move captures, the played move does not, and cpl is at least 50', () => {
    const tags = detectOverlooked(
      input({
        fenBefore: hangingQueenBefore,
        playedUci: 'e1e2',
        bestUci: 'd2d5',
        bestScore: { kind: 'cp', value: 900 },
        playedScore: { kind: 'cp', value: 0 },
      }),
    );
    expect(tags).toContain('missed_capture');
  });

  it('tags missed_check when the best move checks and cpl is at least 50', () => {
    const tags = detectOverlooked(
      input({
        fenBefore: checkBefore,
        playedUci: 'e2e3',
        bestUci: 'a3a8',
        bestScore: { kind: 'cp', value: 200 },
        playedScore: { kind: 'cp', value: 0 },
      }),
    );
    expect(tags).toContain('missed_check');
    expect(tags).not.toContain('missed_mate');
  });

  it('tags missed_mate when the best score is a mate for the mover', () => {
    const tags = detectOverlooked(
      input({
        fenBefore: backRankBefore,
        playedUci: 'e1e2',
        bestUci: 'h1h8',
        bestScore: { kind: 'mate', value: 1 },
        playedScore: { kind: 'cp', value: 0 },
      }),
    );
    expect(tags).toContain('missed_mate');
  });

  it('tags missed_combination only when the leading PV is a 3+ ply forcing line', () => {
    const combo = detectOverlooked(
      input({
        fenBefore: '3r4/4k3/8/8/8/8/3R4/R3K3 w - - 0 1',
        playedUci: 'e1e2',
        bestUci: 'd2d8',
        pvUci: ['d2d8', 'e7d8', 'a1a8'],
        judgment: 'blunder',
        bestScore: { kind: 'mate', value: 2 },
        playedScore: { kind: 'cp', value: 0 },
      }),
    );
    expect(combo).toContain('missed_combination');

    const onePlyHang = detectOverlooked(
      input({
        fenBefore: hangingQueenBefore,
        playedUci: 'e1e2',
        bestUci: 'd2d5',
        pvUci: ['d2d5', 'e8e7', 'e1e2', 'e7e6', 'e2e3', 'e6e5', 'e3e4', 'e5e4', 'e4e5', 'e4d4', 'd4d5', 'd5d6'],
        judgment: 'blunder',
        bestScore: { kind: 'cp', value: 900 },
        playedScore: { kind: 'cp', value: 0 },
      }),
    );
    expect(onePlyHang).not.toContain('missed_combination');
  });

  it('tags material_loss when the played move keeps less material than the best move', () => {
    const tags = detectOverlooked(
      input({
        fenBefore: hangingQueenBefore,
        playedUci: 'e1e2',
        bestUci: 'd2d5',
        bestScore: { kind: 'cp', value: 900 },
        playedScore: { kind: 'cp', value: 0 },
      }),
    );
    expect(tags).toContain('material_loss');
  });

  it('tags time_scramble on a fast or low-clock mistake', () => {
    expect(
      detectOverlooked(
        input({
          fenBefore: dropQueen,
          playedUci: 'e1e2',
          bestUci: 'e1d1',
          judgment: 'blunder',
          timeSpentMs: 800,
        }),
      ),
    ).toContain('time_scramble');
    expect(
      detectOverlooked(
        input({
          fenBefore: dropQueen,
          playedUci: 'e1e2',
          bestUci: 'e1d1',
          judgment: 'mistake',
          clockAfterMs: 15_000,
        }),
      ),
    ).toContain('time_scramble');
    expect(
      detectOverlooked(
        input({
          fenBefore: dropQueen,
          playedUci: 'e1e2',
          bestUci: 'e1d1',
          judgment: 'good',
          timeSpentMs: 800,
        }),
      ),
    ).not.toContain('time_scramble');
  });
});
