import { afterAll, describe, expect, it } from 'vitest';
import { createStockfishAdapter } from '../src/modules/engine/adapter';
import { resolveStockfishLaunch } from '../src/modules/engine/resolve-stockfish';

const launch = resolveStockfishLaunch();
const hasNative = launch.source === 'path' && launch.args.length === 0;

describe.skipIf(!hasNative)('live Stockfish', () => {
  const adapter = createStockfishAdapter({
    path: launch.command,
    depth: 6,
    threads: 1,
    multiPv: 1,
  });

  afterAll(async () => {
    await adapter.close();
  });

  it('returns a legal first move from the start position', async () => {
    const result = await adapter.evaluate(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    );
    expect(result.lines[0]?.uci).toMatch(/^[a-h][1-8][a-h][1-8]/);
    expect(result.lines[0]?.score.kind).toBe('cp');
  });
});
