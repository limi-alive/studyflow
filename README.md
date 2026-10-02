# StudyFlow

StudyFlow is an offline-first study management PWA built from `PRODUCT_SPEC.md`. It combines a resilient focus timer, subjects/topics, planning, study history, analytics, themes and optional cloud synchronization.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Zustand for persistent active-timer state
- Dexie / IndexedDB for offline data
- Supabase PostgreSQL + Auth + RLS for cloud mode
- vite-plugin-pwa for installability/offline app shell
- Vitest for unit tests

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Cloud setup is optional. Without Supabase variables, StudyFlow runs as an offline-first local application.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env`.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Never expose a service-role key or database password in the frontend.

The SQL enables Row Level Security so authenticated users can access only rows where `user_id = auth.uid()` for private tables.

## Development commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## PWA and offline behavior

The active timer is based on wall-clock timestamps rather than interval tick counts. Its state is persisted, so refreshing or reopening the app reconstructs elapsed time. User records are written first to IndexedDB and marked for synchronization. Cloud retries use UUID upserts to prevent duplicate session creation.

## Deployment

`.github/workflows/ci.yml` runs verification on `dev`/`main`, and deploys `dist/` to GitHub Pages after a successful push to `main`. Enable GitHub Pages with **GitHub Actions** as its source. For cloud mode in production, add repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The app uses hash routing and a relative Vite base so it can also be moved to Vercel, Netlify or Cloudflare Pages without changing application data architecture.

## Repository workflow

Recommended branches:

- `main` — production
- `dev` — integration
- `feature/*` — feature work

Feature branch -> pull request -> dev -> tests -> main -> automatic deployment.

## Data ownership and security

All user-owned cloud records carry `user_id`. RLS is the security boundary; filtering only in the React UI is never treated as authorization. Offline data remains in the browser's IndexedDB until cloud sync is configured and a user signs in.

## Project status

See `docs/IMPLEMENTATION_STATUS.md` for the exact implemented/partial/deferred feature list.

## License

No public redistribution license has been selected yet. Choose the desired license before publishing the repository publicly.
