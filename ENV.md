# ENV

Every process environment variable for this repo. Adding a variable without updating this file
and the matching `.env.example` is unfinished work.

## Root

None. Do not put secrets in the repo root.

## `server/` — `@peakelo/server`

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | `development` \| `test` \| `production` |
| `PORT` | no | `4000` | HTTP listen port |
| `HOST` | no | `0.0.0.0` | HTTP bind address |
| `LOG_LEVEL` | no | `info` | Pino level |
| `CORS_ORIGIN` | no | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated browser origins |
| `DATABASE_URL` | no (until Prisma is wired) | — | Pooled Postgres URL |
| `DIRECT_URL` | no | — | Unpooled URL for Prisma migrate |

Copy `server/.env.example` to `server/.env` for local runs.

## `client/` — `@peakelo/client`

None yet. When the API is called from the browser, add `NEXT_PUBLIC_API_URL` here first.
