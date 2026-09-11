import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { LessonSpeaker } from '@peakelo/shared';
import { lessonSpeakerSchema } from '@peakelo/shared';
import { resolveSlowRunIndexPath } from './search-index';

const QUOTE_MIN = 48;
const QUOTE_MAX = 360;
const MAX_PER_VIDEO = 6;
const DEFAULT_LIMIT = 4;

const TAG_RULES: Array<{ tag: string; re: RegExp }> = [
  { tag: 'hanging', re: /\b(hanging|hangs|hanged|undefended|en prise|for free|free piece)\b/i },
  { tag: 'idea', re: /\b(the idea|what(?:'s| is) the idea|the plan|point of this)\b/i },
  { tag: 'miss', re: /\b(you missed|i missed|didn't see|did not see|looked at|overlook)\b/i },
  { tag: 'develop', re: /\b(develop|get (?:the|your) pieces? out|finish develop)/i },
  { tag: 'king', re: /\b(king safety|castle|castling|back rank|unsafe king)\b/i },
  { tag: 'calculate', re: /\b(calculat|prove yourself wrong|look one more|check again)\b/i },
  { tag: 'center', re: /\b(control the center|occupy the center|centralize)\b/i },
];

const PROMO = /\b(subscribe|smash like|membership|chessly|promo code|use code|patreon)\b/i;

export const teachingBeatSchema = z.object({
  speaker: lessonSpeakerSchema,
  videoId: z.string().min(1),
  title: z.string().min(1).max(300),
  tSec: z.number().nonnegative(),
  quote: z.string().min(1).max(600),
  tags: z.array(z.string()).max(8),
});
export type TeachingBeat = z.infer<typeof teachingBeatSchema>;

const teachingFileSchema = z.object({
  generatedAt: z.string().optional(),
  beats: z.array(teachingBeatSchema),
});

export type TranscriptCue = { text: string; start: number; duration: number };

export function resolveTeachingPath(indexPath: string): string {
  const resolved = resolveSlowRunIndexPath(indexPath);
  return path.join(path.dirname(resolved), 'teaching.json');
}

export function loadTeachingIndex(filePath: string): TeachingBeat[] {
  if (!existsSync(filePath)) return [];
  try {
    const raw = readFileSync(filePath, 'utf8').trim();
    if (!raw) return [];
    const parsed = teachingFileSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.beats : [];
  } catch {
    return [];
  }
}

export function tagsInText(text: string): string[] {
  const tags: string[] = [];
  for (const rule of TAG_RULES) {
    if (rule.re.test(text)) tags.push(rule.tag);
  }
  return tags;
}

export function extractTeachingBeats(
  cues: TranscriptCue[],
  meta: { speaker: LessonSpeaker; videoId: string; title: string },
): TeachingBeat[] {
  const beats: TeachingBeat[] = [];
  const used = new Set<number>();
  for (const cue of cues) {
    const tags = tagsInText(cue.text);
    if (tags.length === 0) continue;
    const bucket = Math.floor(cue.start / 20);
    if (used.has(bucket)) continue;
    const quote = windowQuote(cues, cue.start);
    if (!quote || PROMO.test(quote)) continue;
    used.add(bucket);
    beats.push({
      speaker: meta.speaker,
      videoId: meta.videoId,
      title: meta.title,
      tSec: Math.round(cue.start),
      quote,
      tags,
    });
    if (beats.length >= MAX_PER_VIDEO) break;
  }
  return beats;
}

export function searchTeachingBeats(
  beats: TeachingBeat[],
  query: string,
  opts: { limit?: number } = {},
): TeachingBeat[] {
  const limit = Math.min(8, Math.max(1, opts.limit ?? DEFAULT_LIMIT));
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);
  if (tokens.length === 0) return [];

  const scored = beats
    .map((beat) => ({ beat, score: scoreBeat(beat, tokens) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const unique: TeachingBeat[] = [];
  const seen = new Set<string>();
  for (const row of scored) {
    const key = `${row.beat.speaker}:${row.beat.videoId}:${row.beat.tSec}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row.beat);
    if (unique.length >= limit) break;
  }
  return unique;
}

export function pickVoiceExamples(beats: TeachingBeat[], tags: string[], limit = 3): TeachingBeat[] {
  if (beats.length === 0) return [];
  const wanted = new Set(tags);
  const ranked = [...beats].sort((a, b) => overlap(b.tags, wanted) - overlap(a.tags, wanted));
  const picked: TeachingBeat[] = [];
  const speakers = new Set<string>();
  for (const beat of ranked) {
    if (speakers.has(beat.speaker) && picked.length < limit) {
      if (picked.length >= 1) continue;
    }
    speakers.add(beat.speaker);
    picked.push(beat);
    if (picked.length >= limit) break;
  }
  if (picked.length < limit) {
    for (const beat of ranked) {
      if (picked.includes(beat)) continue;
      picked.push(beat);
      if (picked.length >= limit) break;
    }
  }
  return picked.slice(0, limit);
}

export function formatVoiceExamples(beats: TeachingBeat[]): string {
  if (beats.length === 0) return '';
  const lines = [
    'Voice examples from slow-run commentary. Steal the cadence (SAN, one idea, one habit). These are NOT this student\'s board. Never cite them in sources[].',
  ];
  for (const beat of beats) {
    lines.push(`- ${beat.speaker}: "${beat.quote}"`);
  }
  return lines.join('\n');
}

function scoreBeat(beat: TeachingBeat, tokens: string[]): number {
  const hay = `${beat.quote} ${beat.title} ${beat.tags.join(' ')}`.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (hay.includes(token)) score += 2;
    if (beat.tags.includes(token)) score += 3;
  }
  return score;
}

function overlap(tags: string[], wanted: Set<string>): number {
  return tags.reduce((sum, tag) => sum + (wanted.has(tag) ? 1 : 0), 0);
}

function collapseRepeats(text: string): string {
  let result = text;
  for (let i = 0; i < 4; i += 1) {
    const next = result.replace(/(.{12,80}?)\s+\1/gi, '$1');
    if (next === result) break;
    result = next;
  }
  return result.replace(/\s+/g, ' ').trim();
}

function windowQuote(cues: TranscriptCue[], center: number): string | null {
  const slice = cues
    .filter((cue) => cue.start >= center - 2 && cue.start <= center + 16)
    .map((cue) => cue.text.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const raw = collapseRepeats(slice.join(' ').replace(/\s+/g, ' ').trim());
  if (raw.length < QUOTE_MIN) return null;
  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 16);
  const picked = (sentences.length > 0 ? sentences.slice(0, 3) : [raw]).join(' ');
  if (picked.length < QUOTE_MIN) return null;
  if (picked.length <= QUOTE_MAX) return picked;
  return `${picked.slice(0, QUOTE_MAX - 1).trimEnd()}…`;
}
