import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';

const app = buildApp();

describe('public review routes', () => {
  afterAll(async () => {
    await app.close();
  });

  it('rejects an empty url', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/public/reviews',
      headers: { 'content-type': 'application/json' },
      payload: { url: '' },
    });
    expect(response.statusCode).toBe(400);
  });

  it('rejects a non-chess host', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/public/reviews',
      payload: { url: 'https://example.com/game/live/123456789' },
    });
    expect(response.statusCode).toBe(400);
  });

  it('returns 404 for an unknown review id', async () => {
    const response = await app.inject({ method: 'GET', url: '/public/reviews/does-not-exist' });
    expect(response.statusCode).toBe(404);
  });
});
