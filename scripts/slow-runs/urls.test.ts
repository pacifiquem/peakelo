import { describe, expect, it } from 'vitest';

import { extractGameUrls, extractGameUrlsFromVideo } from './urls';

describe('extractGameUrls', () => {
  it('parses lichess game links and drops reserved paths', () => {
    const hits = extractGameUrls(
      'watch https://lichess.org/abcdefgh/white#12 and ignore https://lichess.org/training plus export https://lichess.org/game/export/AbCdEf12',
    );
    expect(hits.map((hit) => hit.id).sort()).toEqual(['AbCdEf12', 'abcdefgh']);
    expect(hits.every((hit) => hit.source === 'lichess')).toBe(true);
  });

  it('parses chess.com live, daily, and analysis URLs', () => {
    const hits = extractGameUrls(`
      https://www.chess.com/game/live/12345678901
      https://www.chess.com/live/game/12345678901
      https://www.chess.com/game/daily/222333444
      https://www.chess.com/analysis/game/live/555666777888
      https://www.chess.com/game/999888777666
    `);
    const keys = hits.map((hit) => `${hit.kind}:${hit.id}`).sort();
    expect(keys).toEqual(['daily:222333444', 'live:12345678901', 'live:555666777888', 'live:999888777666']);
  });

  it('reads a URL spoken in the first 30 seconds of a transcript', () => {
    const hits = extractGameUrlsFromVideo({
      title: 'slow run',
      description: 'no game here',
      cues: [
        { text: 'the game is at lichess.org/abcd1234', start: 8, duration: 3 },
        { text: 'later we mention chess.com/game/live/1', start: 90, duration: 2 },
      ],
    });
    expect(hits).toEqual([
      { source: 'lichess', id: 'abcd1234', url: 'https://lichess.org/abcd1234' },
    ]);
  });
});
