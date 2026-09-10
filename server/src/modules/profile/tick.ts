import { analyzePlayerGame, buildBareProfile } from '@peakelo/engine/pass';
import { bareProfileSchema } from '@peakelo/shared';
import type { Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { getPrisma } from '../../db/prisma';
import { logger } from '../../lib/logger';
import { getDefaultAdapter, type EngineAdapter } from '../engine';
import { parseAnalysisPlies, summarizeAnalyses } from './service';

const ERROR_MAX = 2000;

let tickInFlight = false;

export async function runEnginePassTick(
  now = new Date(),
  adapter: EngineAdapter = getDefaultAdapter(),
): Promise<number> {
  if (tickInFlight) return 0;
  tickInFlight = true;
  try {
    const claimed = await claimPendingAnalysis();
    if (!claimed) {
      await finalizeOrphanPasses(now);
      return 0;
    }
    await markPassRunning(claimed.userId, now);
    try {
      const result = await analyzePlayerGame({
        pgn: claimed.game.pgn,
        userColor: claimed.game.userColor === 'black' ? 'black' : 'white',
        evaluate: (fen) => adapter.evaluate(fen),
      });
      const playerPlies = result.plies.filter((ply) => ply.isPlayer).length;
      await getPrisma().gameAnalysis.update({
        where: { id: claimed.id },
        data: {
          status: 'ready',
          plies: result.plies as Prisma.InputJsonValue,
          playerAcpl: result.playerAcpl,
          analyzedPlies: playerPlies,
          totalPlies: playerPlies,
          analyzedAt: now,
          error: null,
          depth: env.ENGINE_DEPTH,
        },
      });
    } catch (error) {
      const message = clipError(error);
      logger.error(
        { err: error, userId: claimed.userId, gameId: claimed.gameId },
        'engine pass game failed',
      );
      await getPrisma().gameAnalysis.update({
        where: { id: claimed.id },
        data: { status: 'failed', error: message },
      });
    }
    await refreshEnginePass(claimed.userId, now);
    return 1;
  } finally {
    tickInFlight = false;
  }
}

async function claimPendingAnalysis() {
  const prisma = getPrisma();
  const pending = await prisma.gameAnalysis.findFirst({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!pending) return null;
  const claimed = await prisma.gameAnalysis.updateMany({
    where: { id: pending.id, status: 'pending' },
    data: { status: 'running' },
  });
  if (claimed.count !== 1) return null;
  return prisma.gameAnalysis.findUniqueOrThrow({
    where: { id: pending.id },
    include: { game: true },
  });
}

async function markPassRunning(userId: string, now: Date): Promise<void> {
  const prisma = getPrisma();
  const current = await prisma.enginePass.findUnique({ where: { userId } });
  await prisma.enginePass.upsert({
    where: { userId },
    create: {
      userId,
      status: 'running',
      startedAt: now,
      depth: env.ENGINE_DEPTH,
    },
    update: {
      status: 'running',
      startedAt: current?.startedAt ?? now,
      error: null,
      depth: env.ENGINE_DEPTH,
    },
  });
}

async function finalizeOrphanPasses(now: Date): Promise<void> {
  const prisma = getPrisma();
  const open = await prisma.enginePass.findMany({
    where: { status: { in: ['queued', 'running'] } },
    select: { userId: true },
  });
  for (const row of open) {
    const remaining = await prisma.gameAnalysis.count({
      where: { userId: row.userId, status: { in: ['pending', 'running'] } },
    });
    if (remaining === 0) {
      await refreshEnginePass(row.userId, now);
    }
  }
}

async function refreshEnginePass(userId: string, now: Date): Promise<void> {
  const prisma = getPrisma();
  const analyses = await prisma.gameAnalysis.findMany({
    where: { userId },
    include: { game: true },
  });
  const counts = summarizeAnalyses(analyses);
  const current = await prisma.enginePass.findUnique({ where: { userId } });

  if (counts.gamesQueued > 0) {
    await prisma.enginePass.upsert({
      where: { userId },
      create: {
        userId,
        status: 'running',
        startedAt: now,
        depth: env.ENGINE_DEPTH,
        ...counts,
      },
      update: {
        status: 'running',
        startedAt: current?.startedAt ?? now,
        depth: env.ENGINE_DEPTH,
        ...counts,
      },
    });
    return;
  }

  if (counts.gamesReady === 0) {
    await prisma.enginePass.upsert({
      where: { userId },
      create: {
        userId,
        status: counts.gamesFailed > 0 ? 'failed' : 'idle',
        depth: env.ENGINE_DEPTH,
        error: counts.gamesFailed > 0 ? 'Every imported game failed to analyze' : null,
        ...counts,
      },
      update: {
        status: counts.gamesFailed > 0 ? 'failed' : 'idle',
        depth: env.ENGINE_DEPTH,
        error: counts.gamesFailed > 0 ? 'Every imported game failed to analyze' : null,
        readyAt: null,
        ...counts,
      },
    });
    return;
  }

  try {
    const snapshot = bareProfileSchema.parse(
      buildBareProfile(
        analyses
          .filter((row) => row.status === 'ready')
          .map((row) => ({
            gameId: row.game.id,
            timeControl: row.game.timeControl,
            userColor: row.game.userColor === 'black' ? 'black' : 'white',
            result: asGameResult(row.game.result),
            plies: parseAnalysisPlies(row.plies),
          })),
        current?.depth ?? env.ENGINE_DEPTH,
      ),
    );
    await prisma.enginePass.upsert({
      where: { userId },
      create: {
        userId,
        status: 'ready',
        depth: env.ENGINE_DEPTH,
        snapshot,
        readyAt: now,
        startedAt: current?.startedAt ?? now,
        error: null,
        ...counts,
      },
      update: {
        status: 'ready',
        depth: env.ENGINE_DEPTH,
        snapshot,
        readyAt: now,
        startedAt: current?.startedAt ?? now,
        error: null,
        ...counts,
      },
    });
    logger.info({ userId, gamesReady: counts.gamesReady }, 'engine pass ready');
  } catch (error) {
    const message = clipError(error);
    logger.error({ err: error, userId }, 'engine pass snapshot failed');
    await prisma.enginePass.upsert({
      where: { userId },
      create: {
        userId,
        status: 'failed',
        depth: env.ENGINE_DEPTH,
        error: message,
        ...counts,
      },
      update: {
        status: 'failed',
        depth: env.ENGINE_DEPTH,
        error: message,
        ...counts,
      },
    });
  }
}

function clipError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'engine analysis failed';
  if (/ENOENT|not running|spawn|timed out/i.test(message)) {
    return 'The engine could not finish this game.';
  }
  return message.slice(0, ERROR_MAX);
}

function asGameResult(result: string): '1-0' | '0-1' | '1/2-1/2' | '*' {
  if (result === '1-0' || result === '0-1' || result === '1/2-1/2') return result;
  return '*';
}
