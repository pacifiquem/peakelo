import { Agent } from '@mastra/core/agent';
import {
  gameBriefDraftSchema,
  LESSON_MODEL,
  lessonSchema,
  type GameBriefDraft,
  type Lesson,
} from '@peakelo/shared';
import { env } from '../../config/env';
import { ServiceUnavailableError } from '../../common/errors';
import { logger } from '../../lib/logger';
import { getDefaultAdapter, type EngineAdapter } from '../engine';
import { LESSON_INSTRUCTIONS } from './prompt';
import { loadSlowRunIndex, resolveSlowRunIndexPath } from './search-index';
import { loadTeachingIndex, resolveTeachingPath } from './teaching';
import { createLessonTools } from './tools';

export const LESSON_OFFLINE_MESSAGE = 'The lesson coach is offline right now.';
export const LESSON_FAILED_MESSAGE = 'The lesson coach could not finish this position.';

export type LessonGenerateInput = {
  userMessage: string;
  history?: Array<{ role: 'player' | 'coach'; text: string }>;
  question?: string;
};

export type GenerateLesson = (input: LessonGenerateInput) => Promise<unknown>;
export type GenerateBrief = (input: { userMessage: string }) => Promise<unknown>;

export function isLessonConfigured(apiKey = env.ANTHROPIC_API_KEY): boolean {
  return Boolean(apiKey);
}

export function resolveLessonModelId(raw: string): `${string}/${string}` {
  return raw.includes('/') ? (raw as `${string}/${string}`) : `anthropic/${raw}`;
}

export function createLessonAgent(opts: {
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
    id: 'lesson-coach',
    name: 'Lesson coach',
    instructions: LESSON_INSTRUCTIONS,
    model: {
      id: resolveLessonModelId(opts.model ?? env.LESSON_MODEL ?? LESSON_MODEL),
      apiKey: opts.apiKey,
    },
    tools,
  });
}

let cachedAgent: Agent | undefined;
let cachedKey: string | undefined;

function getLessonAgent(): Agent {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ServiceUnavailableError(LESSON_OFFLINE_MESSAGE);
  if (!cachedAgent || cachedKey !== apiKey) {
    cachedAgent = createLessonAgent({ apiKey });
    cachedKey = apiKey;
  }
  return cachedAgent;
}

export function toLessonMessages(input: LessonGenerateInput) {
  const messages: Array<{ role: 'user'; content: string } | { role: 'assistant'; content: string }> = [
    { role: 'user', content: input.userMessage },
  ];
  for (const turn of input.history ?? []) {
    messages.push(
      turn.role === 'coach'
        ? { role: 'assistant', content: turn.text }
        : { role: 'user', content: turn.text },
    );
  }
  if (input.question) {
    messages.push({ role: 'user', content: input.question });
  }
  return messages;
}

export const generateLessonWithAgent: GenerateLesson = async (input) => {
  const agent = getLessonAgent();
  try {
    const result = await agent.generate(toLessonMessages(input), {
      structuredOutput: {
        schema: lessonSchema,
        jsonPromptInjection: 'auto',
      },
      maxSteps: 6,
    });
    if (result.error) {
      logger.error({ err: result.error }, 'lesson agent failed');
      throw new ServiceUnavailableError(LESSON_FAILED_MESSAGE);
    }
    return result.object;
  } catch (error) {
    if (error instanceof ServiceUnavailableError) throw error;
    logger.error({ err: error }, 'lesson agent threw');
    throw new ServiceUnavailableError(LESSON_FAILED_MESSAGE);
  }
};

export const generateBriefWithAgent: GenerateBrief = async (input) => {
  const agent = getLessonAgent();
  try {
    const result = await agent.generate(input.userMessage, {
      structuredOutput: {
        schema: gameBriefDraftSchema,
        jsonPromptInjection: 'auto',
      },
      maxSteps: 4,
    });
    if (result.error) {
      logger.error({ err: result.error }, 'lesson brief agent failed');
      throw new ServiceUnavailableError(LESSON_FAILED_MESSAGE);
    }
    return result.object;
  } catch (error) {
    if (error instanceof ServiceUnavailableError) throw error;
    logger.error({ err: error }, 'lesson brief agent threw');
    throw new ServiceUnavailableError(LESSON_FAILED_MESSAGE);
  }
};

export function parseGeneratedBrief(value: unknown): GameBriefDraft {
  const parsed = gameBriefDraftSchema.safeParse(value);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.flatten() }, 'lesson brief failed validation');
    throw new ServiceUnavailableError(LESSON_FAILED_MESSAGE);
  }
  return parsed.data;
}

export function parseGeneratedLesson(value: unknown): Lesson {
  const parsed = lessonSchema.safeParse(value);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.flatten() }, 'lesson payload failed validation');
    throw new ServiceUnavailableError(LESSON_FAILED_MESSAGE);
  }
  return parsed.data;
}
