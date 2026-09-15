import { describe, expect, it } from 'vitest';
import { START_FEN } from '@peakelo/engine';
import type { BareProfile } from '@peakelo/shared';
import { resolveTrainingFocus } from '../src/modules/training/kinds';

const citation = {
  gameId: 'g1',
  ply: 13,
  san: 'Bh6',
  playedSan: 'Bh6',
  bestSan: 'Be3',
  fenBefore: START_FEN,
  cpl: 400,
};

function snapshot(overrides: Partial<BareProfile> = {}): BareProfile {
  return {
    generatedAt: '2026-09-12T00:00:00.000Z',
    depth: 12,
    games: 20,
    playerMoves: 400,
    byTimeControl: {},
    asWhite: { games: 10, score: 0.46, acpl: 49, firstMoves: [] },
    asBlack: { games: 10, score: 0.66, acpl: 40, firstMoves: [] },
    openings: [],
    structures: [],
    mistakes: [{ overlooked: 'hanging_piece', count: 12, avgCpl: 320, citations: [citation] }],
    tactics: [],
    clock: {
      avgTimeSpentMs: 4000,
      blundersUnder3s: 0,
      blundersWithUnder20sLeft: 0,
      opponentFastBlunders: 0,
    },
    phases: {
      opening: { moves: 100, acpl: 20, blunders: 1, blunderRate: 0.01 },
      middlegame: { moves: 200, acpl: 45, blunders: 8, blunderRate: 0.04 },
      endgame: { moves: 100, acpl: 60, blunders: 5, blunderRate: 0.05 },
    },
    ...overrides,
  };
}

describe('resolveTrainingFocus', () => {
  it('keeps an explicit onboarding focus', () => {
    expect(resolveTrainingFocus('openings', snapshot())).toBe('openings');
  });

  it('turns unknown into the loudest leak in the snapshot', () => {
    expect(resolveTrainingFocus('unknown', snapshot())).toBe('blunders');
  });
});
