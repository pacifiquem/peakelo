# Slow-run corpus

Local transcripts + optional PGN recovery for GothamChess, Hikaru, and Naroditsky
slow-run playlists. Output lives in `data/slow-runs/` (gitignored except this
pointer and `data/slow-runs/README.md`).

## One-time extras (optional)

`yt-dlp` is preferred when it is on `PATH`. A Python fallback lives in `.venv`:

```bash
python3 -m venv scripts/slow-runs/.venv
scripts/slow-runs/.venv/bin/pip install -r scripts/slow-runs/requirements.txt
```

InnerTube ANDROID/TVHTML5 is the last fallback. No API key is required.

## Commands

From the repo root (`tsx` lives on `@peakelo/server`; cwd for `pnpm --filter … exec` is `server/`):

```bash
pnpm --filter @peakelo/server exec tsx ../scripts/slow-runs/fetch.ts
pnpm --filter @peakelo/server exec tsx ../scripts/slow-runs/index.ts
pnpm --filter @peakelo/server exec tsx ../scripts/slow-runs/teach.ts
pnpm --filter @peakelo/engine exec vitest run --config ../../scripts/slow-runs/vitest.config.ts
```

Useful flags (both CLIs):

| Flag | Meaning |
| --- | --- |
| `--limit N` | Fetch at most N new videos **per speaker**; index at most N videos |
| `--playlist gotham\|hikaru\|naroditsky\|all` | Restrict to one playlist |
| `--video ID` | One YouTube id |
| `--force` | Refetch / reindex |
| `--delay-ms 1500` | Pause between network calls |

Runs are resumable via `data/slow-runs/manifest.json`. Per-video failures are
recorded on that row; the process keeps going.

## Output

```
data/slow-runs/
  manifest.json
  fetch.log
  index.log
  videos/{videoId}.json
  transcripts/{videoId}.json
  games/{videoId}.pgn          # only when a real Chess.com / Lichess URL fetched
  index/positions.json         # comments with EPD only when a real game PGN was recovered
  index/teaching.json          # voice/cadence beats (no invented boards)
```

Search helper for the later Mastra tool: `searchSlowRuns` in `search.ts`.
Empty or missing index → `[]`.
