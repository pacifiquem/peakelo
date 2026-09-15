import { describe, expect, it } from 'vitest';
import {
  DRILL_KIND_LABEL,
  drillKindSchema,
  drillMoveBodySchema,
  drillsQuerySchema,
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
});
