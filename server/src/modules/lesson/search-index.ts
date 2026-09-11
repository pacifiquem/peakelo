import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { normalizeEpd } from '@peakelo/engine';
import {
  lessonSpeakerSchema,
  type LessonSpeaker,
  type SlowRunHit,
} from '@peakelo/shared';
import { z } from 'zod';

const QUOTE_MAX = 600;
const DEFAULT_LIMIT = 4;
const MAX_LIMIT = 8;

const indexEntrySchema = z.object({
  speaker: lessonSpeakerSchema,
  videoId: z.string().min(1),
  title: z.string().min(1).max(300),
  tSec: z.number().nonnegative(),
  quote: z.string().min(1),
  epd: z.string().min(1).max(120).optional(),
  fen: z.string().min(1).optional(),
});

const indexFileSchema = z.union([
  z.array(indexEntrySchema),
  z.object({ positions: z.array(indexEntrySchema) }),
  z.object({ comments: z.array(indexEntrySchema) }),
]);

export type SlowRunIndexEntry = z.infer<typeof indexEntrySchema>;

export function resolveSlowRunIndexPath(configured: string, cwd = process.cwd()): string {
  if (path.isAbsolute(configured)) return configured;
  const fromCwd = path.resolve(cwd, configured);
  if (existsSync(fromCwd)) return fromCwd;
  const fromParent = path.resolve(cwd, '..', configured);
  if (existsSync(fromParent)) return fromParent;
  return fromCwd;
}

export function loadSlowRunIndex(filePath: string): SlowRunIndexEntry[] {
  if (!existsSync(filePath)) return [];
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }
  if (raw.trim().length === 0) return [];
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return [];
  }
  const parsed = indexFileSchema.safeParse(json);
  if (!parsed.success) return [];
  if (Array.isArray(parsed.data)) return parsed.data;
  if ('positions' in parsed.data) return parsed.data.positions;
  return parsed.data.comments;
}

export function searchSlowRunIndex(
  entries: SlowRunIndexEntry[],
  fen: string,
  opts: { query?: string; limit?: number } = {},
): SlowRunHit[] {
  const limit = Math.min(MAX_LIMIT, Math.max(1, opts.limit ?? DEFAULT_LIMIT));
  const targetEpd = normalizeEpd(fen);
  const query = opts.query?.trim().toLowerCase();

  const exact: SlowRunHit[] = [];
  for (const entry of entries) {
    const entryEpd = entry.epd ?? (entry.fen ? normalizeEpd(entry.fen) : '');
    if (!entryEpd || entryEpd !== targetEpd) continue;
    const hit = toHit(entry, entryEpd);
    if (query && !matchesQuery(hit, query)) continue;
    exact.push(hit);
  }

  const seen = new Set<string>();
  const unique: SlowRunHit[] = [];
  for (const hit of exact) {
    const key = `${hit.speaker}:${hit.videoId}:${hit.tSec}:${hit.epd ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(hit);
    if (unique.length >= limit) break;
  }
  return unique;
}

function toHit(entry: SlowRunIndexEntry, epd: string): SlowRunHit {
  const quote = entry.quote.length > QUOTE_MAX ? entry.quote.slice(0, QUOTE_MAX) : entry.quote;
  return {
    speaker: entry.speaker as LessonSpeaker,
    videoId: entry.videoId,
    title: entry.title,
    tSec: entry.tSec,
    quote,
    epd,
  };
}

function matchesQuery(hit: SlowRunHit, query: string): boolean {
  return hit.quote.toLowerCase().includes(query) || hit.title.toLowerCase().includes(query);
}
