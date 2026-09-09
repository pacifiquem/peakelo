import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';

const app = buildApp();

describe('health', () => {
  afterAll(async () => {
    await app.close();
  });

  it('returns liveness', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok' });
  });

  it('returns readiness without a database', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
      checks: { database: 'skipped' },
    });
  });

  it('returns a typed 404 envelope', async () => {
    const response = await app.inject({ method: 'GET', url: '/missing' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: { code: 'NOT_FOUND' },
    });
  });
});
