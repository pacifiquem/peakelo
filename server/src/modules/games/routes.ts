import type { FastifyInstance } from 'fastify';
import { gamesQuerySchema } from '@peakelo/shared';
import { ForbiddenError } from '../../common/errors';
import { requireUser } from '../auth/session';
import { listGames } from './service';

export async function gameRoutes(app: FastifyInstance) {
  app.get('/games', async (request) => {
    const user = await requireUser(request);
    if (!user.onboarding.completed) {
      throw new ForbiddenError('Finish onboarding before viewing games');
    }
    const query = gamesQuerySchema.parse(request.query);
    return listGames(user.id, query);
  });
}
