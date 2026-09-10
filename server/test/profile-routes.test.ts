import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';

const app = buildApp();

describe('profile routes', () => {
  afterAll(async () => {
    await app.close();
  });

  it('rejects /profile without a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/profile' });
    expect(response.statusCode).toBe(401);
  });
});
