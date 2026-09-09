# `@peakelo/server`

Fastify API. Layout follows the script-ai server: thin `routes/`, domain work in `modules/`,
Zod env, Pino, typed `{ error: { code, message } }` envelopes.

```bash
pnpm --filter @peakelo/server dev
```

Health: `GET /health`, `GET /health/ready`.
