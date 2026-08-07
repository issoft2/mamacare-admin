# Safeborn — Admin Console

## Known issue: `@safeborn/*` workspace packages don't exist

`package.json` originally declared three workspace dependencies that don't
exist anywhere on disk, in any repo, or in any pnpm workspace:

```json
"@safeborn/api": "workspace:*",
"@safeborn/types": "workspace:*",
"@safeborn/ui": "workspace:*",
```

`next.config.js`'s `transpilePackages` list still references them too.
There's no `pnpm-workspace.yaml` in this repo and no sibling `packages/`
directory — these were likely meant to live alongside this app in a
larger monorepo that either never existed here or was never checked in.

**Effect:** `pnpm install` failed outright (`ERR_PNPM_WORKSPACE_PKG_NOT_FOUND`),
which meant *nothing* could be installed — not even the real, valid
dependencies (Next.js, React, Clerk, TanStack Query, TypeScript). The
existing Dashboard page (`src/components/DashboardMetrics.tsx`, which
imports `useDashboardStats` from `@safeborn/api`) has been broken as
checked out, independent of any of the changes below.

**What was done (2026-08-07):** the three `@safeborn/*` lines were removed
from `package.json`'s `dependencies` so `pnpm install` could succeed for
everything else, unblocking real local development and TypeScript
checking. This was the minimum change needed — `next.config.js`'s
`transpilePackages` entries were left alone since they're harmless with
the packages absent (transpiling a nonexistent package is a no-op).

**What this means right now:**
- `DashboardMetrics.tsx`, and anything else importing `@safeborn/api` /
  `@safeborn/types` / `@safeborn/ui`, now fails to compile with a clear
  "Cannot find module" error — the honest version of the same brokenness
  that silently existed before via a totally-failed install.
- The new Clinical Review page (`src/app/dashboard/clinical-review/`)
  does not depend on these packages at all — it has its own small,
  self-contained API client (`src/lib/reviewApi.ts`).

**To restore once `@safeborn/*` is dealt with** (either by recreating
those packages in a real monorepo, or rewriting Dashboard to use its own
self-contained client the same way Clinical Review does): re-add the
three lines above to `package.json`, restore the matching entries in
`node_modules` (a real `pnpm-workspace.yaml` + `packages/` directory, or
point them at wherever the real source ends up), and run `pnpm install`
again.
