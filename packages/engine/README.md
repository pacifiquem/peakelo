# `@peakelo/engine`

Pure chess rules and position math. Import from `@peakelo/client` and `@peakelo/server`.

This is a library, not a process. Stockfish (native or WASM) is an adapter in `server/` or
`client/`. It must not live here.

Allowed: FEN/PGN/SAN/UCI, legal moves, apply-move, clocks as numbers.

Forbidden: `child_process`, filesystem, fetch, React, Fastify, Prisma.

Rules: `AGENTS.md` §3.2.
