# StudyFlow v13.5 QA notes

## Goals

- Never block the dashboard on cloud reconciliation.
- Keep the existing single-flight sync safety guard.
- Show sync as a small background status surface instead of a blank page.
- Preserve the global Study League for signed-in users.
- Add useful dashboard information without duplicating the main analytics page.
- Keep mobile content inside the visual viewport and above the bottom dock.

## Static regression checks

`verify-v13-5.cjs` checks:

- the old blocking `Syncing your StudyFlow space` screen is removed;
- signed-in users render cached dashboard content immediately;
- sync emits global lifecycle events and still uses the single-flight guard;
- the background sync notice is mounted globally;
- Study Pulse is present;
- global sidebar leaderboard remains present;
- v13.5 CSS is imported after older styles;
- Timer, Planner, and Stats receive mobile-specific constraints.

## Runtime checks performed by APPLY_LATEST.cmd

1. ESLint with zero warnings.
2. TypeScript project typecheck.
3. Vitest test suite.
4. Vite production PWA build.
5. v13.5 static regression checks.
6. Production output existence check.

## UX behavior

- Sync begins in the background and cached data remains interactive.
- Sync UI is delayed briefly so fast syncs do not flash a toast.
- Successful background sync confirms briefly and disappears.
- Failed sync never deletes local data and offers a retry action.
- Dashboard Study Pulse shows today progress, seven-day study time, streak, and a direct Focus action.
