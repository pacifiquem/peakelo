# ENV

Every process environment variable for this repo. Adding a variable without updating this file
and the matching `.env.example` is unfinished work.

OAuth setup steps: [`docs/setup/oauth.md`](./docs/setup/oauth.md).

## Root

None. Do not put secrets in the repo root.

## `server/` — `@peakelo/server`

| Variable                     | Required                  | Default                                       | Purpose                                                 |
| ---------------------------- | ------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| `NODE_ENV`                   | no                        | `development`                                 | `development` \| `test` \| `production`                 |
| `PORT`                       | no                        | `4000`                                        | HTTP listen port                                        |
| `HOST`                       | no                        | `0.0.0.0`                                     | HTTP bind address                                       |
| `LOG_LEVEL`                  | no                        | `info`                                        | Pino level                                              |
| `CORS_ORIGIN`                | no                        | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated browser origins                         |
| `CLIENT_URL`                 | no                        | `http://localhost:3000`                       | Browser origin for post-OAuth redirects                 |
| `API_PUBLIC_URL`             | no                        | `http://localhost:4000`                       | Public API origin used as the OAuth redirect base       |
| `SESSION_SECRET`             | yes (except `test`)       | —                                             | ≥32 chars. Signs OAuth state; derives token-at-rest key |
| `DATABASE_URL`               | yes (except `test`)       | —                                             | Pooled Postgres URL                                     |
| `DIRECT_URL`                 | no                        | —                                             | Unpooled URL for Prisma migrate                         |
| `GOOGLE_CLIENT_ID`           | yes (except `test`)       | —                                             | Google OAuth web client id                              |
| `GOOGLE_CLIENT_SECRET`       | yes (except `test`)       | —                                             | Google OAuth web client secret                          |
| `LICHESS_CLIENT_ID`          | no                        | `peakelo-local-dev`                           | Lichess public client id (any unique string)            |
| `CHESSCOM_CLIENT_ID`         | to enable Chess.com login | —                                             | Issued after Chess.com OAuth approval                   |
| `CHESSCOM_CLIENT_SECRET`     | to enable Chess.com login | —                                             | Issued after Chess.com OAuth approval                   |
| `CHESSCOM_AUTHORIZATION_URL` | to enable Chess.com login | —                                             | Authorize endpoint Chess.com emails you                 |
| `CHESSCOM_TOKEN_URL`         | to enable Chess.com login | —                                             | Token endpoint Chess.com emails you                     |
| `CHESSCOM_USERINFO_URL`      | to enable Chess.com login | —                                             | Userinfo endpoint Chess.com emails you                  |
| `CHESSCOM_SCOPE`             | no                        | empty                                         | Space-separated scopes Chess.com specifies              |
| `CHESSCOM_USER_AGENT`        | yes for Chess.com import  | `Peakelo/0.0.0`                               | PubAPI requires a contact User-Agent                    |
| `STOCKFISH_PATH`             | no                        | `stockfish` on PATH, else npm `stockfish`     | UCI engine. A `.js` path (npm WASM) is launched with Node. |
| `ENGINE_DEPTH`               | no                        | `12`                                          | Default search depth for the engine pass                |
| `ENGINE_THREADS`             | no                        | `1`                                           | Stockfish `Threads`                                     |

Copy `server/.env.example` to `server/.env` for local runs.

## `client/` — `@peakelo/client`

| Variable              | Required | Default                 | Purpose                           |
| --------------------- | -------- | ----------------------- | --------------------------------- |
| `NEXT_PUBLIC_API_URL` | no       | `http://localhost:4000` | Browser origin of the Fastify API |

Copy `client/.env.example` to `client/.env.local`.
