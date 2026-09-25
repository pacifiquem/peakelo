import { describe, expect, it } from 'vitest';
import type { PublicRoadmap } from '@peakelo/shared';
import { attachDrillProgress, countCompleted, summarizeSets } from '../src/modules/training/progress';

const roadmap: PublicRoadmap = {
  goldRule: 'Scan checks first.',
  goal: 'blunders',
  generatedAt: '2026-09-20T00:00:00.000Z',
  steps: [
    {
      id: 'blunder-preventer',
      kind: 'blunder_preventer',
      title: 'Stop hanging pieces',
      why: 'Highest-leverage leak.',
      doneWhen: 'You stop hanging a piece for free in the next 15 rated games.',
      status: 'current',
      evidenceGameIds: ['g1'],
      drillIds: ['d1', 'd2'],
      leak: 'hanging_piece',
      drillsDone: 0,
      drillsTotal: 0,
    },
    {
      id: 'replay-mistake',
      kind: 'replay_mistake',
      title: 'Replay the miss',
      why: 'Name the move.',
      doneWhen: 'The same miss does not repeat in the next 15 games.',
      status: 'upcoming',
      evidenceGameIds: ['g2'],
      drillIds: ['d3'],
      leak: 'missed_combination',
      drillsDone: 0,
      drillsTotal: 0,
    },
  ],
};

describe('drill progress', () => {
  it('attaches live completion counts onto each roadmap step', () => {
    const next = attachDrillProgress(roadmap, [
      { kind: 'blunder_preventer', stepId: 'blunder-preventer', status: 'done' },
      { kind: 'blunder_preventer', stepId: 'blunder-preventer', status: 'due' },
      { kind: 'replay_mistake', stepId: 'replay-mistake', status: 'done' },
    ]);
    expect(next.steps[0]).toMatchObject({ drillsDone: 1, drillsTotal: 2 });
    expect(next.steps[1]).toMatchObject({ drillsDone: 1, drillsTotal: 1 });
  });

  it('summarizes completed drills by set and overall', () => {
    const drills = [
      { kind: 'blunder_preventer' as const, stepId: 'blunder-preventer', status: 'done' as const },
      { kind: 'blunder_preventer' as const, stepId: 'blunder-preventer', status: 'due' as const },
      { kind: 'make_plan' as const, stepId: 'make-a-plan', status: 'assigned' as const },
    ];
    expect(summarizeSets(drills)).toEqual([
      { kind: 'blunder_preventer', due: 1, done: 1, total: 2 },
      { kind: 'make_plan', due: 1, done: 0, total: 1 },
    ]);
    expect(countCompleted(drills)).toEqual({ done: 1, due: 2, total: 3 });
  });
});
