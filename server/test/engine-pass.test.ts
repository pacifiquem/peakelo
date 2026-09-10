import { afterAll, describe, expect, it } from 'vitest';
import { bareProfileSchema, idleEnginePass } from '@peakelo/shared';
import { getPrisma } from '../src/db/prisma';
import { createFakeAdapter } from '../src/modules/engine';
import { queueEnginePass, toEnginePass } from '../src/modules/profile/service';
import { runEnginePassTick } from '../src/modules/profile/tick';

const hasDatabase = Boolean(process.env.DATABASE_URL);

const E4_E5_PGN = `[Event "Test"]
[Site "Peakelo"]
[White "Alice"]
[Black "Bob"]
[Result "1/2-1/2"]

1. e4 e5 1/2-1/2`;

function fakeEvalAdapter() {
  return createFakeAdapter((fen) => {
    const uci = fen.split(' ')[1] === 'b' ? 'e7e5' : 'e2e4';
    return { lines: [{ uci, score: { kind: 'cp', value: 0 }, pvUci: [uci] }] };
  });
}

describe('toEnginePass', () => {
  it('maps a missing row to the idle snapshot', () => {
    expect(toEnginePass(null)).toEqual(idleEnginePass());
  });
});

describe.skipIf(!hasDatabase)('engine pass tick', () => {
  const prisma = getPrisma();
  const leftoverUserIds: string[] = [];

  afterAll(async () => {
    if (leftoverUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: leftoverUserIds } } }).catch(() => undefined);
    }
  });

  async function seedUserWithGame(externalId: string) {
    const user = await prisma.user.create({
      data: {
        email: `engine-pass-${externalId}@peakelo.test`,
        displayName: 'Engine Pass',
        games: {
          create: {
            source: 'lichess',
            externalId,
            timeControl: 'rapid',
            playedAt: new Date('2026-01-01T00:00:00.000Z'),
            whiteName: 'Alice',
            blackName: 'Bob',
            result: '1/2-1/2',
            userColor: 'white',
            pgn: E4_E5_PGN,
          },
        },
      },
    });
    leftoverUserIds.push(user.id);
    return user;
  }

  it('moves a pending analysis to ready and writes a snapshot for the only game', async () => {
    const user = await seedUserWithGame(`ready-${Date.now()}`);
    await queueEnginePass(user.id);

    const pending = await prisma.gameAnalysis.findFirst({ where: { userId: user.id } });
    expect(pending?.status).toBe('pending');

    const adapter = fakeEvalAdapter();
    const processed = await runEnginePassTick(new Date('2026-09-10T12:00:00.000Z'), adapter);
    expect(processed).toBe(1);

    const analysis = await prisma.gameAnalysis.findFirst({ where: { userId: user.id } });
    expect(analysis?.status).toBe('ready');
    expect(analysis?.analyzedAt).not.toBeNull();

    const pass = await prisma.enginePass.findUnique({ where: { userId: user.id } });
    expect(pass?.status).toBe('ready');
    expect(pass?.gamesReady).toBe(1);
    expect(pass?.snapshot).not.toBeNull();
    expect(bareProfileSchema.parse(pass?.snapshot).games).toBe(1);

    const idle = await runEnginePassTick(new Date('2026-09-10T12:00:02.000Z'), adapter);
    expect(idle).toBe(0);
    await adapter.close();
  });

  it('marks a game failed when the adapter throws', async () => {
    const user = await seedUserWithGame(`fail-${Date.now()}`);
    await queueEnginePass(user.id);

    const adapter = createFakeAdapter(() => {
      throw new Error('engine exploded');
    });
    const processed = await runEnginePassTick(new Date('2026-09-10T12:00:00.000Z'), adapter);
    expect(processed).toBe(1);

    const analysis = await prisma.gameAnalysis.findFirst({ where: { userId: user.id } });
    expect(analysis?.status).toBe('failed');
    expect(analysis?.error).toBe('engine exploded');

    const pass = await prisma.enginePass.findUnique({ where: { userId: user.id } });
    expect(pass?.status).toBe('failed');
    expect(pass?.gamesFailed).toBe(1);
    expect(pass?.gamesReady).toBe(0);
    await adapter.close();
  });

  it('does not reset a running analysis when the pass is queued again', async () => {
    const user = await seedUserWithGame(`running-${Date.now()}`);
    await queueEnginePass(user.id);
    const pending = await prisma.gameAnalysis.findFirst({ where: { userId: user.id } });
    expect(pending).not.toBeNull();
    await prisma.gameAnalysis.update({
      where: { id: pending!.id },
      data: { status: 'running' },
    });

    await queueEnginePass(user.id);

    const again = await prisma.gameAnalysis.findFirst({ where: { userId: user.id } });
    expect(again?.status).toBe('running');
  });
});
