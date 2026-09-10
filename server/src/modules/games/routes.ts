import type { FastifyInstance } from 'fastify';
import { gamesQuerySchema } from '@peakelo/shared';
import { ForbiddenError, NotFoundError } from '../../common/errors';
import { requireUser } from '../auth/session';
import { getGame, listGames } from './service';

export async function gameRoutes(app: FastifyInstance) {
  app.get('/games', async (request) => {
    const user = await requireUser(request);
    if (!user.onboarding.completed) {
      throw new ForbiddenError('Finish onboarding before viewing games');
    }
    const query = gamesQuerySchema.parse(request.query);
    return listGames(user.id, query);
  });

  app.get<{ Params: { id: string } }>('/games/:id', async (request) => {
    const user = await requireUser(request);
    if (!user.onboarding.completed) {
      throw new ForbiddenError('Finish onboarding before viewing games');
    }
    const game = await getGame(user.id, request.params.id);
    if (!game) throw new NotFoundError('Game');
    return game;
  });
}
