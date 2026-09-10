import { describe, expect, it } from 'vitest';
import {
  bareProfileSchema,
  enginePassSchema,
  idleEnginePass,
  judgmentSchema,
  overlookedSchema,
  publicProfileSchema,
} from '../src/profile';

describe('enginePassSchema', () => {
  it('accepts the idle default', () => {
    expect(enginePassSchema.parse(idleEnginePass()).status).toBe('idle');
  });
});

describe('judgment and overlooked', () => {
  it('keeps the CPL buckets and motif tags the pass uses', () => {
    expect(judgmentSchema.options).toEqual(['best', 'good', 'inaccuracy', 'mistake', 'blunder']);
    expect(overlookedSchema.options).toContain('missed_combination');
    expect(overlookedSchema.options).toContain('time_scramble');
  });
});

describe('publicProfileSchema', () => {
  it('allows a pass with no snapshot yet', () => {
    const parsed = publicProfileSchema.parse({
      pass: idleEnginePass(),
      profile: null,
    });
    expect(parsed.profile).toBeNull();
  });

  it('rejects a snapshot that invented a player type', () => {
    expect(() =>
      bareProfileSchema.parse({
        generatedAt: '2026-09-10T00:00:00.000Z',
        depth: 12,
        games: 1,
        playerMoves: 1,
        playerType: 'tactical',
      }),
    ).toThrow();
  });
});
