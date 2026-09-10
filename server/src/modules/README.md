# Modules

Domain folders: `auth`, `onboarding`, `games`, `profile`. Engine adapter: `engine`. Process jobs: `cron`.

Rules:

- Routes stay thin. Behavior lives behind a small module interface.
- Do not pile handlers into `src/routes/` except health and other process-level endpoints.
- Shared Zod/DTO types belong in `@peakelo/shared`, not copied here.
- Interval jobs live in `cron/` (`jobs.ts` registers them, `scheduler.ts` is the shared timer). Domain pull/persist stays in the owning module.
