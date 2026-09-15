import type { FastifyInstance } from 'fastify';
import {
  DRILL_RATE_MAX,
  DRILL_RATE_WINDOW,
  WRITEUP_RATE_MAX,
  WRITEUP_RATE_WINDOW,
  drillAskRequestSchema,
  drillMoveBodySchema,
  writeupRequestSchema,
} from '@peakelo/shared';
import { ForbiddenError } from '../../common/errors';
import { requireUser } from '../auth/session';
import {
  askDrill,
  getDrillPlay,
  getRoadmap,
  getTrainingDesk,
  listDrills,
  playDrillMove,
  queueWriteup,
  type TrainingDeps,
} from './service';

export async function trainingRoutes(app: FastifyInstance, opts: TrainingDeps = {}) {
  const writeupLimit = { max: WRITEUP_RATE_MAX, timeWindow: WRITEUP_RATE_WINDOW };
  const drillLimit = { max: DRILL_RATE_MAX, timeWindow: DRILL_RATE_WINDOW };

  app.get('/training', async (request) => {
    const user = await requireCompleted(request);
    return getTrainingDesk(user.id);
  });

  app.post('/training/writeup', { config: { rateLimit: writeupLimit } }, async (request) => {
    const user = await requireCompleted(request);
    const body = writeupRequestSchema.parse(request.body ?? {});
    return queueWriteup(user.id, body.refresh);
  });

  app.get('/roadmap', async (request) => {
    const user = await requireCompleted(request);
    return { roadmap: await getRoadmap(user.id) };
  });

  app.get('/drills', async (request) => {
    const user = await requireCompleted(request);
    return listDrills(user.id, request.query as Record<string, unknown>);
  });

  app.get<{ Params: { id: string } }>('/drills/:id', async (request) => {
    const user = await requireCompleted(request);
    return getDrillPlay(user.id, request.params.id);
  });

  app.post<{ Params: { id: string } }>(
    '/drills/:id/move',
    { config: { rateLimit: drillLimit } },
    async (request) => {
      const user = await requireCompleted(request);
      const body = drillMoveBodySchema.parse(request.body);
      return playDrillMove(user.id, request.params.id, body, opts);
    },
  );

  app.post<{ Params: { id: string } }>(
    '/drills/:id/ask',
    { config: { rateLimit: drillLimit } },
    async (request) => {
      const user = await requireCompleted(request);
      const body = drillAskRequestSchema.parse(request.body);
      return { answer: await askDrill(user.id, request.params.id, body, opts) };
    },
  );
}

async function requireCompleted(request: Parameters<typeof requireUser>[0]) {
  const user = await requireUser(request);
  if (!user.onboarding.completed) {
    throw new ForbiddenError('Finish onboarding before opening training');
  }
  return user;
}
