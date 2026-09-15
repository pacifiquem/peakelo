import { describe, expect, it } from 'vitest';
import { chesscomArchiveMonths } from '../src/modules/games/platforms/chesscom';

describe('chesscomArchiveMonths', () => {
  it('prefers the end month and includes neighbors', () => {
    expect(
      chesscomArchiveMonths({
        endTime: Date.UTC(2026, 7, 6, 14, 50, 19) / 1000,
        dateHeader: '2026.08.06',
      }),
    ).toEqual([
      { year: '2026', month: '08' },
      { year: '2026', month: '07' },
      { year: '2026', month: '09' },
    ]);
  });

  it('adds the Date-header month when it is not the end month', () => {
    const months = chesscomArchiveMonths({
      endTime: Date.UTC(2026, 8, 1, 0, 5, 0) / 1000,
      dateHeader: '2026.08.31',
    });
    expect(months[0]).toEqual({ year: '2026', month: '09' });
    expect(months.map((item) => `${item.year}-${item.month}`)).toContain('2026-08');
  });
});
