import { describe, expect, it } from 'vitest';
import { parseCorsOrigins } from '../src/lib/cors-origins';

describe('parseCorsOrigins', () => {
  it('splits, trims, and strips trailing slashes', () => {
    expect(parseCorsOrigins('http://localhost:3000/, http://127.0.0.1:3000')).toEqual([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
  });

  it('rejects an empty list', () => {
    expect(() => parseCorsOrigins(' , ')).toThrow(/at least one origin/);
  });
});
