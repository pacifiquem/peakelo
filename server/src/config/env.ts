import { z } from 'zod';
import { parseCorsOrigins } from '../lib/cors-origins';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000,http://127.0.0.1:3000'),
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema> & {
  corsOrigins: string[];
  primaryCorsOrigin: string;
};

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${message}\n\nSee ENV.md and server/.env.example.`);
  }
  const corsOrigins = parseCorsOrigins(parsed.data.CORS_ORIGIN);
  return {
    ...parsed.data,
    corsOrigins,
    primaryCorsOrigin: corsOrigins[0]!,
  };
}

export const env = loadEnv();
