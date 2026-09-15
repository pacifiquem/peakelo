import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';

const app = buildApp();

describe('training routes', () => {
  afterAll(async () => {
    await app.close();
  });

  it('rejects the training desk without a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/training' });
    expect(response.statusCode).toBe(401);
  });

  it('rejects the drill queue without a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/drills' });
    expect(response.statusCode).toBe(401);
  });

  it('rejects a drill play without a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/drills/x' });
    expect(response.statusCode).toBe(401);
  });

  it('rejects writeup queue without a session', async () => {
    const response = await app.inject({ method: 'POST', url: '/training/writeup', payload: {} });
    expect(response.statusCode).toBe(401);
  });
});
