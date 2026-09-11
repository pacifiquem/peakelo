import { analyzedPlySchema, bareProfileSchema, type AnalyzedPly } from '@peakelo/shared';
import { describe, expect, it } from 'vitest';
import { START_FEN } from '../src/pgn';
import { analyzePlayerGame, buildBareProfile, type PositionEval } from '../src/pass';

const startEval: PositionEval = {
  lines: [
    { uci: 'e2e4', score: { kind: 'cp', value: 40 }, pvUci: ['e2e4', 'e7e5', 'g1f3'] },
    { uci: 'd2d4', score: { kind: 'cp', value: 30 }, pvUci: ['d2d4'] },
  ],
};

const afterE4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const afterE4Eval: PositionEval = {
  lines: [{ uci: 'e7e5', score: { kind: 'cp', value: 20 }, pvUci: ['e7e5'] }],
};

const afterA3 = 'rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR b KQkq - 0 1';

function ply(partial: Partial<AnalyzedPly> & Pick<AnalyzedPly, 'ply' | 'san' | 'uci' | 'color' | 'isPlayer'>): AnalyzedPly {
  return analyzedPlySchema.parse({
    fenBefore: START_FEN,
    fenAfter: afterE4,
    clockAfterMs: null,
    timeSpentMs: null,
    evalBefore: { kind: 'cp', value: 30 },
    evalAfter: { kind: 'cp', value: 30 },
    bestEval: { kind: 'cp', value: 30 },
    bestUci: 'e2e4',
    bestSan: 'e4',
    pvUci: ['e2e4'],
    pvSan: ['e4'],
    cpl: 0,
    judgment: 'best',
    phase: 'opening',
    opening: { eco: 'B00', name: "King's Pawn Game" },
    opponentFast: false,
    overlooked: [],
    ...partial,
  });
}

describe('analyzePlayerGame', () => {
  it('replays, evaluates, and emits schema-valid player plies', async () => {
    const calls: string[] = [];
    const result = await analyzePlayerGame({
      pgn: '1. e4 e5 *',
      userColor: 'white',
      evaluate: async (fen) => {
        calls.push(fen);
        if (fen === START_FEN) return startEval;
        if (fen.startsWith('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR')) return afterE4Eval;
        return afterE4Eval;
      },
    });

    expect(result.plies).toHaveLength(2);
    expect(result.plies[0]?.isPlayer).toBe(true);
    expect(result.plies[1]?.isPlayer).toBe(false);
    expect(result.plies[0]?.bestSan).toBe('e4');
    expect(result.plies[0]?.secondBestUci).toBe('d2d4');
    expect(result.plies[0]?.secondBestEval).toEqual({ kind: 'cp', value: 30 });
    expect(result.plies[0]?.evalBefore).toEqual({ kind: 'cp', value: 40 });
    expect(result.plies[1]?.evalBefore).toEqual(result.plies[0]?.evalAfter);
    expect(result.plies[0]?.cpl).toBe(0);
    expect(result.plies[0]?.judgment).toBe('best');
    expect(result.plies[0]?.opening?.name).toBe("King's Pawn Game");
    expect(result.opening?.eco).toBe('C20');
    expect(result.playerAcpl).toBe(0);
    expect(calls.filter((fen) => fen === START_FEN)).toHaveLength(1);
    for (const analyzed of result.plies) {
      expect(analyzedPlySchema.parse(analyzed).ply).toBe(analyzed.ply);
    }
  });

  it('evaluates fenAfter once when the played move is missing from MultiPV', async () => {
    const afterCalls: string[] = [];
    const result = await analyzePlayerGame({
      pgn: '1. a3 *',
      userColor: 'white',
      evaluate: async (fen) => {
        if (fen === START_FEN) {
          return { lines: [{ uci: 'e2e4', score: { kind: 'cp', value: 50 }, pvUci: ['e2e4'] }] };
        }
        afterCalls.push(fen);
        return {
          played: { uci: 'a2a3', score: { kind: 'cp', value: 0 }, pvUci: ['a2a3'] },
          lines: [{ uci: 'e7e5', score: { kind: 'cp', value: 0 }, pvUci: ['e7e5'] }],
        };
      },
    });

    expect(afterCalls).toEqual([afterA3]);
    expect(result.plies[0]?.cpl).toBe(50);
    expect(result.plies[0]?.judgment).toBe('inaccuracy');
    expect(result.playerAcpl).toBe(50);
  });

  it('derives time spent from the previous clock of the same color', async () => {
    const pgn = `1. e4 {[%clk 0:10:00]} e5 {[%clk 0:10:00]} 2. Nf3 {[%clk 0:09:50]} *`;
    const result = await analyzePlayerGame({
      pgn,
      userColor: 'white',
      evaluate: async (fen) => {
        if (fen === START_FEN) return startEval;
        return {
          lines: [
            { uci: 'e7e5', score: { kind: 'cp', value: 20 }, pvUci: ['e7e5'] },
            { uci: 'g1f3', score: { kind: 'cp', value: 20 }, pvUci: ['g1f3'] },
            { uci: 'b8c6', score: { kind: 'cp', value: 20 }, pvUci: ['b8c6'] },
          ],
        };
      },
    });

    expect(result.plies[0]?.timeSpentMs).toBeNull();
    expect(result.plies[0]?.clockAfterMs).toBe(10 * 60 * 1000);
    expect(result.plies[2]?.timeSpentMs).toBe(10 * 1000);
    expect(result.plies[2]?.clockAfterMs).toBe(9 * 60 * 1000 + 50 * 1000);
  });

  it('adds increment from TimeControl so a 3+2 think is not zero', async () => {
    const pgn = `[TimeControl "180+2"]

1. e4 {[%clk 0:03:00]} e5 {[%clk 0:03:00]} 2. Nf3 {[%clk 0:02:59]} *`;
    const result = await analyzePlayerGame({
      pgn,
      userColor: 'white',
      evaluate: async (fen) => {
        if (fen === START_FEN) return startEval;
        return {
          lines: [
            { uci: 'e7e5', score: { kind: 'cp', value: 20 }, pvUci: ['e7e5'] },
            { uci: 'g1f3', score: { kind: 'cp', value: 20 }, pvUci: ['g1f3'] },
          ],
        };
      },
    });
    expect(result.plies[0]?.timeSpentMs).toBe(2000);
    expect(result.plies[2]?.timeSpentMs).toBe(3000);
  });
});

