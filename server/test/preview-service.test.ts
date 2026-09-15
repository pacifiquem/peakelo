import { afterAll, describe, expect, it } from 'vitest';
import { START_FEN } from '@peakelo/engine';
import type { AnalyzedPly, PublicReviewWriteup } from '@peakelo/shared';
import { BadRequestError, ServiceUnavailableError } from '../src/common/errors';
import { getPrisma } from '../src/db/prisma';
import { UpstreamError } from '../src/lib/http';
import { parseGeneratedPublicReview } from '../src/modules/preview/agent';
import {
  buildReviewMessage,
  getPublicReview,
  runPreviewTick,
  startPublicReview,
} from '../src/modules/preview/service';

const hasDatabase = Boolean(process.env.DATABASE_URL);

const PGN = `[Event "Test"]
[White "Alice"]
[Black "Bob"]
[Result "1-0"]

1. e4 e5 1-0`;

const ply = (n: number, san: string, uci: string, color: 'white' | 'black'): AnalyzedPly => ({
  ply: n,
  san,
  uci,
  fenBefore: START_FEN,
  fenAfter: START_FEN,
  color,
  isPlayer: color === 'white',
  clockAfterMs: null,
  timeSpentMs: null,
  evalBefore: { kind: 'cp', value: 20 },
  evalAfter: { kind: 'cp', value: color === 'white' ? 80 : -80 },
  bestEval: { kind: 'cp', value: 30 },
  bestUci: uci,
  bestSan: san,
  pvUci: [uci],
  pvSan: [san],
  cpl: n === 2 ? 200 : 10,
  judgment: n === 2 ? 'mistake' : 'best',
  phase: 'opening',
  opening: { eco: 'C20', name: "King's Pawn Game" },
  opponentFast: false,
  overlooked: n === 2 ? ['hanging_piece'] : [],
});

const writeup: PublicReviewWriteup = {
  headline: 'Black hung the center.',
  story: 'Alice opened e4. Bob answered e5 and then the file turned on a hang.',
  decidedBy: 'A hanging piece in the opening.',
  opening: "King's Pawn Game",
  keyPlies: [{ ply: 2, san: 'e5', color: 'black', why: 'This is where the leak starts.' }],
  whiteHabit: 'Keep asking if the pawn is free.',
  blackHabit: 'Do not leave e5 loose.',
};

describe('startPublicReview', () => {
  it('rejects a host we do not fetch', async () => {
    await expect(startPublicReview('https://example.com/game/live/123456')).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('maps an upstream fetch failure to 503', async () => {
    await expect(
      startPublicReview('https://lichess.org/UpStReam', {
        fetchGame: async () => {
          throw new UpstreamError('Upstream 403', 403);
        },
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
  });
});

describe('public review coach brief', () => {
  it('sends the PGN, scoresheet, and notable FENs', () => {
    const plies = [ply(1, 'e4', 'e2e4', 'white'), ply(2, 'e5', 'e7e5', 'black')];
    const brief = buildReviewMessage(
      {
        source: 'lichess',
        timeControl: 'rapid',
        whiteName: 'Alice',
        blackName: 'Bob',
        result: '1-0',
        whiteRating: 1600,
        blackRating: 1580,
        pgn: PGN,
      },
      plies,
    );
    expect(brief).toContain(PGN);
    expect(brief).toContain('fenBefore');
    expect(brief).toContain('Spectator review');
    expect(brief).not.toContain('This student');
  });

  it('rejects a writeup that invents a ply', () => {
    expect(() =>
      parseGeneratedPublicReview(
        { ...writeup, keyPlies: [{ ply: 99, san: 'Qxh7#', color: 'white', why: 'Mate.' }] },
        [ply(1, 'e4', 'e2e4', 'white'), ply(2, 'e5', 'e7e5', 'black')],
      ),
    ).toThrow(ServiceUnavailableError);
  });
});

describe.skipIf(!hasDatabase)('public review service', () => {
  const prisma = getPrisma();
  const leftover: string[] = [];

  afterAll(async () => {
    if (leftover.length > 0) {
      await prisma.publicReview.deleteMany({ where: { id: { in: leftover } } }).catch(() => undefined);
    }
  });

  it('fetches, analyzes, and stores a coach review without a session', async () => {
    const started = await startPublicReview('https://lichess.org/AbCdEf12', {
      fetchGame: async () => ({
        externalId: 'AbCdEf12',
        timeControl: 'rapid',
        playedAt: new Date('2026-09-01T00:00:00.000Z'),
        whiteName: 'Alice',
        blackName: 'Bob',
        result: '1-0',
        pgn: PGN,
        whiteRating: 1600,
        blackRating: 1580,
      }),
    });
    leftover.push(started.id);
    expect(started.status).toBe('queued');

    const processed = await runPreviewTick({
      analyze: async () => [ply(1, 'e4', 'e2e4', 'white'), ply(2, 'e5', 'e7e5', 'black')],
      isConfigured: () => true,
      generateReview: async () => writeup,
    });
    expect(processed).toBe(1);

    const ready = await getPublicReview(started.id);
    expect(ready.status).toBe('ready');
    expect(ready.review?.headline).toBe('Black hung the center.');
    expect(ready.analysis.plies).toHaveLength(2);
  });

  it('requeues a coach-offline row without running the engine again', async () => {
    const started = await startPublicReview('https://lichess.org/CdEfGh34', {
      fetchGame: async () => ({
        externalId: 'CdEfGh34',
        timeControl: 'blitz',
        playedAt: new Date('2026-09-01T00:00:00.000Z'),
        whiteName: 'Alice',
        blackName: 'Bob',
        result: '1-0',
        pgn: PGN,
        whiteRating: 1400,
        blackRating: 1410,
      }),
    });
    leftover.push(started.id);

    await runPreviewTick({
      analyze: async () => [ply(1, 'e4', 'e2e4', 'white'), ply(2, 'e5', 'e7e5', 'black')],
      isConfigured: () => true,
      generateReview: async () => {
        throw new Error('credits');
      },
    });
    const offline = await getPublicReview(started.id);
    expect(offline.status).toBe('ready');
    expect(offline.review).toBeNull();

    const again = await startPublicReview('https://lichess.org/CdEfGh34', {
      isConfigured: () => true,
    });
    expect(again.status).toBe('queued');
    expect(again.analysis.plies).toHaveLength(2);

    let analyzed = 0;
    await runPreviewTick({
      analyze: async () => {
        analyzed += 1;
        throw new Error('engine should not run again');
      },
      isConfigured: () => true,
      generateReview: async () => writeup,
    });
    expect(analyzed).toBe(0);
    const ready = await getPublicReview(started.id);
    expect(ready.review?.headline).toBe('Black hung the center.');
  });
});
