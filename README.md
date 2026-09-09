# Peakelo

The ultimate place to master chess.

Peakelo imports your Chess.com / Lichess games, builds a real player profile from every move, and
teaches in human language — drills, roadmaps, and game reviews that sound like a coach, not an
engine dump. Product notes live in `docs/projectdef/`.

This repo is a **pnpm monorepo**. Use pnpm only (`npm` / `yarn` are blocked).

```bash
pnpm install
pnpm dev            # client :3000 + server :4000
pnpm test
pnpm build
```

| Package | Path | Role |
| --- | --- | --- |
| `@peakelo/client` | `client/` | Next.js + AlignUI |
| `@peakelo/server` | `server/` | Fastify API |
| `@peakelo/shared` | `packages/shared/` | Zod / DTOs / enums / constants |
| `@peakelo/engine` | `packages/engine/` | Pure chess rules (Node + browser) |

Agents: start at `AGENTS.md`. Visual system: `docs/design/ui.md`.
