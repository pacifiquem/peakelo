import { defineConfig } from 'vitest/config';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.CORS_ORIGIN = 'http://localhost:3000';

export default defineConfig({
  test: {
    include: ['test/**/*.{test,spec}.ts'],
    exclude: ['node_modules/**', 'dist/**', 'src/**'],
    environment: 'node',
  },
});
