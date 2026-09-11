import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { START_FEN } from '@peakelo/engine';
import {
  loadSlowRunIndex,
  resolveSlowRunIndexPath,
  searchSlowRunIndex,
} from '../src/modules/lesson/search-index';

const fixture = path.join(__dirname, 'fixtures/slow-runs-index.json');

describe('slow-run search index', () => {
  it('returns an exact EPD hit from a fixture file', () => {
    const entries = loadSlowRunIndex(fixture);
    const hits = searchSlowRunIndex(
      entries,
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]?.speaker).toBe('gotham');
    expect(hits[0]?.videoId).toBe('abc123');
    expect(hits[0]?.quote).toContain('hanging');
  });

  it('returns an empty list for a missing or empty file', () => {
    expect(loadSlowRunIndex(path.join(__dirname, 'fixtures/does-not-exist.json'))).toEqual([]);
    const empty = path.join(tmpdir(), `peakelo-empty-index-${Date.now()}.json`);
    writeFileSync(empty, '');
    expect(loadSlowRunIndex(empty)).toEqual([]);
    expect(searchSlowRunIndex([], START_FEN)).toEqual([]);
  });

  it('does not return a nearby-but-different position as a hit', () => {
    const entries = loadSlowRunIndex(fixture);
    const hits = searchSlowRunIndex(entries, '8/8/4k3/4P3/8/8/8/4K3 w - - 0 1');
    expect(hits).toEqual([]);
  });

  it('returns the hikaru quote only for the exact EPD', () => {
    const entries = loadSlowRunIndex(fixture);
    const hits = searchSlowRunIndex(entries, '8/8/4k3/8/4P3/8/8/4K3 w - - 0 1');
    expect(hits[0]?.speaker).toBe('hikaru');
  });

  it('loads the script index shape with comments', () => {
    const file = path.join(tmpdir(), `peakelo-comments-index-${Date.now()}.json`);
    writeFileSync(
      file,
      JSON.stringify({
        generatedAt: '2026-09-11T00:00:00.000Z',
        comments: [
          {
            speaker: 'naroditsky',
            videoId: 'danya1',
            title: 'Speedrun',
            tSec: 12,
            quote: 'Ask what the idea of a5 is.',
            epd: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3',
          },
        ],
      }),
    );
    const hits = searchSlowRunIndex(
      loadSlowRunIndex(file),
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    );
    expect(hits[0]?.speaker).toBe('naroditsky');
  });

  it('resolves a relative path from cwd when the file exists', () => {
    const resolved = resolveSlowRunIndexPath('test/fixtures/slow-runs-index.json', path.join(__dirname, '..'));
    expect(resolved).toBe(fixture);
  });
});
