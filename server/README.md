# `@peakelo/server`

Fastify API. Layout follows the script-ai server: thin `routes/`, domain work in `modules/`,
Zod env, Pino, typed `{ error: { code, message } }` envelopes.

```bash
pnpm --filter @peakelo/server dev
```

Health: `GET /health`, `GET /health/ready`.

Auth: `GET /auth/providers`, `GET /auth/:provider`, `GET /me`, `POST /auth/logout`.
Onboarding and games sit under `/onboarding` and `/games`.

Local Postgres: `docker compose up -d postgres` then `pnpm --filter @peakelo/server prisma:migrate`.
OAuth credentials: `docs/setup/oauth.md`.
