# scripts

Repo-level helper scripts. Add them here when a task is deterministic enough to stop living in
agent prose.

## Slow-run corpus

GothamChess / Hikaru / Naroditsky transcripts + optional PGN/EPD index:

```bash
pnpm --filter @peakelo/server exec tsx ../scripts/slow-runs/fetch.ts
pnpm --filter @peakelo/server exec tsx ../scripts/slow-runs/index.ts
```

Details: [`slow-runs/README.md`](./slow-runs/README.md).
