import type { FastifyInstance } from 'fastify';
import {
  LESSON_RATE_MAX,
  LESSON_RATE_WINDOW,
  gameBriefRequestSchema,
  lessonAskRequestSchema,
  lessonAskResponseSchema,
  lessonRequestSchema,
} from '@peakelo/shared';
import { ForbiddenError } from '../../common/errors';
import { requireUser } from '../auth/session';
import { createGameBrief } from './brief';
import { askLesson, createLesson, type LessonDeps } from './service';

export async function lessonRoutes(app: FastifyInstance, opts: LessonDeps = {}) {
  const rateLimit = { max: LESSON_RATE_MAX, timeWindow: LESSON_RATE_WINDOW };

  app.post<{ Params: { id: string } }>(
    '/games/:id/lesson',
    { config: { rateLimit } },
    async (request) => {
      const user = await requireCompletedOnboarding(request);
      const body = lessonRequestSchema.parse(request.body);
      return createLesson(user.id, request.params.id, body, opts);
    },
  );

  app.post<{ Params: { id: string } }>(
    '/games/:id/lesson/brief',
    { config: { rateLimit } },
    async (request) => {
      const user = await requireCompletedOnboarding(request);
      const body = gameBriefRequestSchema.parse(request.body ?? {});
      return createGameBrief(user.id, request.params.id, {
        refresh: body.refresh,
        isConfigured: opts.isConfigured,
        generateBrief: opts.generateBrief,
      });
    },
  );

  app.post<{ Params: { id: string } }>(
    '/games/:id/lesson/ask',
    { config: { rateLimit } },
    async (request) => {
      const user = await requireCompletedOnboarding(request);
      const body = lessonAskRequestSchema.parse(request.body);
      const answer = await askLesson(user.id, request.params.id, body, opts);
      return lessonAskResponseSchema.parse({ answer });
    },
  );
}

async function requireCompletedOnboarding(request: Parameters<typeof requireUser>[0]) {
  const user = await requireUser(request);
  if (!user.onboarding.completed) {
    throw new ForbiddenError('Finish onboarding before viewing games');
  }
  return user;
}
