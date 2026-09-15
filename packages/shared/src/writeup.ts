import { z } from 'zod';

import { gameSourceSchema, timeControlSchema } from './enums';
import {
  bareProfileSchema,
  citationSchema,
  enginePassSchema,
  type BareProfile,
  type Citation,
} from './profile';
import { courseSkillBandSchema } from './rating';

export const writeupStatusSchema = z.enum(['idle', 'queued', 'running', 'ready', 'failed']);
export type WriteupStatus = z.infer<typeof writeupStatusSchema>;

export const playerKindSchema = z.enum(['tactical', 'positional', 'gambiteer', 'mixed']);
export type PlayerKind = z.infer<typeof playerKindSchema>;

const citedBlockSchema = z.object({
  name: z.string().min(1).max(80),
  story: z.string().min(1).max(900),
  citations: z.array(citationSchema).min(1).max(6),
});

export const writeupNowItemSchema = z.object({
  title: z.string().min(1).max(80),
  why: z.string().min(1).max(400),
  stepId: z.string().min(1).max(40),
  citations: z.array(citationSchema).min(1).max(6),
});
export type WriteupNowItem = z.infer<typeof writeupNowItemSchema>;

export const writeupSchema = z.object({
  headline: z.string().min(1).max(200),
  playerKind: playerKindSchema,
  playerKindWhy: z.string().min(1).max(400),
  level: z.object({
    band: courseSkillBandSchema,
    bandLabel: z.string().min(1).max(40),
    rating: z.number().int().positive().nullable(),
    source: gameSourceSchema.nullable(),
    timeControl: timeControlSchema.nullable(),
    trajectory: z.string().min(1).max(400),
  }),
  deciders: z.object({
    record: z.string().min(1).max(240),
    story: z.string().min(1).max(900),
  }),
  clock: z.object({
    story: z.string().min(1).max(500),
  }),
  mistakes: z.array(citedBlockSchema).max(8),
  structures: z.array(citedBlockSchema).max(6),
  tactics: z.array(citedBlockSchema).max(6),
  keep: z.array(citedBlockSchema).max(6),
  now: z.array(writeupNowItemSchema).min(1).max(5),
});
export type Writeup = z.infer<typeof writeupSchema>;

export const WRITEUP_STEP_IDS = [
  'blunder-preventer',
  'replay-mistake',
  'defend-worse',
  'convert-advantage',
  'make-a-plan',
] as const;
export type WriteupStepId = (typeof WRITEUP_STEP_IDS)[number];

export const writeupCitationRefSchema = z.object({
  gameId: z.string().min(1),
  ply: z.coerce.number().int().positive(),
});
export type WriteupCitationRef = z.infer<typeof writeupCitationRefSchema>;

const citedBlockDraftSchema = z.object({
  name: z.string().min(1).max(80),
  story: z.string().min(1).max(900),
  citations: z.array(writeupCitationRefSchema).min(1).max(6),
});

export const writeupNowDraftSchema = z.object({
  title: z.string().min(1).max(80),
  why: z.string().min(1).max(400),
  stepId: z.string().min(1).max(40),
  citations: z.array(writeupCitationRefSchema).min(1).max(6),
});

export const writeupDraftSchema = writeupSchema.extend({
  mistakes: z.array(citedBlockDraftSchema).max(8),
  structures: z.array(citedBlockDraftSchema).max(6),
  tactics: z.array(citedBlockDraftSchema).max(6),
  keep: z.array(citedBlockDraftSchema).max(6),
  now: z.array(writeupNowDraftSchema).min(1).max(5),
});
export type WriteupDraft = z.infer<typeof writeupDraftSchema>;

const STEP_ID_ALIASES: Record<string, WriteupStepId> = {
  'blunder-preventer': 'blunder-preventer',
  'blunder-preventor': 'blunder-preventer',
  'replay-mistake': 'replay-mistake',
  'replay-the-mistake': 'replay-mistake',
  'defend-worse': 'defend-worse',
  'convert-advantage': 'convert-advantage',
  'make-a-plan': 'make-a-plan',
  'make-plan': 'make-a-plan',
};

export function normalizeWriteupStepId(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/[_\s]+/g, '-');
  return STEP_ID_ALIASES[key] ?? raw.trim();
}

export function collectSnapshotCitations(snapshot: BareProfile): Map<string, Citation> {
  const map = new Map<string, Citation>();
  const add = (citation: Citation) => {
    map.set(`${citation.gameId}:${citation.ply}`, citation);
  };
  for (const group of snapshot.mistakes) group.citations.forEach(add);
  for (const group of snapshot.openings) group.citations.forEach(add);
  for (const group of snapshot.structures) group.citations.forEach(add);
  for (const group of snapshot.tactics) group.citations.forEach(add);
  return map;
}

export function hydrateWriteup(draft: WriteupDraft, snapshot: BareProfile): Writeup {
  const index = collectSnapshotCitations(snapshot);
  const hydrateBlock = (block: { name: string; story: string; citations: WriteupCitationRef[] }) => {
    const citations = uniqueCitations(
      block.citations
        .map((ref) => index.get(`${ref.gameId}:${ref.ply}`))
        .filter((item): item is Citation => Boolean(item)),
    );
    if (citations.length === 0) return null;
    return { name: block.name, story: block.story, citations: citations.slice(0, 6) };
  };

  const now = draft.now
    .map((item) => {
      const citations = uniqueCitations(
        item.citations
          .map((ref) => index.get(`${ref.gameId}:${ref.ply}`))
          .filter((row): row is Citation => Boolean(row)),
      );
      if (citations.length === 0) return null;
      return {
        title: item.title,
        why: item.why,
        stepId: normalizeWriteupStepId(item.stepId),
        citations: citations.slice(0, 6),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (now.length === 0) {
    throw new Error('Writeup now[] cited no snapshot positions');
  }

  return {
    ...draft,
    mistakes: draft.mistakes.map(hydrateBlock).filter((item): item is NonNullable<typeof item> => Boolean(item)),
    structures: draft.structures
      .map(hydrateBlock)
      .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    tactics: draft.tactics.map(hydrateBlock).filter((item): item is NonNullable<typeof item> => Boolean(item)),
    keep: draft.keep.map(hydrateBlock).filter((item): item is NonNullable<typeof item> => Boolean(item)),
    now,
  };
}

function uniqueCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  const next: Citation[] = [];
  for (const citation of citations) {
    const key = `${citation.gameId}:${citation.ply}`;
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(citation);
  }
  return next;
}

export const publicWriteupSchema = z.object({
  status: writeupStatusSchema,
  document: writeupSchema.nullable(),
  error: z.string().nullable(),
  generatedAt: z.string().datetime().nullable(),
  model: z.string().nullable(),
});
export type PublicWriteup = z.infer<typeof publicWriteupSchema>;

export const idleWriteup = (): PublicWriteup => ({
  status: 'idle',
  document: null,
  error: null,
  generatedAt: null,
  model: null,
});

export const publicCoachProfileSchema = z.object({
  pass: enginePassSchema,
  profile: bareProfileSchema.nullable(),
  writeup: publicWriteupSchema,
});
export type PublicCoachProfile = z.infer<typeof publicCoachProfileSchema>;
