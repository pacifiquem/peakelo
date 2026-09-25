import { describe, expect, it } from 'vitest';
import {
  DRILL_KIND_LABEL,
  drillKindSchema,
  drillMoveBodySchema,
  drillsQuerySchema,
  publicRoadmapSchema,
  trainingProgressSchema,
} from '../src/drills';

describe('drill contracts', () => {
  it('names the five ADR 0006 kinds', () => {
    expect(drillKindSchema.options).toEqual([
      'blunder_preventer',
      'replay_mistake',
      'defend_worse',
      'convert_advantage',
      'make_plan',
    ]);
    expect(DRILL_KIND_LABEL.make_plan).toBe('Make a plan');
  });

  it('defaults a move body to an empty played line', () => {
    expect(drillMoveBodySchema.parse({ uci: 'e2e4' }).playedUci).toEqual([]);
  });

  it('defaults the queue filter to due', () => {
    expect(drillsQuerySchema.parse({}).status).toBe('due');
  });

  it('defaults missing drill completion counts on a stored roadmap step', () => {
    const parsed = publicRoadmapSchema.parse({
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
          evidenceGameIds: [],
          drillIds: ['d1'],
          leak: 'hanging_piece',
        },
      ],
    });
    expect(parsed.steps[0]?.drillsDone).toBe(0);
    expect(parsed.steps[0]?.drillsTotal).toBe(0);
  });

  it('requires all-time drill completion on training progress', () => {
    const parsed = trainingProgressSchema.parse({
      goal: 'blunders',
      goalLabel: 'Scan checks first.',
      stepsDone: 1,
      stepsTotal: 2,
      drillsDue: 3,
      drillsDone: 4,
      drillsTotal: 7,
      drillsDoneThisWeek: 2,
      sets: [{ kind: 'blunder_preventer', due: 3, done: 4, total: 7 }],
      leaksStillPresent: [],
      nextDrill: null,
    });
    expect(parsed.drillsDone).toBe(4);
    expect(parsed.sets[0]?.done).toBe(4);
  });
});
