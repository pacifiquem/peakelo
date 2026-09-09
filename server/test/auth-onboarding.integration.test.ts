import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SESSION_COOKIE_NAME } from '@peakelo/shared';
import { buildApp } from '../src/app';
import { getPrisma } from '../src/db/prisma';
import { createSession } from '../src/modules/auth/session';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)('auth and onboarding (database)', () => {
  const app = buildApp();
  const prisma = getPrisma();
  let userId = '';
  let cookie = '';

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `itest-${Date.now()}@peakelo.test`,
        displayName: 'Integration',
        onboarding: { create: {} },
      },
    });
    userId = user.id;
    const token = await createSession(userId);
    cookie = `${SESSION_COOKIE_NAME}=${token}`;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
    }
    await app.close();
  });

  it('returns the signed-in user', async () => {
    const response = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(response.statusCode).toBe(200);
    expect(response.json().user.displayName).toBe('Integration');
    expect(response.json().user.onboarding.step).toBe('connect');
  });

  it('saves training focus and then the optional note', async () => {
    const intent = await app.inject({
      method: 'POST',
      url: '/onboarding/intent',
      headers: { cookie, 'content-type': 'application/json' },
      payload: { trainingFocus: 'tactics' },
    });
    expect(intent.statusCode).toBe(200);
    expect(intent.json().onboarding.trainingFocus).toBe('tactics');
    expect(intent.json().onboarding.step).toBe('connect');

    const note = await app.inject({
      method: 'POST',
      url: '/onboarding/note',
      headers: { cookie, 'content-type': 'application/json' },
      payload: { focusNote: 'I hang pieces on e3' },
    });
    expect(note.statusCode).toBe(200);
    expect(note.json().onboarding.noteAsked).toBe(true);
    expect(note.json().onboarding.step).toBe('connect');
  });

  it('rejects import before a chess account is linked', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/onboarding/import',
      headers: { cookie, 'content-type': 'application/json' },
      payload: { timeControls: ['rapid'], sources: ['lichess'] },
    });
    expect(response.statusCode).toBe(400);
  });

  it('forbids the games list before onboarding is done', async () => {
    const response = await app.inject({ method: 'GET', url: '/games', headers: { cookie } });
    expect(response.statusCode).toBe(403);
  });

  it('logs out and clears the session', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { cookie },
    });
    expect(response.statusCode).toBe(200);
    const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(me.json().user).toBeNull();
  });
});
