# Instructive lesson on `/games/[id]`

The engine pass (ADR 0008) stays the source of evals, glyphs, and best-move arrows.
The **lesson** is a separate, on-demand layer: Claude Opus 4.6 via Mastra, reading that JSON,
optionally asking Stockfish for extra MultiPV lines, and using a local slow-run
corpus (GothamChess, Hikaru, Naroditsky) two ways: exact-EPD quotes when we recovered
a game, and teaching beats (voice/cadence) extracted from transcripts without inventing
a board. It never invents evals or replaces stored `judgment`.

We picked Mastra as the in-process tool loop (not a second HTTP server, not raw
chat completions) so `requestEngineLines`, `searchSlowRuns`, and
`searchSlowRunTeaching` are real tools. The model id is `anthropic/claude-opus-4-6`.
`ANTHROPIC_API_KEY` is optional at boot; missing key → `SERVICE_UNAVAILABLE` and a toast,
never setup copy.

Slow-run memory lives as files under `data/slow-runs/`. Position hits require a real
Chess.com/Lichess PGN. Teaching beats are real caption windows tagged by how they talk
(hanging piece, plan, king safety) and are injected as voice examples — never as
"this was your game."

The client receives structured **segments**. A segment with `lineUci` is a
clickable line: the board steps into that variation. Questions are a second
authenticated call against the same position (and optional variation), not a
second product voice.

**Considered:** embedding a Mastra Fastify adapter (`/api/agents`). Rejected —
we keep Peakelo routes, sessions, and the error envelope. Mastra is a library
call from `server/src/modules/lesson/`.
