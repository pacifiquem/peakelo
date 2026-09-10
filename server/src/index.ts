import { buildApp } from './app';
import { env } from './config/env';
import { disconnectPrisma } from './db/prisma';
import { logger } from './lib/logger';
import { startCron, stopCron } from './modules/cron';
import { recoverInterruptedImports } from './modules/games/import-games';

const app = buildApp();

async function start() {
  if (!env.DATABASE_URL) {
    logger.error('DATABASE_URL is required to start the API. See ENV.md.');
    process.exit(1);
  }
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    const recovered = await recoverInterruptedImports();
    if (recovered > 0) {
      logger.warn({ recovered }, 'marked interrupted imports as failed');
    }
    startCron();
    logger.info(`server listening on http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    logger.error({ err: error }, 'failed to start server');
    process.exit(1);
  }
}

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`received ${signal}, shutting down gracefully`);
  stopCron();
  try {
    await app.close();
    await disconnectPrisma();
  } catch (error) {
    logger.error({ err: error }, 'error during graceful shutdown');
    process.exit(1);
  }
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
void start();
