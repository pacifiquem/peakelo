# data/slow-runs

Runtime corpus. Raw transcripts, video JSON, recovered PGNs, and the EPD index
are written here by `scripts/slow-runs/`. They are gitignored.

```bash
pnpm --filter @peakelo/server exec tsx ../scripts/slow-runs/fetch.ts
pnpm --filter @peakelo/server exec tsx ../scripts/slow-runs/index.ts
```

See `scripts/slow-runs/README.md`.