describe('buildBareProfile', () => {
  it('aggregates scorelines, openings, mistakes, and clocks without inventing prose', () => {
    const games = [
      {
        gameId: 'g1',
        timeControl: 'rapid' as const,
        userColor: 'white' as const,
        result: '1-0' as const,
        plies: [
          ply({
            ply: 1,
            san: 'e4',
            uci: 'e2e4',
            color: 'white',
            isPlayer: true,
            cpl: 20,
            judgment: 'good',
            timeSpentMs: 4000,
            clockAfterMs: 560_000,
          }),
          ply({
            ply: 2,
            san: 'c5',
            uci: 'c7c5',
            color: 'black',
            isPlayer: false,
            opening: { eco: 'B20', name: 'Sicilian Defense' },
          }),
          ply({
            ply: 3,
            san: 'Qh5',
            uci: 'd1h5',
            color: 'white',
            isPlayer: true,
            cpl: 320,
            judgment: 'blunder',
            bestSan: 'Nf3',
            opening: { eco: 'B20', name: 'Sicilian Defense' },
            overlooked: ['missed_capture', 'material_loss'],
            timeSpentMs: 800,
            clockAfterMs: 15_000,
            opponentFast: true,
            pvUci: ['g1f3', 'b8c6', 'f1b5'],
            phase: 'opening',
          }),
        ],
      },
      {
        gameId: 'g2',
        timeControl: 'blitz' as const,
        userColor: 'black' as const,
        result: '0-1' as const,
        plies: [
          ply({
            ply: 1,
            san: 'e4',
            uci: 'e2e4',
            color: 'white',
            isPlayer: false,
          }),
          ply({
            ply: 2,
            san: 'e5',
            uci: 'e7e5',
            color: 'black',
            isPlayer: true,
            cpl: 10,
            judgment: 'best',
            opening: { eco: 'C20', name: "King's Pawn Game" },
            timeSpentMs: 2000,
            clockAfterMs: 170_000,
          }),
        ],
      },
    ];

    const profile = buildBareProfile(games, 12);
    expect(bareProfileSchema.parse(profile).depth).toBe(12);
    expect(profile.games).toBe(2);
    expect(profile.playerMoves).toBe(3);
    expect(profile.byTimeControl.rapid?.wins).toBe(1);
    expect(profile.byTimeControl.rapid?.acpl).toBe((20 + 320) / 2);
    expect(profile.byTimeControl.blitz?.wins).toBe(1);
    expect(profile.asWhite.games).toBe(1);
    expect(profile.asWhite.score).toBe(1);
    expect(profile.asWhite.firstMoves[0]).toMatchObject({ san: 'e4', games: 1, score: 1 });
    expect(profile.asBlack.firstMoves[0]).toMatchObject({ san: 'e5', games: 1 });
    expect(profile.openings[0]?.eco).toBe('B20');
    expect(profile.openings[0]?.blunders).toBe(1);
    expect(profile.openings[0]?.citations).toHaveLength(1);
    expect(profile.openings[0]?.citations[0]?.gameId).toBe('g1');
    expect(profile.structures.length).toBeGreaterThan(0);
    expect(profile.mistakes.some((row) => row.overlooked === 'missed_capture' && row.count === 1)).toBe(true);
    expect(profile.tactics.some((row) => row.depth === 1 && row.missed === 1)).toBe(true);
    expect(profile.clock.blundersUnder3s).toBe(1);
    expect(profile.clock.blundersWithUnder20sLeft).toBe(1);
    expect(profile.clock.opponentFastBlunders).toBe(1);
    expect(profile.phases.opening.blunders).toBe(1);
    expect(profile).not.toHaveProperty('playerType');
  });

  it('returns zeroed aggregates for an empty game list', () => {
    const profile = buildBareProfile([], 12);
    expect(bareProfileSchema.parse(profile).games).toBe(0);
    expect(profile.playerMoves).toBe(0);
    expect(profile.asWhite.score).toBe(0);
    expect(profile.clock.avgTimeSpentMs).toBeNull();
  });
});
