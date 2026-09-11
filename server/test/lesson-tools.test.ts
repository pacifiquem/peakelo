import { describe, expect, it } from 'vitest';
import { START_FEN } from '@peakelo/engine';
import { createFakeAdapter } from '../src/modules/engine';
import { capLessonDepth, requestEngineLines } from '../src/modules/lesson/tools';

describe('requestEngineLines', () => {
  it('returns MultiPV lines from a fake adapter and caps depth', async () => {
    const seen: string[] = [];
    const adapter = createFakeAdapter((fen) => {
      seen.push(fen);
      return {
        lines: [
          { uci: 'e2e4', score: { kind: 'cp', value: 30 }, pvUci: ['e2e4', 'e7e5'] },
          { uci: 'd2d4', score: { kind: 'cp', value: 25 }, pvUci: ['d2d4'] },
        ],
      };
    });

    expect(capLessonDepth(40)).toBe(16);
    expect(capLessonDepth(2)).toBe(8);

    const result = await requestEngineLines({ fen: START_FEN, depth: 40 }, adapter);
    expect(seen).toEqual([START_FEN]);
    expect(result.depth).toBe(16);
    expect(result.error).toBeUndefined();
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]?.uci).toBe('e2e4');
    await adapter.close();
  });

  it('rejects an invalid fen without calling the adapter', async () => {
    let called = false;
    const adapter = createFakeAdapter(() => {
      called = true;
      return { lines: [] };
    });
    const result = await requestEngineLines({ fen: 'not-a-fen' }, adapter);
    expect(called).toBe(false);
    expect(result.lines).toEqual([]);
    expect(result.error).toBe('invalid fen');
    await adapter.close();
  });
});
