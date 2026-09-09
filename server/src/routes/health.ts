import type { FastifyInstance } from 'fastify';
import { env } from '../config/env';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

  app.get('/health/ready', async () => ({
    status: 'ok',
    checks: {
      database: env.DATABASE_URL ? 'not_wired' : 'skipped',
    },
  }));
}
