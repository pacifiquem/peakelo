import { describe, expect, it } from 'vitest';
import { parseGameUrl } from '../src/modules/preview/parse-url';

describe('parseGameUrl', () => {
  it('reads an official Lichess game URL', () => {
    expect(parseGameUrl('https://lichess.org/q7ZvsdUF')).toEqual({
      source: 'lichess',
      externalId: 'q7ZvsdUF',
      kind: null,
    });
    expect(parseGameUrl('https://lichess.org/q7ZvsdUF/black#12')?.externalId).toBe('q7ZvsdUF');
    expect(parseGameUrl('https://lichess.org/game/export/q7ZvsdUF')?.externalId).toBe('q7ZvsdUF');
  });

  it('reads official Chess.com live and daily paths', () => {
    expect(parseGameUrl('https://www.chess.com/game/live/169227053782')).toEqual({
      source: 'chesscom',
      externalId: '169227053782',
      kind: 'live',
    });
    expect(parseGameUrl('https://www.chess.com/analysis/game/live/169227053782')?.kind).toBe('live');
    expect(parseGameUrl('https://www.chess.com/live/game/169227053782')?.kind).toBe('live');
  });

  it('rejects hosts we do not fetch', () => {
    expect(parseGameUrl('https://example.com/game/live/123456789')).toBeNull();
    expect(parseGameUrl('not a url')).toBeNull();
  });
});
