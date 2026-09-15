import { Agent } from '@mastra/core/agent';
import {
  LESSON_MODEL,
  hydrateWriteup,
  writeupDraftSchema,
  writeupSchema,
  type BareProfile,
  type Writeup,
} from '@peakelo/shared';
import { ServiceUnavailableError } from '../../common/errors';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { LESSON_OFFLINE_MESSAGE, resolveLessonModelId } from '../lesson/agent';
import { WRITEUP_INSTRUCTIONS } from './prompt';

export const WRITEUP_FAILED_MESSAGE = 'The coach could not finish this writeup.';

export type GenerateWriteup = (input: { userMessage: string }) => Promise<unknown>;

export function isWriteupConfigured(apiKey = env.ANTHROPIC_API_KEY): boolean {
  return Boolean(apiKey);
}

export function createWriteupAgent(opts: { apiKey: string; model?: string }) {
  return new Agent({
    id: 'profile-writeup',
    name: 'Profile writeup',
    instructions: WRITEUP_INSTRUCTIONS,
    model: {
      id: resolveLessonModelId(opts.model ?? env.LESSON_MODEL ?? LESSON_MODEL),
      apiKey: opts.apiKey,
    },
  });
}

let cachedAgent: Agent | undefined;
let cachedKey: string | undefined;

function getWriteupAgent(): Agent {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ServiceUnavailableError(LESSON_OFFLINE_MESSAGE);
  if (!cachedAgent || cachedKey !== apiKey) {
    cachedAgent = createWriteupAgent({ apiKey });
    cachedKey = apiKey;
  }
  return cachedAgent;
}

export const generateWriteupWithAgent: GenerateWriteup = async (input) => {
  const agent = getWriteupAgent();
  try {
    const first = await generateWriteupAttempt(agent, input.userMessage, 'auto');
    if (!first.error && first.object != null) return first.object;
    logger.error({ err: first.error, preview: previewGenerate(first) }, 'writeup agent failed');
    const second = await generateWriteupAttempt(agent, input.userMessage, true);
    if (!second.error && second.object != null) return second.object;
    logger.error({ err: second.error, preview: previewGenerate(second) }, 'writeup agent retry failed');
    throw new ServiceUnavailableError(writeupFailureMessage(second.error ?? first.error));
  } catch (error) {
    if (error instanceof ServiceUnavailableError) throw error;
    logger.error({ err: error }, 'writeup agent threw');
    throw new ServiceUnavailableError(writeupFailureMessage(error));
  }
};

export function parseGeneratedWriteup(value: unknown, snapshot?: BareProfile): Writeup {
  if (snapshot) {
    const draft = writeupDraftSchema.safeParse(value);
    if (draft.success) {
      try {
        const hydrated = writeupSchema.safeParse(hydrateWriteup(draft.data, snapshot));
        if (hydrated.success) return hydrated.data;
        logger.warn({ issues: hydrated.error.flatten() }, 'hydrated writeup failed validation');
      } catch (error) {
        logger.warn({ err: error }, 'writeup hydration failed');
      }
    } else {
      logger.warn({ issues: draft.error.flatten() }, 'writeup draft failed validation');
    }
  }
  const parsed = writeupSchema.safeParse(value);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.flatten() }, 'writeup payload failed validation');
    throw new ServiceUnavailableError(WRITEUP_FAILED_MESSAGE);
  }
  return parsed.data;
}

function generateWriteupAttempt(
  agent: Agent,
  userMessage: string,
  jsonPromptInjection: 'auto' | true,
) {
  return agent.generate(userMessage, {
    structuredOutput: {
      schema: writeupDraftSchema,
      jsonPromptInjection,
    },
    maxSteps: 4,
  });
}

function previewGenerate(result: { text?: string; object?: unknown }) {
  const text = typeof result.text === 'string' ? result.text.slice(0, 400) : undefined;
  const keys =
    result.object && typeof result.object === 'object' ? Object.keys(result.object as object) : undefined;
  return { text, keys };
}

function writeupFailureMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error ?? '');
  if (/credit|billing|quota|401|403|authentication|unauthorized/i.test(text)) {
    return LESSON_OFFLINE_MESSAGE;
  }
  return WRITEUP_FAILED_MESSAGE;
}
