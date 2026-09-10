# TODO

## In progress

- [x] Live Google OAuth + a real import of your own games (needs your credentials)

## Next up

- [ ] Game writeup (eval bar / glyphs / best-move arrow ship from the pass)
- [ ] Player profile writeup (bare snapshot first — ADR 0008)
- [ ] Payments (14.99 / 34.99 / 1.22) — stop and ask for processor (layout + ADR 0007 ready)
- [ ] Official Chess.com OAuth once they issue endpoints (button is wired, creds are not)

## Done

- [x] Root pnpm workspace (`client`, `server`, `packages/shared`, `packages/engine`)
- [x] `AGENTS.md` §3.1 / §3.2: exact `shared` vs `engine` rules
- [x] Fastify health server with typed errors
- [x] AlignUI utils + Peakelo theme tokens
- [x] `align-ui` project skill + `docs/design/ui.md`
- [x] GitHub Actions CI (typecheck, lint, test, build)
- [x] First Prisma models (User, AuthAccount, Session, Onboarding, Game, SyncState)
- [x] Google / Lichess / Chess.com OAuth + onboarding + initial import + 30-minute sync
- [x] Join polish: official logos, equal buttons, toasts, no setup copy, focus labels
- [x] Dual Chess.com + Lichess import with source switcher (Pro later — ADR 0001)
- [x] Import ticker (Fetching / Indexing / …), visible disabled buttons, official green Chess.com pawn
- [x] Onboarding layout: one scoresheet per step instead of a pile of boxes
- [x] Game sync lives in `server/src/modules/cron/` (shared scheduler + `game-sync` job)
- [x] Logged-in dashboard shell + empty plates (ADRs 0002–0007)
- [x] Dashboard contrast, table columns, labeled chrome, checkout warning
- [x] Settings in the rail (Account + Billing); Lichess-green game navigator
- [x] Official Chessground board (cburnett) on `/games/[id]`
- [x] Bare engine pass (Stockfish adapter + cron worker + Lichess opening book + raw `/profile`)
