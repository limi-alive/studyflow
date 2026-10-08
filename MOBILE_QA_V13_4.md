# StudyFlow v13.4 — Global League + Mobile Polish

## What changed

- Global monthly Study League is visible to every signed-in user.
- Public leaderboard exposes only username/display name, rank, aggregate study time and session count.
- Admin-only subject/session detail remains private.
- Login/signup no longer waits for cloud reconciliation; safe cloud-first sync continues in the background.
- Concurrent sync attempts are single-flight guarded to avoid duplicate cloud reconciliation.
- Fixed the main mobile regression: the mobile stylesheet was scoped to `data-ui-build="12.5"` while v13 rendered `13.0`, so many phone rules were not applying.
- Mobile selectors are now version-resilient.
- Refined mobile app bar, floating bottom dock, Focus companion stage, timer controls, dashboard date/chart layout, Planner forms, Statistics chart/subject layout and auth sheet.
- The large floating `+` is suppressed on phones to prevent overlap with content/navigation.

## Validation

The Windows installer runs:

1. ESLint (`--max-warnings 0`)
2. TypeScript project check
3. Vitest
4. Production Vite/PWA build
5. `verify-v13-4.cjs` static regressions
6. Production output check

The patch files were additionally syntax-checked before packaging.

## Supabase

After deploy, run `supabase/migrations/007_public_leaderboard.sql` once in Supabase SQL Editor.

`006_core_cloud_tables.sql` is included in the repository so the schema is version-controlled. If it was already executed successfully, it does not need to be run again.
