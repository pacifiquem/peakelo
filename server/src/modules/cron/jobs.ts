import { enginePassJob } from './engine-pass';
import { gameSyncJob } from './game-sync';
import { previewPassJob } from './preview-pass';
import { trainingPassJob } from './training-pass';
import type { CronJob } from './scheduler';

export const cronJobs: readonly CronJob[] = [gameSyncJob, enginePassJob, trainingPassJob, previewPassJob];
