import { describe, expect, it } from 'vitest';
import { START_FEN } from '../src/pgn';
import { gamePhase } from '../src/phase';

describe('gamePhase', () => {
  it('treats the start position as opening through ply 20', () => {
    expect(gamePhase(START_FEN, 1)).toBe('opening');
    expect(gamePhase(START_FEN, 20)).toBe('opening');
  });

  it('is middlegame once queens remain after ply 20', () => {
    expect(gamePhase(START_FEN, 21)).toBe('middlegame');
  });

  it('is endgame when no queens remain', () => {
    expect(gamePhase('4k3/8/8/8/8/8/8/4K3 w - - 0 1', 8)).toBe('endgame');
  });

  it('is endgame when six or fewer non-pawn pieces besides kings remain', () => {
    expect(gamePhase('4k3/8/8/8/8/8/4Q3/4K2R w - - 0 1', 12)).toBe('endgame');
  });
});
