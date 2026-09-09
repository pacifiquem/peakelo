import { describe, expect, it } from 'vitest';
import { timeControlSchema } from '../src/enums';

describe('timeControlSchema', () => {
  it('accepts the three import controls', () => {
    expect(timeControlSchema.parse('blitz')).toBe('blitz');
  });

  it('rejects unknown controls', () => {
    expect(() => timeControlSchema.parse('classical')).toThrow();
  });
});
