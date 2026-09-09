---
name: align-ui
description: "Build Peakelo UI with AlignUI (copy-paste, Tailwind v4, Remix Icon) and the Peakelo neo-brutal / vaporwave token set. Use when adding or restyling any client component, page, form, modal, toast, or layout chrome."
---

# AlignUI + Peakelo

There is no official AlignUI skill on skills.sh. This is the project skill.

Read `docs/design/ui.md` before the first component. Official reference:
https://www.alignui.com/docs/v1.2/

## Rules

1. **Copy-paste, do not npm-install a component kit.** AlignUI ships source. Paste into
   `client/components/ui/<name>.tsx`. Keep the `* as Button` namespace export style from the docs.
2. **Utils already exist.** Import `cn` from `@/utils/cn`, `tv` from `@/utils/tv`,
   `recursiveCloneChildren` from `@/utils/recursive-clone-children`, polymorphic types from
   `@/utils/polymorphic`. Do not invent a second `cn`.
3. **Remix Icon only** (`@remixicon/react`).
4. **Restyle after paste.** Official AlignUI is a rounded SaaS kit. Peakelo overrides:
   ink borders (`stroke-soft-200` is ink), offset shadows (`shadow-regular-sm`), radius 2–4px,
   magenta primary, cyan information, gold advantage. See `docs/design/ui.md`.
5. **Do not run `@alignui/cli tailwind` without restoring Peakelo tokens.** The CLI overwrites
   `globals.css`.
6. **Analysis surfaces stay quieter than chrome.** Board, eval, and teaching copy do not get
   vaporwave treatments.
7. **No native dialogs.** No `alert` / `confirm` / `prompt`.
8. **Install a component's peer deps with pnpm** from the repo root:
   `pnpm --filter @peakelo/client add @radix-ui/react-slot` (example).

## Install a component

1. Open the v1.2 docs page for that component.
2. Install listed peer dependencies with pnpm.
3. Paste the file into `client/components/ui/`.
4. Point imports at `@/utils/*` and `@/components/ui/*`.
5. Swap color / radius / shadow classes to Peakelo tokens.
6. Check contrast and focus; check mobile.

## Anatomy

Most AlignUI components are multi-part: `Root`, `Trigger`, slots via `tv()`, children cloned by
`recursiveCloneChildren` when `asChild` is used. Do not flatten that into one styled `<div>`.

```tsx
import * as Button from '@/components/ui/button';
import { RiArrowRightSLine } from '@remixicon/react';

<Button.Root variant="primary" className="w-fit">
  Import games
  <Button.Icon as={RiArrowRightSLine} />
</Button.Root>
```

## When not to use this skill

- Server / Prisma / Fastify work → `nodejs-backend-patterns`
- React/Next performance (waterfalls, bundles) → `vercel-react-best-practices`
- Pure aesthetic direction after tokens are already applied → `frontend-design`
