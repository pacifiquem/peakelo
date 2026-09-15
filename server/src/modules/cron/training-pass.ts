import { TRAINING_PASS_INTERVAL_MS } from '@peakelo/shared';
import { runTrainingTick } from '../training/service';
import type { CronJob } from './scheduler';

export const trainingPassJob: CronJob = {
  name: 'training-pass',
  intervalMs: TRAINING_PASS_INTERVAL_MS,
  run: () => runTrainingTick(),
};
