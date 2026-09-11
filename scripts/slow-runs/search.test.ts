import { describe, expect, it } from 'vitest';

import { normalizeEpd } from '../../packages/engine/src/pgn';

import { searchSlowRuns } from './search';
import type { SlowRunIndex } from './types';

const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';
const afterE4 = normalizeEpd('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
const afterD4 = normalizeEpd('rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1');

const index: SlowRunIndex = {
  generatedAt: '2026-09-11T00:00:00.000Z',
  comments: [
    {
      speaker: 'gotham',
      videoId: 'vid1',
      title: 'e4 slow run',
      tSec: 12,
      quote: 'We play e4 and fight for the center.',
      epd: afterE4,
      confidence: 'high',
    },
    {
      speaker: 'hikaru',
      videoId: 'vid2',
      title: 'd4 slow run',
      tSec: 20,
      quote: 'Queen pawn openings can be slower.',
      epd: afterD4,
      confidence: 'low',
    },
  ],
};

describe('searchSlowRuns', () => {
  it('returns an empty list when the index is missing', () => {
    expect(searchSlowRuns({ fen: afterE4 }, null)).toEqual([]);
    expect(searchSlowRuns({ fen: afterE4 }, { generatedAt: '', comments: [] })).toEqual([]);
  });

  it('prefers an exact EPD hit', () => {
    const hits = searchSlowRuns({ fen: afterE4, limit: 4 }, index);
    expect(hits[0]?.videoId).toBe('vid1');
    expect(hits[0]?.epd).toBe(afterE4);
  });

  it('falls back to same side-to-move pawn structure / material, then text', () => {
    const otherE4 = normalizeEpd('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2');
    const hits = searchSlowRuns({ fen: otherE4, query: 'queen pawn', limit: 4 }, index);
    expect(hits.some((hit) => hit.videoId === 'vid2')).toBe(true);
  });

  it('does not invent quotes when nothing matches', () => {
    expect(searchSlowRuns({ fen: start, query: 'zwischenzug tactics only' }, index)).toEqual([]);
  });
});
