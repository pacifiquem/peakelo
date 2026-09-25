import { describe, expect, it } from 'vitest';
import { START_FEN } from '@peakelo/engine';
import type { AnalyzedPly, BareProfile, Writeup } from '@peakelo/shared';
import { materializeSyllabus } from '../src/modules/training/materialize';

const citation = {
  gameId: 'game-1',
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
  pvUci: ['e2e4', 'e7e5', 'g1f3'],
  pvSan: ['e4', 'e5', 'Nf3'],
  cpl: 80,
  judgment: 'inaccuracy',
  phase: 'opening',
  opening: null,
  opponentFast: false,
  overlooked: ['hanging_piece'],
};

const snapshot = {
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
} satisfies BareProfile;

const writeup = {
  headline: 'Stop hanging pieces.',
  playerKind: 'tactical',
  playerKindWhy: 'The wins are sharp; the losses are one-move hangs.',
  level: {
    band: 'from1600to2000',
    bandLabel: '1600–2000',
    rating: 1680,
    source: 'chesscom',
    timeControl: 'rapid',
    trajectory: 'A discipline project.',
  },
  deciders: { record: '1 game', story: 'The hang decided it.' },
  clock: { story: 'Not a scramble.' },
  mistakes: [{ name: 'Hangs', story: 'You leave pieces.', citations: [citation] }],
  structures: [],
  tactics: [],
  keep: [],
  now: [
    {
      title: 'Stop hanging pieces',
      why: 'Highest-leverage leak.',
      stepId: 'blunder-preventer',
      citations: [citation],
    },
  ],
} satisfies Writeup;

describe('materializeSyllabus', () => {
  it('builds drills from cited FENs and stored best moves', () => {
    const syllabus = materializeSyllabus({
      writeup,
      snapshot,
      analyses: new Map([['game-1', [ply]]]),
      band: 'from1600to2000',
      goal: 'blunders',
    });
    expect(syllabus.steps).toHaveLength(1);
    expect(syllabus.steps[0]?.drafts[0]).toMatchObject({
      kind: 'blunder_preventer',
      fen: START_FEN,
      sourceGameId: 'game-1',
      sourcePly: 1,
      goalUci: ['e2e4', 'e7e5', 'g1f3'],
    });
  });

  it('keeps every now[] action as its own step when they share a kind', () => {
    const secondPly = { ...ply, ply: 2 };
    const secondCitation = { ...citation, ply: 2 };
    const syllabus = materializeSyllabus({
      writeup: {
        ...writeup,
        now: [
          {
            title: 'Stop hanging pieces',
            why: 'Hangs.',
            stepId: 'blunder-preventer',
            citations: [citation],
          },
          {
            title: 'Scan checks',
            why: 'Missed mates.',
            stepId: 'blunder-preventer',
            citations: [secondCitation],
          },
        ],
      },
      snapshot,
      analyses: new Map([['game-1', [ply, secondPly]]]),
      band: 'from1600to2000',
      goal: 'blunders',
    });
    expect(syllabus.steps.map((step) => step.id)).toEqual(['blunder-preventer', 'blunder-preventer-2']);
    expect(syllabus.steps.every((step) => step.kind === 'blunder_preventer')).toBe(true);
  });

  it('keeps a replay drill for an Under 400 student instead of an empty syllabus', () => {
    const syllabus = materializeSyllabus({
      writeup: {
        ...writeup,
        now: [
          {
            title: 'Find a plan vs c5',
            why: 'You shuffle.',
            stepId: 'make-a-plan',
            citations: [citation],
          },
        ],
      },
      snapshot,
      analyses: new Map([['game-1', [ply]]]),
      band: 'under400',
      goal: 'openings',
    });
    expect(syllabus.steps.length).toBeGreaterThan(0);
    expect(syllabus.steps.every((step) => step.kind !== 'make_plan')).toBe(true);
  });
});
