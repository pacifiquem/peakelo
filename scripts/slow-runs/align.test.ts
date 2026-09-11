import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { replayPgn } from '../../packages/engine/src/pgn';

import { alignTranscript, spokenWalk, tryPlaySan } from './align';
import type { TranscriptCue } from './types';

const fixtureDir = path.dirname(fileURLToPath(import.meta.url));

function loadCues(name: string): TranscriptCue[] {
  return JSON.parse(readFileSync(path.join(fixtureDir, 'fixtures', name), 'utf8')) as TranscriptCue[];
}

describe('tryPlaySan', () => {
  it('accepts a legal opening move and rejects an illegal one', () => {
    expect(tryPlaySan([], 'e4')).toBe('e4');
    expect(tryPlaySan(['e4'], 'e5')).toBe('e5');
    expect(tryPlaySan(['e4'], 'e4')).toBeNull();
  });
});

describe('spokenWalk', () => {
  it('walks spoken SAN from the start position', () => {
    const plies = spokenWalk(loadCues('ruy-lopez.json'));
    expect(plies.map((ply) => ply.san.replace(/[+#]/g, ''))).toEqual([
      'e4',
      'e5',
      'Nf3',
      'Nc6',
      'Bb5',
      'a6',
      'Ba4',
    ]);
  });

  it('does not attach EPDs from a spoken walk when there is no recovered game', () => {
    const comments = alignTranscript({
      cues: loadCues('ruy-lopez.json'),
      speaker: 'gotham',
      videoId: 'walk1',
      title: 'walk',
      hasGameUrl: false,
    });
    expect(comments).toEqual([]);
  });

  it('does not treat a late isolated SAN as the start of a game', () => {
    const comments = alignTranscript({
      cues: [
        { text: 'welcome back to the channel', start: 10, duration: 2 },
        { text: 'much later I would have played bishop f4', start: 442, duration: 3 },
      ],
      speaker: 'gotham',
      videoId: 'late1',
      title: 'late',
      hasGameUrl: false,
    });
    expect(comments).toEqual([]);
  });

  it('does not invent positions when the walk dies inside six plies', () => {
    const comments = alignTranscript({
      cues: loadCues('short-opening.json'),
      speaker: 'gotham',
      videoId: 'short1',
      title: 'short',
      hasGameUrl: false,
    });
    expect(comments).toEqual([]);
  });
});

describe('alignTranscript', () => {
  it('marks high confidence when a PGN URL game hits spoken SAN', () => {
    const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4';
    const comments = alignTranscript({
      cues: loadCues('ruy-lopez.json'),
      speaker: 'naroditsky',
      videoId: 'abc123',
      title: 'Ruy',
      replayed: replayPgn(pgn),
      hasGameUrl: true,
    });
    expect(comments.length).toBeGreaterThan(0);
    expect(comments.every((comment) => comment.confidence === 'high')).toBe(true);
    expect(comments.every((comment) => comment.epd)).toBe(true);
    expect(comments.some((comment) => /knight f3|attacking the pawn/i.test(comment.quote))).toBe(true);
  });
});
