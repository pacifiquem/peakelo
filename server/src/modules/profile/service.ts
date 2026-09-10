import { replayPgn } from '@peakelo/engine';
import {
  analyzedPlySchema,
  bareProfileSchema,
  idleEnginePass,
  type AnalyzedPly,
  type BareProfile,
  type EnginePass,
  type EnginePassStatus,
  type PublicProfile,
} from '@peakelo/shared';
import { Prisma, type EnginePass as EnginePassRow } from '@prisma/client';
import { env } from '../../config/env';
import { getPrisma } from '../../db/prisma';

export function toEnginePass(row: EnginePassRow | null): EnginePass {
  if (!row) return idleEnginePass();
  return {
    status: row.status,
    gamesQueued: row.gamesQueued,
    gamesReady: row.gamesReady,
    gamesFailed: row.gamesFailed,
    movesAnalyzed: row.movesAnalyzed,
    movesTotal: row.movesTotal,
    depth: row.depth,
    error: row.error,
    startedAt: row.startedAt?.toISOString() ?? null,
    readyAt: row.readyAt?.toISOString() ?? null,
  };
}

export function parseAnalysisPlies(value: Prisma.JsonValue | null): AnalyzedPly[] {
  if (!Array.isArray(value)) return [];
  const parsed = analyzedPlySchema.array().safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function parseBareSnapshot(value: Prisma.JsonValue | null | undefined): BareProfile | null {
  if (value == null) return null;
  const parsed = bareProfileSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function summarizeAnalyses(
  analyses: Array<{ status: string; analyzedPlies: number; totalPlies: number }>,
) {
  const gamesReady = analyses.filter((row) => row.status === 'ready').length;
  const gamesFailed = analyses.filter((row) => row.status === 'failed').length;
  const gamesQueued = analyses.filter(
    (row) => row.status === 'pending' || row.status === 'running',
  ).length;
  const movesAnalyzed = analyses
    .filter((row) => row.status === 'ready' || row.status === 'running')
    .reduce((sum, row) => sum + row.analyzedPlies, 0);
  const movesTotal = analyses.reduce((sum, row) => sum + row.totalPlies, 0);
  return { gamesReady, gamesFailed, gamesQueued, movesAnalyzed, movesTotal };
}

export async function recoverInterruptedEnginePasses(): Promise<number> {
  const prisma = getPrisma();
  const analyses = await prisma.gameAnalysis.updateMany({
    where: { status: 'running' },
    data: { status: 'pending' },
  });
  await prisma.enginePass.updateMany({
    where: { status: 'running' },
    data: { status: 'queued' },
  });
  return analyses.count;
}

export async function queueEnginePass(userId: string): Promise<void> {
  const prisma = getPrisma();
  const games = await prisma.game.findMany({
    where: { userId },
    include: { analysis: true },
  });

  if (games.length === 0) {
    await prisma.enginePass.upsert({
      where: { userId },
      create: { userId, status: 'idle', depth: env.ENGINE_DEPTH },
      update: {
        status: 'idle',
        gamesQueued: 0,
        gamesReady: 0,
        gamesFailed: 0,
        movesAnalyzed: 0,
        movesTotal: 0,
        depth: env.ENGINE_DEPTH,
        error: null,
        snapshot: Prisma.JsonNull,
        startedAt: null,
        readyAt: null,
      },
    });
    return;
  }

  const current = await prisma.enginePass.findUnique({ where: { userId } });

  for (const game of games) {
    if (game.analysis?.status === 'ready' || game.analysis?.status === 'running') continue;
    const replayed = replayPgn(game.pgn);
    const userColor = game.userColor === 'black' ? 'black' : 'white';
    const totalPlies = replayed.plies.filter((ply) => {
      const color = ply.ply % 2 === 1 ? 'white' : 'black';
      return color === userColor;
    }).length;
    await prisma.gameAnalysis.upsert({
      where: { gameId: game.id },
      create: {
        gameId: game.id,
        userId,
        status: 'pending',
        depth: env.ENGINE_DEPTH,
        totalPlies,
      },
      update: {
        status: 'pending',
        depth: env.ENGINE_DEPTH,
        totalPlies,
        error: null,
      },
    });
  }

  const analyses = await prisma.gameAnalysis.findMany({
    where: { userId },
    select: { status: true, analyzedPlies: true, totalPlies: true },
  });
  const counts = summarizeAnalyses(analyses);
  const status = nextQueueStatus(current, counts);

  await prisma.enginePass.upsert({
    where: { userId },
    create: {
      userId,
      status,
      depth: env.ENGINE_DEPTH,
      ...counts,
    },
    update: {
      status,
      depth: env.ENGINE_DEPTH,
      error: status === 'failed' ? current?.error ?? null : null,
      ...counts,
    },
  });
}

export async function getPublicProfile(userId: string): Promise<PublicProfile> {
  const row = await getPrisma().enginePass.findUnique({ where: { userId } });
  return {
    pass: toEnginePass(row),
    profile: parseBareSnapshot(row?.snapshot ?? null),
  };
}

function nextQueueStatus(
  current: EnginePassRow | null,
  counts: ReturnType<typeof summarizeAnalyses>,
): EnginePassStatus {
  if (current?.status === 'running') return 'running';
  if (counts.gamesQueued > 0) return 'queued';
  if (counts.gamesReady > 0 && current?.snapshot) return 'ready';
  if (counts.gamesReady > 0) return 'queued';
  if (counts.gamesFailed > 0) return 'failed';
  return 'idle';
}
