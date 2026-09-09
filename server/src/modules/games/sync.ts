import { GAME_SYNC_INTERVAL_MS } from '@peakelo/shared';
import { getPrisma } from '../../db/prisma';
import { logger } from '../../lib/logger';
import { persistGames, pullGames } from './import-games';

let timer: NodeJS.Timeout | null = null;

export async function syncDueAccounts(now = new Date()): Promise<number> {
  const prisma = getPrisma();
  const cutoff = new Date(now.getTime() - GAME_SYNC_INTERVAL_MS);
  const due = await prisma.syncState.findMany({
    where: {
      OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lte: cutoff } }],
    },
    include: {
      user: {
        include: {
          accounts: true,
          onboarding: true,
        },
      },
    },
  });

  let synced = 0;
  for (const row of due) {
    const account = row.user.accounts.find((item) => item.provider === row.source);
    const timeControls = row.user.onboarding?.timeControls ?? [];
    if (!account?.username || timeControls.length === 0) continue;
    try {
      const games = await pullGames({
        source: row.source,
        username: account.username,
        timeControls,
        since: row.lastGamePlayedAt ?? undefined,
        accessTokenEnc: account.accessTokenEnc,
      });
      await persistGames(row.userId, row.source, account.username, games);
      const newest = games[0]?.playedAt ?? row.lastGamePlayedAt ?? null;
      await prisma.syncState.update({
        where: { id: row.id },
        data: {
          lastSyncedAt: now,
          lastGamePlayedAt: newest,
          lastError: null,
          username: account.username,
        },
      });
      synced += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'sync failed';
      logger.error({ err: error, userId: row.userId, source: row.source }, 'game sync failed');
      await prisma.syncState.update({
        where: { id: row.id },
        data: { lastSyncedAt: now, lastError: message },
      });
    }
  }
  return synced;
}

export function startGameSyncScheduler(): void {
  if (timer) return;
  timer = setInterval(() => {
    void syncDueAccounts().catch((error) => {
      logger.error({ err: error }, 'game sync tick failed');
    });
  }, GAME_SYNC_INTERVAL_MS);
  timer.unref();
}

export function stopGameSyncScheduler(): void {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
