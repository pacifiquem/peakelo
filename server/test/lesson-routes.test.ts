import cookie from '@fastify/cookie';
import Fastify from 'fastify';
import { afterAll, describe, expect, it } from 'vitest';
import { SESSION_COOKIE_NAME } from '@peakelo/shared';
import { buildApp } from '../src/app';
import { registerErrorHandler } from '../src/common/error-handler';
import { getPrisma } from '../src/db/prisma';
import { createSession } from '../src/modules/auth/session';
import { lessonRoutes } from '../src/modules/lesson/routes';

const app = buildApp();
const hasDatabase = Boolean(process.env.DATABASE_URL);

describe('lesson routes', () => {
  afterAll(async () => {
    await app.close();
  });

  it('rejects lesson posts without a session', async () => {
    const lesson = await app.inject({
      method: 'POST',
      url: '/games/not-a-game/lesson',
      payload: { ply: 0 },
    });
    expect(lesson.statusCode).toBe(401);

    const ask = await app.inject({
      method: 'POST',
      url: '/games/not-a-game/lesson/ask',
      payload: { ply: 0, question: 'Why not take?' },
    });
    expect(ask.statusCode).toBe(401);

    const brief = await app.inject({
      method: 'POST',
      url: '/games/not-a-game/lesson/brief',
      payload: {},
    });
    expect(brief.statusCode).toBe(401);
  });
});

describe.skipIf(!hasDatabase)('lesson routes (configured)', () => {
  const leftover: string[] = [];
  const prisma = getPrisma();

  afterAll(async () => {
    if (leftover.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: leftover } } }).catch(() => undefined);
    }
  });

  it('returns 503 with a user-facing message when the coach is offline', async () => {
    const user = await prisma.user.create({
      data: {
        email: `lesson-offline-${Date.now()}@peakelo.test`,
        displayName: 'Offline',
        accounts: { create: { provider: 'lichess', providerAccountId: `off-${Date.now()}`, username: 'off' } },
        onboarding: {
          create: {
            trainingFocus: 'tactics',
            noteAsked: true,
            importStatus: 'completed',
            completedAt: new Date(),
          },
        },
        games: {
          create: {
            source: 'lichess',
            externalId: `off-${Date.now()}`,
            timeControl: 'rapid',
            playedAt: new Date('2026-01-01T00:00:00.000Z'),
            whiteName: 'Alice',
            blackName: 'Bob',
            result: '1-0',
            userColor: 'white',
            pgn: '1. e4 e5 1-0',
          },
        },
      },
      include: { games: true },
    });
    leftover.push(user.id);
    const token = await createSession(user.id);
    const gameId = user.games[0]!.id;

    const isolated = Fastify({ logger: false });
    isolated.register(cookie);
    registerErrorHandler(isolated);
    isolated.register(lessonRoutes, { isConfigured: () => false });
    await isolated.ready();

    const response = await isolated.inject({
      method: 'POST',
      url: `/games/${gameId}/lesson`,
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}`, 'content-type': 'application/json' },
      payload: { ply: 0 },
    });
    expect(response.statusCode).toBe(503);
    expect(response.json().error.message).toBe('The lesson coach is offline right now.');
    expect(response.json().error.code).toBe('SERVICE_UNAVAILABLE');
    await isolated.close();
  });
});
