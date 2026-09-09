import type { FastifyInstance } from 'fastify';
import { pingDatabase } from '../db/prisma';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

  app.get('/health/ready', async (_request, reply) => {
    const database = await pingDatabase();
    const status = database === 'error' ? 'degraded' : 'ok';
    if (database === 'error') {
      return reply.status(503).send({
        status,
        checks: { database },
      });
    }
    return { status, checks: { database } };
  });
}
