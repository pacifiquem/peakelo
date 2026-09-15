import { describe, expect, it } from 'vitest';
import {
  hydrateWriteup,
  idleWriteup,
  normalizeWriteupStepId,
  playerKindSchema,
  writeupDraftSchema,
  writeupSchema,
} from '../src/writeup';
import type { BareProfile } from '../src/profile';

const citation = {
  gameId: 'g1',
  ply: 17,
  san: 'Qxe3',
  playedSan: 'Qxe3',
  bestSan: 'Bd2',
  fenBefore: '8/8/8/8/8/8/8/8 w - - 0 1',
  cpl: 600,
};

describe('writeupSchema', () => {
  it('accepts a cited coach document and rejects an empty now list', () => {
    const document = {
      headline: 'A tactical club player capped by hangs.',
      playerKind: 'tactical',
      playerKindWhy: 'You already find sacrifices; the losses are one-move hangs.',
      level: {
        band: 'from1600to2000',
        bandLabel: '1600–2000',
        rating: 1680,
        source: 'chesscom',
        timeControl: 'rapid',
        trajectory: '2000 is a discipline project, not a knowledge gap.',
      },
      deciders: { record: '52W–39L–9D', story: 'Zero-blunder games score 77%.' },
      clock: { story: 'The hangs are not only a scramble problem.' },
      mistakes: [
        {
          name: 'Hanging pieces',
          story: 'You put a piece on a square they can take for free.',
          citations: [citation],
        },
      ],
      structures: [],
      tactics: [],
      keep: [],
      now: [
        {
          title: 'Stop hanging the English bishop',
          why: 'Highest-leverage leak in this file.',
          stepId: 'blunder-preventer',
          citations: [citation],
        },
      ],
    };
    expect(writeupSchema.parse(document).playerKind).toBe('tactical');
    expect(playerKindSchema.options).toContain('mixed');
    expect(idleWriteup().status).toBe('idle');
    expect(() => writeupSchema.parse({ ...document, now: [] })).toThrow();
  });

  it('normalizes step ids and hydrates citation refs from the snapshot', () => {
    expect(normalizeWriteupStepId('Blunder preventer')).toBe('blunder-preventer');
    expect(normalizeWriteupStepId('make_plan')).toBe('make-a-plan');

    const snapshot: BareProfile = {
      generatedAt: '2026-09-12T00:00:00.000Z',
      depth: 12,
      games: 1,
      playerMoves: 1,
      byTimeControl: {},
      asWhite: { games: 1, score: 0, acpl: 80, firstMoves: [] },
      asBlack: { games: 0, score: 0, acpl: 0, firstMoves: [] },
      openings: [],
      structures: [],
      mistakes: [{ overlooked: 'hanging_piece', count: 1, avgCpl: 80, citations: [citation] }],
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

    const draft = writeupDraftSchema.parse({
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
      mistakes: [{ name: 'Hangs', story: 'You leave pieces.', citations: [{ gameId: 'g1', ply: 17 }] }],
      structures: [{ name: 'Invented', story: 'Not in the file.', citations: [{ gameId: 'nope', ply: 1 }] }],
      tactics: [],
      keep: [],
      now: [
        {
          title: 'Stop hanging pieces',
          why: 'Highest-leverage leak.',
          stepId: 'blunder_preventer',
          citations: [{ gameId: 'g1', ply: 17 }, { gameId: 'ghost', ply: 99 }],
        },
      ],
    });

    const hydrated = hydrateWriteup(draft, snapshot);
    expect(hydrated.now[0]?.stepId).toBe('blunder-preventer');
    expect(hydrated.now[0]?.citations).toEqual([citation]);
    expect(hydrated.mistakes[0]?.citations).toEqual([citation]);
    expect(hydrated.structures).toEqual([]);
    expect(writeupSchema.parse(hydrated).headline).toBe('Stop hanging pieces.');
  });

  it('rejects a draft whose now[] cites nothing in the snapshot', () => {
    const snapshot: BareProfile = {
      generatedAt: '2026-09-12T00:00:00.000Z',
      depth: 12,
      games: 0,
      playerMoves: 0,
      byTimeControl: {},
      asWhite: { games: 0, score: 0, acpl: 0, firstMoves: [] },
      asBlack: { games: 0, score: 0, acpl: 0, firstMoves: [] },
      openings: [],
      structures: [],
      mistakes: [],
      tactics: [],
      clock: {
        avgTimeSpentMs: null,
        blundersUnder3s: 0,
        blundersWithUnder20sLeft: 0,
        opponentFastBlunders: 0,
      },
      phases: {
        opening: { moves: 0, acpl: 0, blunders: 0, blunderRate: 0 },
        middlegame: { moves: 0, acpl: 0, blunders: 0, blunderRate: 0 },
        endgame: { moves: 0, acpl: 0, blunders: 0, blunderRate: 0 },
      },
    };
    expect(() =>
      hydrateWriteup(
        writeupDraftSchema.parse({
          headline: 'Empty.',
          playerKind: 'mixed',
          playerKindWhy: 'No file.',
          level: {
            band: 'from1200to1600',
            bandLabel: '1200–1600',
            rating: null,
            source: null,
            timeControl: null,
            trajectory: 'No rating stored.',
          },
          deciders: { record: '0-0', story: 'No games.' },
          clock: { story: 'No clock.' },
          mistakes: [],
          structures: [],
          tactics: [],
          keep: [],
          now: [
            {
              title: 'Invented',
              why: 'Not in the snapshot.',
              stepId: 'blunder-preventer',
              citations: [{ gameId: 'ghost', ply: 1 }],
            },
          ],
        }),
        snapshot,
      ),
    ).toThrow(/now\[\]/);
  });
});
