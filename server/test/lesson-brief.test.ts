import { afterAll, describe, expect, it } from 'vitest';
import { createGameBrief } from '../src/modules/lesson/brief';
import { getPrisma } from '../src/db/prisma';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)('createGameBrief', () => {
  const prisma = getPrisma();
  const leftover: string[] = [];

  afterAll(async () => {
    if (leftover.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: leftover } } }).catch(() => undefined);
    }
  });

  it('writes a brief from a fake generator and keeps the stored rating', async () => {
    const user = await prisma.user.create({
      data: {
        email: `brief-${Date.now()}@peakelo.test`,
        displayName: 'Brief',
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
            externalId: `br-${Date.now()}`,
            timeControl: 'rapid',
            playedAt: new Date('2026-01-01T00:00:00.000Z'),
            whiteName: 'Alice',
            blackName: 'Bob',
            result: '1-0',
            userColor: 'white',
            pgn: '[WhiteElo "1842"]\n[BlackElo "1700"]\n\n1. e4 e5 1-0',
            whiteRating: 1842,
            blackRating: 1700,
          },
        },
      },
      include: { games: true },
    });
    leftover.push(user.id);
    const gameId = user.games[0]!.id;
    const brief = await createGameBrief(user.id, gameId, {
      isConfigured: () => true,
      generateBrief: async () => ({
        headline: 'You hung the center and they took it.',
        story: 'A short rapid game decided by a tactic, not a lecture on e4.',
        keyPlies: [{ ply: 1, san: 'e4', why: 'The only move in the scoresheet.' }],
        opening: null,
        decidedBy: 'The scoresheet ends before a middlegame.',
      }),
    });
    expect(brief.playerRating?.rating).toBe(1842);
    expect(brief.playerRating?.band).toBe('from1600to2000');
    expect(brief.headline).toContain('center');
  });
});
