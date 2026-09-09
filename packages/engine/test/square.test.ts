import { describe, expect, it } from 'vitest';
import { isSquare } from '../src/square';

describe('isSquare', () => {
  it('accepts algebraic squares', () => {
    expect(isSquare('e4')).toBe(true);
    expect(isSquare('a1')).toBe(true);
    expect(isSquare('h8')).toBe(true);
  });

  it('rejects non-squares', () => {
    expect(isSquare('e9')).toBe(false);
    expect(isSquare('i4')).toBe(false);
    expect(isSquare('E4')).toBe(false);
  });
});
