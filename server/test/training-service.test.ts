import { afterAll, describe, expect, it } from 'vitest';
import { START_FEN } from '@peakelo/engine';
import type { AnalyzedPly, BareProfile, Writeup } from '@peakelo/shared';
import { getPrisma } from '../src/db/prisma';
import { generateAndStore, getDrillPlay, playDrillMove } from '../src/modules/training/service';

const hasDatabase = Boolean(process.env.DATABASE_URL);

const citation = {
  gameId: 'pending',
  ply: 1,
  san: 'a3',
  playedSan: 'a3',
  bestSan: 'e4',
  fenBefore: START_FEN,
  cpl: 80,
};

const ply: AnalyzedPly = {
  ply: 1,
  san: 'a3',
  uci: 'a2a3',
  fenBefore: START_FEN,
  fenAfter: START_FEN,
  color: 'white',
  isPlayer: true,
  clockAfterMs: null,
  timeSpentMs: null,
  evalBefore: { kind: 'cp', value: 20 },
  evalAfter: { kind: 'cp', value: -10 },
  bestEval: { kind: 'cp', value: 30 },
  bestUci: 'e2e4',
  bestSan: 'e4',
  pvUci: ['e2e4'],
  pvSan: ['e4'],
  cpl: 80,
  judgment: 'inaccuracy',
  phase: 'opening',
  opening: null,
  opponentFast: false,
  overlooked: ['hanging_piece'],
};

function snapshot(gameId: string): BareProfile {
  const cited = { ...citation, gameId };
  return {
    generatedAt: '2026-09-12T00:00:00.000Z',
    depth: 12,
    games: 1,
    playerMoves: 1,
    byTimeControl: {},
    asWhite: { games: 1, score: 0, acpl: 80, firstMoves: [] },
    asBlack: { games: 0, score: 0, acpl: 0, firstMoves: [] },
    openings: [],
    structures: [],
    mistakes: [{ overlooked: 'hanging_piece', count: 1, avgCpl: 80, citations: [cited] }],
    tactics: [],
    clock: {
      avgTimeSpentMs: null,
      blundersUnder3s: 0,
      blundersWithUnder20sLeft: 0,
      opponentFastBlunders: 0,
    },
    phases: {
      opening: { moves: 1, acpl: 80, blunders: 0, blunderRate: 0 },
      middlegame: { moves: 0, acpl: 0, blunders: 0, blunderRate: 0 },
      endgame: { moves: 0, acpl: 0, blunders: 0, blunderRate: 0 },
    },
  };
}

function writeup(gameId: string): Writeup {
  const cited = { ...citation, gameId };
  return {
    headline: 'Stop hanging pieces.',
    playerKind: 'tactical',
    playerKindWhy: 'The losses are one-move hangs.',
    level: {
      band: 'from1600to2000',
      bandLabel: '1600–2000',
      rating: 1680,
      source: 'chesscom',
      timeControl: 'rapid',
      trajectory: 'Discipline, not knowledge.',
    },
    deciders: { record: '0-1', story: 'The hang decided it.' },
    clock: { story: 'Not a scramble.' },
    mistakes: [{ name: 'Hangs', story: 'You leave pieces.', citations: [cited] }],
    structures: [],
    tactics: [],
    keep: [],
    now: [
      {
        title: 'Stop hanging pieces',
        why: 'Highest-leverage leak.',
        stepId: 'blunder-preventer',
        citations: [cited],
      },
    ],
  };
}

describe.skipIf(!hasDatabase)('training service', () => {
  const prisma = getPrisma();
  const leftover: string[] = [];

  afterAll(async () => {
    if (leftover.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: leftover } } }).catch(() => undefined);
    }
  });

  async function seed() {
    const user = await prisma.user.create({
      data: {
        email: `training-${Date.now()}-${Math.random().toString(16).slice(2)}@peakelo.test`,
        displayName: 'Training',
        onboarding: { create: { trainingFocus: 'blunders', noteAsked: true, completedAt: new Date() } },
        games: {
          create: {
            source: 'chesscom',
            externalId: `tr-${Date.now()}`,
            timeControl: 'rapid',
            playedAt: new Date('2026-09-01T00:00:00.000Z'),
            whiteName: 'Alice',
            blackName: 'Bob',
            result: '0-1',
            userColor: 'white',
            pgn: '1. a3 e5 0-1',
            whiteRating: 1680,
            blackRating: 1700,
          },
        },
      },
      include: { games: true },
    });
    leftover.push(user.id);
    const gameId = user.games[0]!.id;
    await prisma.gameAnalysis.create({
      data: {
        gameId,
        userId: user.id,
        status: 'ready',
        plies: [ply],
        analyzedPlies: 1,
        totalPlies: 1,
      },
    });
    await prisma.enginePass.create({
      data: {
        userId: user.id,
        status: 'ready',
        snapshot: snapshot(gameId),
        gamesReady: 1,
        readyAt: new Date(),
      },
    });
    return { userId: user.id, gameId };
  }

  it('materializes playable drills from a fake writeup and grades a hit', async () => {
    const { userId, gameId } = await seed();
    await generateAndStore(userId, {
      isConfigured: () => true,
      generateWriteup: async () => writeup(gameId),
    });

    const drill = await prisma.drill.findFirst({ where: { userId } });
    expect(drill?.kind).toBe('blunder_preventer');
    expect(drill?.goalUci).toEqual(['e2e4']);
    const play = await getDrillPlay(userId, drill!.id);
    expect(play.eval).toEqual({ kind: 'cp', value: 20 });
    expect(play.sideToMove).toBe('white');

    const move = await playDrillMove(
      userId,
      drill!.id,
      { playedUci: [], uci: 'e2e4' },
      { engineLines: async () => [] },
    );
    expect(move.result).toBe('hit');
    const again = await prisma.drill.findUnique({ where: { id: drill!.id } });
    expect(again?.status).toBe('done');
    expect(again?.hitCount).toBe(1);
  });
});
