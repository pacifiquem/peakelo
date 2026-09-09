import { INITIAL_IMPORT_LIMIT, type GameSource, type TimeControl } from '@peakelo/shared';
import { env } from '../../config/env';
import { getPrisma } from '../../db/prisma';
import { decryptSecret } from '../../lib/crypto';
import { logger } from '../../lib/logger';
import type { PlatformGame } from './classify';
import { fetchChesscomGames } from './platforms/chesscom';
import { fetchLichessGames } from './platforms/lichess';

export async function persistGames(
  userId: string,
  source: GameSource,
  username: string,
  games: PlatformGame[],
) {
  const prisma = getPrisma();
  const mine = username.toLowerCase();
  let written = 0;
  for (const game of games) {
    const userColor = game.whiteName.toLowerCase() === mine ? 'white' : 'black';
    await prisma.game.upsert({
      where: {
        userId_source_externalId: { userId, source, externalId: game.externalId },
      },
      create: {
        userId,
        source,
        externalId: game.externalId,
        timeControl: game.timeControl,
        playedAt: game.playedAt,
        whiteName: game.whiteName,
        blackName: game.blackName,
        result: game.result,
        userColor,
        pgn: game.pgn,
      },
      update: {
        timeControl: game.timeControl,
        playedAt: game.playedAt,
        whiteName: game.whiteName,
        blackName: game.blackName,
        result: game.result,
        userColor,
        pgn: game.pgn,
      },
    });
    written += 1;
  }
  return written;
}

export async function pullGames(input: {
  source: GameSource;
  username: string;
  timeControls: TimeControl[];
  since?: Date;
  limit?: number;
  accessTokenEnc: string | null;
}): Promise<PlatformGame[]> {
  const token = input.accessTokenEnc
    ? decryptSecret(env.sessionSecret, input.accessTokenEnc)
    : null;
  if (input.source === 'chesscom') {
    return fetchChesscomGames({
      username: input.username,
      timeControls: input.timeControls,
      since: input.since,
      limit: input.limit,
    });
  }
  return fetchLichessGames({
    username: input.username,
    timeControls: input.timeControls,
    since: input.since,
    limit: input.limit,
    accessToken: token,
  });
}

export async function recoverInterruptedImports(): Promise<number> {
  const result = await getPrisma().onboarding.updateMany({
    where: { importStatus: 'running' },
    data: {
      importStatus: 'failed',
      importError: 'Import was interrupted. Try again.',
    },
  });
  return result.count;
}

export async function importLinkedSources(input: {
  userId: string;
  sources: GameSource[];
  timeControls: TimeControl[];
  completeOnboarding: boolean;
}): Promise<void> {
  const prisma = getPrisma();
  const accounts = await prisma.authAccount.findMany({
    where: { userId: input.userId, provider: { in: input.sources } },
  });

  let importedCount = 0;
  let failed = 0;

  for (const source of input.sources) {
    const account = accounts.find((item) => item.provider === source);
    if (!account?.username) {
      failed += 1;
      continue;
    }
    try {
      const games = await pullGames({
        source,
        username: account.username,
        timeControls: input.timeControls,
        limit: INITIAL_IMPORT_LIMIT,
        accessTokenEnc: account.accessTokenEnc,
      });
      await persistGames(input.userId, source, account.username, games);
      importedCount += games.length;
      const newest = games[0]?.playedAt ?? null;
      await prisma.syncState.upsert({
        where: { userId_source: { userId: input.userId, source } },
        create: {
          userId: input.userId,
          source,
          username: account.username,
          lastSyncedAt: new Date(),
          lastGamePlayedAt: newest,
        },
        update: {
          username: account.username,
          lastSyncedAt: new Date(),
          lastGamePlayedAt: newest,
          lastError: null,
        },
      });
    } catch (error) {
      failed += 1;
      logger.error({ err: error, userId: input.userId, source }, 'game import failed');
    }
  }

  if (failed === input.sources.length) {
    await prisma.onboarding.update({
      where: { userId: input.userId },
      data: {
        importStatus: 'failed',
        importError: 'Could not import games. Check the linked accounts and try again.',
      },
    });
    return;
  }

  await prisma.onboarding.update({
    where: { userId: input.userId },
    data: {
      importStatus: 'completed',
      importedCount,
      importError: null,
      completedAt: input.completeOnboarding ? new Date() : undefined,
    },
  });
}
