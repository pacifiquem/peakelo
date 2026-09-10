import { DEFAULT_ENGINE_MULTIPV } from '@peakelo/shared';
import { env } from '../../config/env';
import { createStockfishAdapter, type EngineAdapter } from './adapter';
import { resolveStockfishLaunch } from './resolve-stockfish';

export type { EngineAdapter } from './adapter';
export { createFakeAdapter, createStockfishAdapter } from './adapter';
export { resolveStockfishLaunch } from './resolve-stockfish';

let defaultAdapter: EngineAdapter | undefined;

export function getDefaultAdapter(): EngineAdapter {
  const launch = resolveStockfishLaunch(env.STOCKFISH_PATH);
  const path = launch.args[0] ?? launch.command;
  defaultAdapter ??= createStockfishAdapter({
    path,
    depth: env.ENGINE_DEPTH,
    threads: env.ENGINE_THREADS,
    multiPv: DEFAULT_ENGINE_MULTIPV,
  });
  return defaultAdapter;
}

export async function closeDefaultAdapter(): Promise<void> {
  if (!defaultAdapter) return;
  const adapter = defaultAdapter;
  defaultAdapter = undefined;
  await adapter.close();
}
