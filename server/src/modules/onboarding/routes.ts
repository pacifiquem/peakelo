import type { FastifyInstance } from 'fastify';
import {
  linkChesscomBodySchema,
  onboardingImportBodySchema,
  onboardingIntentBodySchema,
  onboardingNoteBodySchema,
} from '@peakelo/shared';
import { requireUser } from '../auth/session';
import {
  getOnboarding,
  linkChesscomUsername,
  saveIntent,
  saveNote,
  startOnboardingImport,
} from './service';

export async function onboardingRoutes(app: FastifyInstance) {
  app.get('/onboarding', async (request) => {
    const user = await requireUser(request);
    return { onboarding: await getOnboarding(user.id) };
  });

  app.post('/onboarding/intent', async (request) => {
    const user = await requireUser(request);
    const body = onboardingIntentBodySchema.parse(request.body);
    return { onboarding: await saveIntent(user.id, body.trainingFocus) };
  });

  app.post('/onboarding/note', async (request) => {
    const user = await requireUser(request);
    const body = onboardingNoteBodySchema.parse(request.body);
    return { onboarding: await saveNote(user.id, body.focusNote) };
  });

  app.post('/onboarding/chesscom', async (request) => {
    const user = await requireUser(request);
    const body = linkChesscomBodySchema.parse(request.body);
    return { onboarding: await linkChesscomUsername(user.id, body.username) };
  });

  app.post('/onboarding/import', async (request) => {
    const user = await requireUser(request);
    const body = onboardingImportBodySchema.parse(request.body);
    return { onboarding: await startOnboardingImport(user.id, body.timeControls, body.sources) };
  });
}
