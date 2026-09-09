import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';

const app = buildApp();

async function start() {
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
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
  try {
    await app.close();
  } catch (error) {
    logger.error({ err: error }, 'error during graceful shutdown');
    process.exit(1);
  }
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
void start();
