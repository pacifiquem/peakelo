import { afterAll, describe, expect, it } from 'vitest';
import { START_FEN, applyUciLine } from '@peakelo/engine';
import type { Lesson } from '@peakelo/shared';
import { ServiceUnavailableError } from '../src/common/errors';
import { getPrisma } from '../src/db/prisma';
import { askLesson, createLesson, sanitizeLesson } from '../src/modules/lesson/service';

const hasDatabase = Boolean(process.env.DATABASE_URL);

const E4_E5_PGN = `[Event "Test"]
[Site "Peakelo"]
[White "Alice"]
[Black "Bob"]
[Result "1/2-1/2"]

1. e4 e5 1/2-1/2`;

function sampleLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    ply: 0,
    fen: START_FEN,
    headline: 'Take the hanging piece.',
    segments: [{ id: 'a', text: 'The bishop on h6 is hanging. Take it.' }],
    arrows: [{ from: 'g7', to: 'h6', brush: 'green' }],
    alternatives: [],
    sources: [],
    ...overrides,
  };
}

describe('createLesson configuration', () => {
  it('throws a user-facing 503 when the coach is not configured', async () => {
    await expect(
      createLesson('user', 'game', { ply: 0 }, { isConfigured: () => false }),
    ).rejects.toMatchObject({
      name: 'ServiceUnavailableError',
      statusCode: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'The lesson coach is offline right now.',
    } satisfies Partial<ServiceUnavailableError>);
  });
});

