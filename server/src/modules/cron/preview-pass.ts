import { PUBLIC_REVIEW_INTERVAL_MS } from '@peakelo/shared';
import { runPreviewTick } from '../preview/service';
import type { CronJob } from './scheduler';

export const previewPassJob: CronJob = {
  name: 'preview-pass',
  intervalMs: PUBLIC_REVIEW_INTERVAL_MS,
  run: () => runPreviewTick(),
};
