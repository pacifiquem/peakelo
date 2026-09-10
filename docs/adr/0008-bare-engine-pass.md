# Bare engine pass (no writeup)

The first profile is a **bare snapshot**: every imported player ply through Stockfish, then
aggregated counts and citations. No player type, no Gotham sentences, no drills. AI writeup
comes later and must read this JSON, not replace it.

## Why this shape

- `@peakelo/engine` stays a pure library (Node + browser): replay, clocks, opening names, CPL,
  phase, overlooked tags, aggregation. It never spawns Stockfish or talks HTTP.
- The server adapter (`server/src/modules/engine/`) is the only process that runs Stockfish.
  Tests inject a fake adapter. One adapter today is a hypothetical seam; the fake in tests
  makes it a real one.
- Jobs stay in `cron/` (`engine-pass`, ~2s). The job claims one pending `GameAnalysis`, calls
  the profile module, and returns. No Redis. Progress lives in Postgres so a restart resumes.
- Opening names come from the vendored Lichess [chess-openings](https://github.com/lichess-org/chess-openings)
  book (CC0), matched by position (EPD) after replaying each book line — not by win/loss text
  and not by a live explorer call on the request path.

## What the snapshot must contain

Tied to `docs/projectdef/coreideaflow.md`:

1. Every player ply: eval before/after, best move + PV, CPL, judgment, clocks, opening, phase.
2. Recurring mistakes grouped by `overlooked` tag, each with 2–5 game citations (`gameId` + ply).
3. Time/move: time spent, remaining, blunders in a scramble, and whether the opponent’s last
   three plies were fast (premove/bulleting) when the player erred.
4. Overlooked: board geometry + eval + PV (hanging piece, missed hanging, missed capture,
   missed check, missed mate, missed combination of 3–4 ply, material loss). Not SAN regex.
5. Openings and pawn structures ranked by **ACPL and blunder rate**, not only score.
6. Tactics by PV depth (1 / 2 / 3 / 4+) the player missed.

Judgment uses raw centipawns from the player’s side: best ≤10, good 11–49, inaccuracy 50–99,
mistake 100–299, blunder ≥300 (same cut the sample writeups used).

## Out of scope

Human headline, “you are a tactical player”, eval bar, Brilliant glyphs, paid writeup lock.
