import { describe, expect, it } from 'vitest';
import {
  extractTeachingBeats,
  pickVoiceExamples,
  searchTeachingBeats,
} from '../src/modules/lesson/teaching';

const cues = [
  { text: 'welcome back to the stream everybody', start: 1, duration: 2 },
  { text: 'the bishop is hanging. take it. do not play a fancy intermezzo.', start: 40, duration: 4 },
  { text: 'what is the idea of a5 here? just castle and finish development.', start: 80, duration: 4 },
  { text: 'smash like and use code chessly', start: 120, duration: 2 },
];

describe('extractTeachingBeats', () => {
  it('keeps instructional windows and drops promo', () => {
    const beats = extractTeachingBeats(cues, {
      speaker: 'gotham',
      videoId: 'v1',
      title: 'Slow run 1',
    });
    expect(beats.length).toBeGreaterThanOrEqual(2);
    expect(beats.every((beat) => !/chessly/i.test(beat.quote))).toBe(true);
    expect(beats.some((beat) => beat.tags.includes('hanging'))).toBe(true);
    expect(beats.some((beat) => beat.tags.includes('idea'))).toBe(true);
  });
});

describe('searchTeachingBeats', () => {
  it('ranks hanging-piece talk over unrelated quotes', () => {
    const beats = extractTeachingBeats(cues, {
      speaker: 'hikaru',
      videoId: 'v2',
      title: 'Educational',
    });
    const hits = searchTeachingBeats(beats, 'hanging piece');
    expect(hits[0]?.quote.toLowerCase()).toContain('hanging');
  });

  it('returns nothing for a two-letter query', () => {
    expect(searchTeachingBeats(extractTeachingBeats(cues, {
      speaker: 'naroditsky',
      videoId: 'v3',
      title: 'Speedrun',
    }), 'to')).toEqual([]);
  });
});

describe('pickVoiceExamples', () => {
  it('prefers matching tags', () => {
    const beats = extractTeachingBeats(cues, {
      speaker: 'gotham',
      videoId: 'v1',
      title: 'Slow run 1',
    });
    const picked = pickVoiceExamples(beats, ['hanging'], 1);
    expect(picked[0]?.tags).toContain('hanging');
  });
});
