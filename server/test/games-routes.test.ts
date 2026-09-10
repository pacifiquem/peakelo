import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';

const app = buildApp();

describe('game routes', () => {
  afterAll(async () => {
    await app.close();
  });

  it('rejects the list and a single game without a session', async () => {
    const list = await app.inject({ method: 'GET', url: '/games' });
    expect(list.statusCode).toBe(401);
    const one = await app.inject({ method: 'GET', url: '/games/not-a-game' });
    expect(one.statusCode).toBe(401);
  });
});
