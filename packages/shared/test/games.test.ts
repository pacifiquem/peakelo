import { describe, expect, it } from 'vitest';
import { gamesQuerySchema, publicGameSchema } from '../src/games';

describe('gamesQuerySchema', () => {
  it('defaults pagination', () => {
    expect(gamesQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it('accepts a time-control filter', () => {
    expect(gamesQuerySchema.parse({ timeControl: 'bullet', page: '2' })).toMatchObject({
      timeControl: 'bullet',
      page: 2,
    });
  });

  it('accepts a game-source filter', () => {
    expect(gamesQuerySchema.parse({ source: 'lichess' })).toMatchObject({ source: 'lichess' });
  });
});

describe('publicGameSchema', () => {
  it('accepts a listed game', () => {
    const parsed = publicGameSchema.parse({
      id: 'g1',
      source: 'chesscom',
      externalId: '123',
      timeControl: 'rapid',
      playedAt: '2026-09-01T12:00:00.000Z',
      whiteName: 'm_pacifique',
      blackName: 'opponent',
      result: '1-0',
      userColor: 'white',
    });
    expect(parsed.userColor).toBe('white');
  });
});
