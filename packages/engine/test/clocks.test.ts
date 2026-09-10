import { describe, expect, it } from 'vitest';
import { parseClkComment, parseTimeControlHeader, timeSpentMs } from '../src/clocks';

describe('parseClkComment', () => {
  it('parses H:MM:SS from Lichess comments', () => {
    expect(parseClkComment('[%clk 0:10:00]')).toBe(10 * 60 * 1000);
    expect(parseClkComment('good move [%clk 1:02:03]')).toBe(((1 * 3600 + 2 * 60 + 3) * 1000));
  });

  it('parses M:SS and fractional seconds', () => {
    expect(parseClkComment('[%clk 10:00]')).toBe(10 * 60 * 1000);
    expect(parseClkComment('[%clk 9:59.5]')).toBe(9 * 60 * 1000 + 59500);
    expect(parseClkComment('[%clk 0:09:59.5]')).toBe(9 * 60 * 1000 + 59500);
  });

  it('returns null when no clock annotation is present', () => {
    expect(parseClkComment('just a comment')).toBeNull();
    expect(parseClkComment('')).toBeNull();
  });
});

describe('timeSpentMs', () => {
  it('subtracts the later clock from the earlier one', () => {
    expect(timeSpentMs(10 * 60 * 1000, 9 * 60 * 1000 + 58 * 1000)).toBe(2000);
  });

  it('adds increment so a 3+2 think is not recorded as zero', () => {
    expect(timeSpentMs(180_000, 179_000, 2000)).toBe(3000);
    expect(timeSpentMs(180_000, 181_000, 2000)).toBe(1000);
  });

  it('clamps a clock that went up with no increment to zero', () => {
    expect(timeSpentMs(1000, 2000)).toBe(0);
  });

  it('parses TimeControl base and increment', () => {
    expect(parseTimeControlHeader('180+2')).toEqual({ baseMs: 180_000, incrementMs: 2000 });
    expect(parseTimeControlHeader('600')).toEqual({ baseMs: 600_000, incrementMs: 0 });
    expect(parseTimeControlHeader('-')).toBeNull();
  });

  it('is null when either clock is missing', () => {
    expect(timeSpentMs(null, 1000)).toBeNull();
    expect(timeSpentMs(1000, null)).toBeNull();
    expect(timeSpentMs(null, null)).toBeNull();
  });
});
