import { describe, expect, it } from 'vitest';
import { START_FEN } from '@peakelo/engine';
import { gradeDrillMove } from '../src/modules/training/grade';
import type { DrillInsight } from '@peakelo/shared';

const insight = (headline: string): DrillInsight => ({
  headline,
  segments: [{ id: 'a', text: headline }],
  arrows: [],
});

describe('gradeDrillMove', () => {
  it('hits when the student plays the stored goal move', () => {
    const result = gradeDrillMove({
      startFen: START_FEN,
      goalUci: ['e2e4'],
      playedUci: [],
      moveUci: 'e2e4',
      kind: 'blunder_preventer',
      missInsight: insight('Missed.'),
      hitInsight: insight('That keeps the pawn.'),
    });
    expect(result.result).toBe('hit');
    expect(result.solved).toBe(true);
    expect(result.san).toBe('e4');
    expect(result.insight?.headline).toBe('That keeps the pawn.');
  });

  it('misses a hang and points at the stored save', () => {
    const result = gradeDrillMove({
      startFen: START_FEN,
      goalUci: ['e2e4'],
      playedUci: [],
      moveUci: 'a2a3',
      kind: 'blunder_preventer',
      missInsight: insight('The pawn on e4 was the job.'),
      hitInsight: insight('Hit.'),
    });
    expect(result.result).toBe('miss');
    expect(result.solved).toBe(false);
    expect(result.insight?.arrows[0]).toEqual({ from: 'e2', to: 'e4', brush: 'green' });
  });

  it('accepts a MultiPV alternative on a plan drill', () => {
    const result = gradeDrillMove({
      startFen: START_FEN,
      goalUci: ['e2e4'],
      playedUci: [],
      moveUci: 'd2d4',
      kind: 'make_plan',
      missInsight: insight('Missed.'),
      hitInsight: insight('A real central break.'),
      engineLines: [
        { uci: 'e2e4', score: { kind: 'cp', value: 30 }, pvUci: ['e2e4'] },
        { uci: 'd2d4', score: { kind: 'cp', value: 25 }, pvUci: ['d2d4'] },
      ],
    });
    expect(result.result).toBe('hit');
    expect(result.eval).toEqual({ kind: 'cp', value: 25 });
  });

  it('plays the opponent reply from the stored line and continues', () => {
    const result = gradeDrillMove({
      startFen: START_FEN,
      goalUci: ['e2e4', 'e7e5', 'g1f3'],
      playedUci: [],
      moveUci: 'e2e4',
      kind: 'make_plan',
      missInsight: insight('Missed.'),
      hitInsight: insight('Hit.'),
    });
    expect(result.result).toBe('continue');
    expect(result.opponentReply?.san).toBe('e5');
    expect(result.playedUci).toEqual(['e2e4', 'e7e5']);
    expect(result.solved).toBe(false);
  });
});
