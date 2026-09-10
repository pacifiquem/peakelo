import { afterEach, describe, expect, it, vi } from 'vitest';
import { createScheduler } from '../src/modules/cron/scheduler';

afterEach(() => {
  vi.useRealTimers();
});

describe('createScheduler', () => {
  it('does not run jobs until the first interval elapses', () => {
    vi.useFakeTimers();
    const run = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler([{ name: 'ping', intervalMs: 1000, run }]);
    scheduler.start();
    expect(run).not.toHaveBeenCalled();
    scheduler.stop();
  });

  it('runs each job on its interval and is safe to start twice', async () => {
    vi.useFakeTimers();
    const run = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler([{ name: 'ping', intervalMs: 1000, run }]);
    scheduler.start();
    scheduler.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(run).toHaveBeenCalledTimes(1);
    scheduler.stop();
  });

  it('stops ticking after stop', async () => {
    vi.useFakeTimers();
    const run = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler([{ name: 'ping', intervalMs: 1000, run }]);
    scheduler.start();
    await vi.advanceTimersByTimeAsync(1000);
    scheduler.stop();
    await vi.advanceTimersByTimeAsync(1000);
    expect(run).toHaveBeenCalledTimes(1);
  });
});
