import { describe, expect, it } from 'vitest';
import { resolveStockfishLaunch } from '../src/modules/engine/resolve-stockfish';

describe('resolveStockfishLaunch', () => {
  it('uses an explicit native binary when the file exists', () => {
    const launch = resolveStockfishLaunch(process.execPath);
    expect(launch.source).toBe('env');
    expect(launch.command).toBe(process.execPath);
    expect(launch.args).toEqual([]);
  });

  it('returns a spawnable command even when the name is missing', () => {
    const launch = resolveStockfishLaunch('definitely-not-a-binary-peakelo');
    expect(launch.command).toBeTruthy();
    expect(Array.isArray(launch.args)).toBe(true);
  });
});
