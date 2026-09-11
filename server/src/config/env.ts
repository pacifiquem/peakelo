import { DEFAULT_ENGINE_DEPTH, DEFAULT_ENGINE_THREADS, LESSON_MODEL } from '@peakelo/shared';
import { z } from 'zod';
import { parseCorsOrigins } from '../lib/cors-origins';

const optionalText = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : value),
  z.string().url().optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://127.0.0.1:3000'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  SESSION_SECRET: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.string().min(32).optional(),
  ),
  DATABASE_URL: optionalText,
  DIRECT_URL: optionalText,
  GOOGLE_CLIENT_ID: optionalText,
  GOOGLE_CLIENT_SECRET: optionalText,
  LICHESS_CLIENT_ID: z.string().min(1).default('peakelo-local-dev'),
  CHESSCOM_CLIENT_ID: optionalText,
  CHESSCOM_CLIENT_SECRET: optionalText,
  CHESSCOM_AUTHORIZATION_URL: optionalUrl,
  CHESSCOM_TOKEN_URL: optionalUrl,
  CHESSCOM_USERINFO_URL: optionalUrl,
  CHESSCOM_SCOPE: optionalText,
  CHESSCOM_USER_AGENT: z.string().min(1).default('Peakelo/0.0.0'),
  STOCKFISH_PATH: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.string().min(1).default('stockfish'),
  ),
  ENGINE_DEPTH: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.coerce.number().int().positive().default(DEFAULT_ENGINE_DEPTH),
  ),
  ENGINE_THREADS: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.coerce.number().int().positive().default(DEFAULT_ENGINE_THREADS),
  ),
  ANTHROPIC_API_KEY: optionalText,
  SLOW_RUN_INDEX_PATH: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.string().min(1).default('data/slow-runs/index/positions.json'),
  ),
  LESSON_MODEL: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.string().min(1).default(LESSON_MODEL),
  ),
});

export type Env = z.infer<typeof envSchema> & {
  corsOrigins: string[];
  primaryCorsOrigin: string;
  sessionSecret: string;
  googleConfigured: boolean;
  chesscomOAuthConfigured: boolean;
};

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment configuration:\n${message}\n\nSee ENV.md and server/.env.example.`,
    );
  }
  const data = parsed.data;
  if (data.NODE_ENV !== 'test') {
    if (!data.SESSION_SECRET) {
      throw new Error('SESSION_SECRET is required (min 32 characters). See ENV.md.');
    }
    if (!data.DATABASE_URL) {
      throw new Error('DATABASE_URL is required. See ENV.md.');
    }
    if (!data.GOOGLE_CLIENT_ID || !data.GOOGLE_CLIENT_SECRET) {
      throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required. See ENV.md.');
    }
  }
  const corsOrigins = parseCorsOrigins(data.CORS_ORIGIN);
  const googleConfigured = Boolean(data.GOOGLE_CLIENT_ID && data.GOOGLE_CLIENT_SECRET);
  const chesscomOAuthConfigured = Boolean(
    data.CHESSCOM_CLIENT_ID &&
    data.CHESSCOM_CLIENT_SECRET &&
    data.CHESSCOM_AUTHORIZATION_URL &&
    data.CHESSCOM_TOKEN_URL &&
    data.CHESSCOM_USERINFO_URL,
  );
  return {
    ...data,
    corsOrigins,
    primaryCorsOrigin: corsOrigins[0]!,
    sessionSecret: data.SESSION_SECRET ?? 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    googleConfigured,
    chesscomOAuthConfigured,
  };
}

export const env = loadEnv();
