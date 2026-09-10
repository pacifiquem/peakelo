import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

describe('chessops CJS interop', () => {
  it('can be required (the path nodemon used to crash on)', () => {
    const chessops = require('chessops') as { Chess: unknown };
    expect(typeof chessops.Chess).toBe('function');
  });
});
