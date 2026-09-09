# Database

Prisma is the planned ORM. Do not instantiate `PrismaClient` until the first real model exists in `prisma/schema.prisma` and `DATABASE_URL` is documented in `ENV.md`.

When that happens:

1. Add `@prisma/client` and `prisma` to this package.
2. Add a singleton at `src/db/prisma.ts` (one client per process, never per request).
3. Extend `/health/ready` to ping the database.
4. Put raw SQL only in `src/db/`, never in `src/modules/`.
