import type { FastifyInstance } from 'fastify';
import { ForbiddenError } from '../../common/errors';
import { requireUser } from '../auth/session';
import { getPublicProfile } from './service';

export async function profileRoutes(app: FastifyInstance) {
  app.get('/profile', async (request) => {
    const user = await requireUser(request);
    if (!user.onboarding.completed) {
      throw new ForbiddenError('Finish onboarding before viewing your profile');
    }
    return getPublicProfile(user.id);
  });
}
