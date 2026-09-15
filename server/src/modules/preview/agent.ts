import { Agent } from '@mastra/core/agent';
import {
  LESSON_MODEL,
  publicReviewWriteupSchema,
  type AnalyzedPly,
  type PublicReviewWriteup,
} from '@peakelo/shared';
import { ServiceUnavailableError } from '../../common/errors';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { getDefaultAdapter, type EngineAdapter } from '../engine';
import { resolveLessonModelId } from '../lesson/agent';
import { loadSlowRunIndex, resolveSlowRunIndexPath } from '../lesson/search-index';
import { loadTeachingIndex, resolveTeachingPath } from '../lesson/teaching';
import { createLessonTools } from '../lesson/tools';
import { PUBLIC_REVIEW_INSTRUCTIONS } from './prompt';

export const PREVIEW_OFFLINE_MESSAGE = 'The coach is offline right now.';
export const PREVIEW_FAILED_MESSAGE = 'The coach could not finish this game.';

export type GeneratePublicReview = (input: { userMessage: string }) => Promise<unknown>;

export function isPreviewConfigured(apiKey = env.ANTHROPIC_API_KEY): boolean {
  return Boolean(apiKey);
}

export function createPreviewAgent(opts: {
  apiKey: string;
  model?: string;
  adapter?: EngineAdapter;
  indexPath?: string;
}) {
  const indexPath = resolveSlowRunIndexPath(opts.indexPath ?? env.SLOW_RUN_INDEX_PATH);
  const teachingPath = resolveTeachingPath(opts.indexPath ?? env.SLOW_RUN_INDEX_PATH);
  const tools = createLessonTools({
    adapter: opts.adapter ?? getDefaultAdapter(),
    loadIndex: () => loadSlowRunIndex(indexPath),
    loadTeaching: () => loadTeachingIndex(teachingPath),
  });
  return new Agent({
    id: 'public-review',
    name: 'Public review',
    instructions: PUBLIC_REVIEW_INSTRUCTIONS,
    model: {
      id: resolveLessonModelId(opts.model ?? env.LESSON_MODEL ?? LESSON_MODEL),
      apiKey: opts.apiKey,
    },
    tools,
  });
}

let cachedAgent: Agent | undefined;
let cachedKey: string | undefined;

function getPreviewAgent(): Agent {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ServiceUnavailableError(PREVIEW_OFFLINE_MESSAGE);
  if (!cachedAgent || cachedKey !== apiKey) {
    cachedAgent = createPreviewAgent({ apiKey });
    cachedKey = apiKey;
  }
  return cachedAgent;
}

export const generatePublicReviewWithAgent: GeneratePublicReview = async (input) => {
  const agent = getPreviewAgent();
  try {
    const result = await agent.generate(input.userMessage, {
      structuredOutput: {
        schema: publicReviewWriteupSchema,
        jsonPromptInjection: 'auto',
      },
      maxSteps: 5,
    });
    if (result.error) {
      logger.error({ err: result.error }, 'public review agent failed');
      throw new ServiceUnavailableError(PREVIEW_FAILED_MESSAGE);
    }
    return result.object;
  } catch (error) {
    if (error instanceof ServiceUnavailableError) throw error;
    logger.error({ err: error }, 'public review agent threw');
    throw new ServiceUnavailableError(PREVIEW_FAILED_MESSAGE);
  }
};

export function parseGeneratedPublicReview(
  value: unknown,
  plies?: AnalyzedPly[],
): PublicReviewWriteup {
  const parsed = publicReviewWriteupSchema.safeParse(value);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.flatten() }, 'public review failed validation');
    throw new ServiceUnavailableError(PREVIEW_FAILED_MESSAGE);
  }
  if (plies) assertReviewCitesPass(parsed.data, plies);
  return parsed.data;
}

export function assertReviewCitesPass(review: PublicReviewWriteup, plies: AnalyzedPly[]): void {
  const byPly = new Map(plies.map((ply) => [ply.ply, ply]));
  const invented = review.keyPlies.some((item) => {
    const stored = byPly.get(item.ply);
    return !stored || stored.san !== item.san || stored.color !== item.color;
  });
  if (invented) {
    logger.warn({ keyPlies: review.keyPlies }, 'public review cited a ply the pass does not have');
    throw new ServiceUnavailableError(PREVIEW_FAILED_MESSAGE);
  }
}
