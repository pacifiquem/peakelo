import { cronJobs } from './jobs';
import { createScheduler } from './scheduler';

const scheduler = createScheduler(cronJobs);

export const startCron = scheduler.start;
export const stopCron = scheduler.stop;
