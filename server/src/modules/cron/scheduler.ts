import { logger } from '../../lib/logger';

export type CronJob = {
  name: string;
  intervalMs: number;
  run: (now: Date) => Promise<unknown>;
};

export function createScheduler(jobs: readonly CronJob[]) {
  const timers = new Map<string, NodeJS.Timeout>();

  function start(): void {
    for (const job of jobs) {
      if (timers.has(job.name)) continue;
      const timer = setInterval(() => {
        void job.run(new Date()).catch((error) => {
          logger.error({ err: error, job: job.name }, 'cron tick failed');
        });
      }, job.intervalMs);
      timer.unref();
      timers.set(job.name, timer);
    }
  }

  function stop(): void {
    for (const timer of timers.values()) {
      clearInterval(timer);
    }
    timers.clear();
  }

  return { start, stop };
}
