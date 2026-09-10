import { afterAll, describe, expect, it } from 'vitest';
import { getPrisma } from '../src/db/prisma';
import { getGame } from '../src/modules/games/service';

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabase)('getGame analysis', () => {
  const prisma = getPrisma();
  const leftover: string[] = [];

  afterAll(async () => {
    if (leftover.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: leftover } } }).catch(() => undefined);
    }
  });

  it('returns none when the game has no analysis row', async () => {
    const user = await prisma.user.create({
      data: {
        email: `game-analysis-${Date.now()}@peakelo.test`,
        displayName: 'Analysis',
        games: {
          create: {
            source: 'lichess',
            externalId: `ga-${Date.now()}`,
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
    const game = user.games[0];
    expect(game).toBeTruthy();
    const detail = await getGame(user.id, game!.id);
    expect(detail?.analysis).toEqual({ status: 'none', plies: null });
  });
});
