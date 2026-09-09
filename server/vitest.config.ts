import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

config();

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.SESSION_SECRET = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.API_PUBLIC_URL = 'http://localhost:4000';
process.env.LICHESS_CLIENT_ID = 'peakelo-test';

export default defineConfig({
  test: {
    include: ['test/**/*.{test,spec}.ts'],
    exclude: ['node_modules/**', 'dist/**', 'src/**'],
    environment: 'node',
  },
});
