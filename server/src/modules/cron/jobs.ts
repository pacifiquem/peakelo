import { gameSyncJob } from './game-sync';
import type { CronJob } from './scheduler';

export const cronJobs: readonly CronJob[] = [gameSyncJob];
