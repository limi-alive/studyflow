# StudyFlow v12.1 — Mobile + Cloud QA

This patch does two things:

1. Makes the GitHub Pages production build receive the existing repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Adds final phone polish for navigation, auth, timer, settings, rewards, companion scenes and safe-area handling.

## Mobile sizes targeted

- 320–379 px small phones
- 380–519 px common phones
- 520–820 px large phones / small tablets
- landscape phones with short viewport heights

## QA included by APPLY_LATEST.cmd

- ESLint with zero warnings
- TypeScript typecheck
- Test suite
- Production build
- verification that the production bundle contains the configured Supabase URL
- git commit + push only after all local checks pass

After the push, GitHub Actions rebuilds the site using the repository secrets. Refresh the deployed site with a hard reload before creating the first account.
