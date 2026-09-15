import { describe, expect, it } from 'vitest';
import type { BareProfile } from '@peakelo/shared';
import { compactSnapshot } from '../src/modules/training/service';

const citation = {
  gameId: 'g1',
  ply: 17,
  san: 'Qxe3',
  playedSan: 'Qxe3',
  bestSan: 'Bd2',
  fenBefore: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  cpl: 600,
};

const snapshot: BareProfile = {
  generatedAt: '2026-09-12T00:00:00.000Z',
  depth: 12,
  games: 1,
  playerMoves: 1,
  byTimeControl: {},
  asWhite: { games: 1, score: 0, acpl: 80, firstMoves: [] },
  asBlack: { games: 0, score: 0, acpl: 0, firstMoves: [] },
  openings: [
    {
      eco: 'D00',
      name: 'Queen Pawn',
      color: 'white',
      games: 3,
      score: 0.4,
      acpl: 80.4,
      blunders: 1,
      citations: [citation],
    },
  ],
  structures: [],
  mistakes: [{ overlooked: 'hanging_piece', count: 1, avgCpl: 80.4, citations: [citation] }],
  tactics: [],
  clock: {
    avgTimeSpentMs: null,
    blundersUnder3s: 0,
    blundersWithUnder20sLeft: 0,
    opponentFastBlunders: 0,
  },
  phases: {
    opening: { moves: 1, acpl: 80, blunders: 0, blunderRate: 0 },
    middlegame: { moves: 0, acpl: 0, blunders: 0, blunderRate: 0 },
    endgame: { moves: 0, acpl: 0, blunders: 0, blunderRate: 0 },
  },
};

describe('compactSnapshot', () => {
  it('keeps gameId and SAN and drops FEN from citations', () => {
    const compact = compactSnapshot(snapshot);
    expect(compact.mistakes[0]?.citations[0]).toEqual({
      gameId: 'g1',
      ply: 17,
      playedSan: 'Qxe3',
      bestSan: 'Bd2',
    });
    expect(JSON.stringify(compact)).not.toContain('fenBefore');
    expect(compact.openings[0]?.acpl).toBe(80);
  });
});
