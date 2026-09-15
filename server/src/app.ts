import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';
import { pinoOptions } from './lib/logger';
import { registerErrorHandler } from './common/error-handler';
import { authRoutes } from './modules/auth/routes';
import { gameRoutes } from './modules/games/routes';
import { lessonRoutes } from './modules/lesson/routes';
import { onboardingRoutes } from './modules/onboarding/routes';
import { profileRoutes } from './modules/profile/routes';
import { previewRoutes } from './modules/preview/routes';
import { trainingRoutes } from './modules/training/routes';
import { healthRoutes } from './routes/health';

export function buildApp() {
  const app = Fastify({ logger: pinoOptions });

  app.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
  app.register(cors, {
    origin: env.corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Accept'],
  });
  app.register(cookie);
  app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  registerErrorHandler(app);
  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(onboardingRoutes);
  app.register(gameRoutes);
  app.register(lessonRoutes);
  app.register(profileRoutes);
  app.register(trainingRoutes);
  app.register(previewRoutes);
  return app;
}
