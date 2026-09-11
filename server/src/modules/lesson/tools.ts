import { applyUciLine } from '@peakelo/engine';
import { DEFAULT_ENGINE_DEPTH, evalScoreSchema, slowRunHitSchema } from '@peakelo/shared';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { EngineAdapter } from '../engine';
import { searchSlowRunIndex, type SlowRunIndexEntry } from './search-index';
import { searchTeachingBeats, teachingBeatSchema, type TeachingBeat } from './teaching';

export const MIN_LESSON_ENGINE_DEPTH = 8;
export const MAX_LESSON_ENGINE_DEPTH = 16;

const engineLineSchema = z.object({
  uci: z.string(),
  score: evalScoreSchema,
  pvUci: z.array(z.string()),
});

export const engineLinesResultSchema = z.object({
  fen: z.string(),
  depth: z.number().int(),
  lines: z.array(engineLineSchema),
  error: z.string().optional(),
});
export type EngineLinesResult = z.infer<typeof engineLinesResultSchema>;

export function capLessonDepth(depth?: number): number {
  const raw = depth ?? DEFAULT_ENGINE_DEPTH;
  return Math.min(MAX_LESSON_ENGINE_DEPTH, Math.max(MIN_LESSON_ENGINE_DEPTH, Math.trunc(raw)));
}

export function isValidFen(fen: string): boolean {
  return applyUciLine(fen, []).legal;
}

export async function requestEngineLines(
  input: { fen: string; depth?: number },
  adapter: EngineAdapter,
): Promise<EngineLinesResult> {
  const fen = input.fen.trim();
  const depth = capLessonDepth(input.depth);
  if (!isValidFen(fen)) {
    return { fen, depth, lines: [], error: 'invalid fen' };
  }
  const evaluated = await adapter.evaluate(fen, { depth });
  return {
    fen,
    depth,
    lines: evaluated.lines.map((line) => ({
      uci: line.uci,
      score: line.score,
      pvUci: line.pvUci,
    })),
  };
}

export function searchSlowRuns(
  input: { fen: string; query?: string; limit?: number },
  entries: SlowRunIndexEntry[],
) {
  if (!isValidFen(input.fen)) return { hits: [] as z.infer<typeof slowRunHitSchema>[] };
  return {
    hits: searchSlowRunIndex(entries, input.fen, { query: input.query, limit: input.limit }),
  };
}

export function searchSlowRunTeaching(
  input: { query: string; limit?: number },
  beats: TeachingBeat[],
) {
  return { beats: searchTeachingBeats(beats, input.query, { limit: input.limit }) };
}

export function createLessonTools(opts: {
  adapter: EngineAdapter;
  loadIndex: () => SlowRunIndexEntry[];
  loadTeaching?: () => TeachingBeat[];
}) {
  const requestEngineLinesTool = createTool({
    id: 'requestEngineLines',
    description:
      'Ask Stockfish for MultiPV lines from a FEN when the stored ply JSON is not enough (sideline, second or third line).',
    inputSchema: z.object({
      fen: z.string().min(1),
      depth: z.number().int().min(MIN_LESSON_ENGINE_DEPTH).max(MAX_LESSON_ENGINE_DEPTH).optional(),
    }),
    outputSchema: engineLinesResultSchema,
    execute: async (input) => requestEngineLines(input, opts.adapter),
  });

  const searchSlowRunsTool = createTool({
    id: 'searchSlowRuns',
    description:
      'Search the local slow-run index for a GothamChess, Hikaru, or Naroditsky quote near this position. Empty index returns no hits.',
    inputSchema: z.object({
      fen: z.string().min(1),
      query: z.string().min(1).max(200).optional(),
      limit: z.number().int().min(1).max(8).optional(),
    }),
    outputSchema: z.object({ hits: z.array(slowRunHitSchema) }),
    execute: async (input) => searchSlowRuns(input, opts.loadIndex()),
  });

  const searchSlowRunTeachingTool = createTool({
    id: 'searchSlowRunTeaching',
    description:
      'Search GothamChess, Hikaru, and Naroditsky slow-run transcripts for how they explain an idea (hanging piece, plan, king safety). Voice only — never treat a hit as this student\'s board, and never put these in sources[].',
    inputSchema: z.object({
      query: z.string().min(3).max(200),
      limit: z.number().int().min(1).max(8).optional(),
    }),
    outputSchema: z.object({ beats: z.array(teachingBeatSchema) }),
    execute: async (input) => searchSlowRunTeaching(input, opts.loadTeaching?.() ?? []),
  });

  return {
    requestEngineLines: requestEngineLinesTool,
    searchSlowRuns: searchSlowRunsTool,
    searchSlowRunTeaching: searchSlowRunTeachingTool,
  };
}
