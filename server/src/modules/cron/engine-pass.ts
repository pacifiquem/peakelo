import { ENGINE_PASS_INTERVAL_MS } from '@peakelo/shared';
import { runEnginePassTick } from '../profile/tick';
import type { CronJob } from './scheduler';

export const enginePassJob: CronJob = {
  name: 'engine-pass',
  intervalMs: ENGINE_PASS_INTERVAL_MS,
  run: runEnginePassTick,
};
