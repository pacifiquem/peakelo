# Modules

Domain folders: `auth`, `onboarding`, `games`. Analysis and players come later.

Rules:

- Routes stay thin. Behavior lives behind a small module interface.
- Do not pile handlers into `src/routes/` except health and other process-level endpoints.
- Shared Zod/DTO types belong in `@peakelo/shared`, not copied here.