describe.skipIf(!hasDatabase)('createLesson service', () => {
  const prisma = getPrisma();
  const leftover: string[] = [];

  afterAll(async () => {
    if (leftover.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: leftover } } }).catch(() => undefined);
    }
  });

  async function seedGame(pgn = E4_E5_PGN) {
    const user = await prisma.user.create({
      data: {
        email: `lesson-svc-${Date.now()}-${Math.random().toString(16).slice(2)}@peakelo.test`,
        displayName: 'Lesson',
        games: {
          create: {
            source: 'lichess',
            externalId: `ls-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            timeControl: 'rapid',
            playedAt: new Date('2026-01-01T00:00:00.000Z'),
            whiteName: 'Alice',
            blackName: 'Bob',
            result: '1/2-1/2',
            userColor: 'white',
            pgn,
          },
        },
      },
      include: { games: true },
    });
    leftover.push(user.id);
    return { userId: user.id, gameId: user.games[0]!.id };
  }

  it('returns a Zod-valid lesson from a fake agent and does not need the network', async () => {
    const { userId, gameId } = await seedGame();
    let called = 0;
    const lesson = await createLesson(
      userId,
      gameId,
      { ply: 0 },
      {
        isConfigured: () => true,
        generateLesson: async () => {
          called += 1;
          return sampleLesson();
        },
      },
    );
    expect(called).toBe(1);
    expect(lesson.headline).toBe('Take the hanging piece.');
    expect(lesson.fen).toBe(START_FEN);
    expect(lesson.ply).toBe(0);
    expect(lesson.segments[0]?.text).toContain('hanging');
  });

  it('applies variationUci and passes the resulting FEN to the fake agent', async () => {
    const { userId, gameId } = await seedGame();
    const expected = applyUciLine(START_FEN, ['e2e4']);
    expect(expected.legal).toBe(true);
    let seenFen = '';
    const lesson = await createLesson(
      userId,
      gameId,
      { ply: 0, variationUci: ['e2e4'] },
      {
        isConfigured: () => true,
        generateLesson: async (input) => {
          const match = /FEN: (.+)\./.exec(input.userMessage);
          seenFen = match?.[1] ?? '';
          return sampleLesson({
            fen: seenFen,
            segments: [{ id: 'a', text: 'After e4, occupy the center.', lineUci: ['e7e5'] }],
          });
        },
      },
    );
    expect(seenFen).toBe(expected.fen);
    expect(lesson.fen).toBe(expected.fen);
    expect(lesson.segments[0]?.lineUci).toEqual(['e7e5']);
  });

  it('caches a mainline lesson and refresh bypasses the cache', async () => {
    const { userId, gameId } = await seedGame();
    let called = 0;
    const deps = {
      isConfigured: () => true,
      generateLesson: async () => {
        called += 1;
        return sampleLesson({ headline: `Call ${called}` });
      },
    };

    const first = await createLesson(userId, gameId, { ply: 1 }, deps);
    expect(first.headline).toBe('Call 1');
    expect(called).toBe(1);

    const second = await createLesson(userId, gameId, { ply: 1 }, deps);
    expect(second.headline).toBe('Call 1');
    expect(called).toBe(1);

    const refreshed = await createLesson(userId, gameId, { ply: 1, refresh: true }, deps);
    expect(refreshed.headline).toBe('Call 2');
    expect(called).toBe(2);

    const asked = await askLesson(
      userId,
      gameId,
      { ply: 1, question: 'Why not Nf3?' },
      {
        isConfigured: () => true,
        generateLesson: async (input) => {
          called += 1;
          expect(input.question).toBe('Why not Nf3?');
          return sampleLesson({ headline: 'Because development waits.' });
        },
      },
    );
    expect(asked.headline).toBe('Because development waits.');
    expect(called).toBe(3);
  });

  it('drops illegal clickable lines from the model payload', async () => {
    const { userId, gameId } = await seedGame();
    const lesson = await createLesson(
      userId,
      gameId,
      { ply: 0 },
      {
        isConfigured: () => true,
        generateLesson: async () =>
          sampleLesson({
            segments: [
              { id: 'a', text: 'This line is fake.', lineUci: ['a2a5'] },
              { id: 'b', text: 'This one is real.', lineUci: ['e2e4'] },
            ],
            alternatives: [
              { san: 'Na3', uci: 'b1a3', pvSan: ['Na3'], pvUci: ['b1a3'], why: 'Legal but odd.' },
              { san: 'Qh5', uci: 'd1h8', pvSan: ['Qh5'], pvUci: ['d1h8'], why: 'Illegal.' },
            ],
          }),
      },
    );
    expect(lesson.segments[0]?.lineUci).toBeUndefined();
    expect(lesson.segments[1]?.lineUci).toEqual(['e2e4']);
    expect(lesson.alternatives).toHaveLength(1);
    expect(lesson.alternatives[0]?.uci).toBe('b1a3');
  });

  it('keeps an instead-of line that is only legal before the played ply', async () => {
    const { userId, gameId } = await seedGame();
    const lesson = await createLesson(
      userId,
      gameId,
      { ply: 1 },
      {
        isConfigured: () => true,
        generateLesson: async () =>
          sampleLesson({
            segments: [{ id: 'a', text: 'd4 was the other center pawn.', lineUci: ['d2d4'] }],
          }),
      },
    );
    expect(lesson.segments[0]?.lineUci).toEqual(['d2d4']);
    expect(lesson.segments[0]?.lineSan).toEqual(['d4']);
  });
});

describe('sanitizeLesson', () => {
  it('drops invented sources and arrows that are not legal moves', () => {
    const cleaned = sanitizeLesson(
      sampleLesson({
        arrows: [
          { from: 'e2', to: 'e4', brush: 'green' },
          { from: 'e2', to: 'e8', brush: 'red' },
        ],
        sources: [
          {
            speaker: 'gotham',
            videoId: 'invented',
            title: 'Fake',
            tSec: 1,
            quote: 'I never said this.',
          },
        ],
      }),
      { ply: 0, fen: START_FEN, originFens: [START_FEN] },
    );
    expect(cleaned.arrows).toEqual([{ from: 'e2', to: 'e4', brush: 'green' }]);
    expect(cleaned.sources).toEqual([]);
  });
});
