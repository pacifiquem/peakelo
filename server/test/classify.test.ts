import { describe, expect, it } from 'vitest';
import {
  chesscomResult,
  lichessResult,
  mapChesscomTimeClass,
  mapLichessSpeed,
  selectNewest,
} from '../src/modules/games/classify';

describe('time-control mapping', () => {
  it('keeps live chess.com classes and drops daily', () => {
    expect(mapChesscomTimeClass('rapid')).toBe('rapid');
    expect(mapChesscomTimeClass('daily')).toBeNull();
  });

  it('keeps lichess live speeds and drops classical', () => {
    expect(mapLichessSpeed('blitz')).toBe('blitz');
    expect(mapLichessSpeed('classical')).toBeNull();
  });
});

describe('results', () => {
  it('maps chess.com wins and draws', () => {
    expect(chesscomResult('win', 'resigned')).toBe('1-0');
    expect(chesscomResult('resigned', 'win')).toBe('0-1');
    expect(chesscomResult('agreed', 'agreed')).toBe('1/2-1/2');
  });

  it('maps lichess winners', () => {
    expect(lichessResult('white')).toBe('1-0');
    expect(lichessResult(undefined)).toBe('1/2-1/2');
  });
});

describe('selectNewest', () => {
  it('keeps the newest games up to the limit', () => {
    const games = [
      { playedAt: new Date('2026-01-01'), externalId: 'old' },
      { playedAt: new Date('2026-03-01'), externalId: 'new' },
      { playedAt: new Date('2026-02-01'), externalId: 'mid' },
    ].map((item) => ({
      ...item,
      timeControl: 'rapid' as const,
      whiteName: 'a',
      blackName: 'b',
      result: '1-0' as const,
      pgn: '1. e4',
    }));
    expect(selectNewest(games, 2).map((game) => game.externalId)).toEqual(['new', 'mid']);
  });
});
