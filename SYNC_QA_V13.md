# v13 Sync / Security QA checklist

Automated/static checks performed while preparing the patch:

- TypeScript/TSX syntax parse: all source files pass.
- Relative imports: no missing local import paths.
- CSS brace validation: admin-v13.css balanced.
- `git diff --check`: clean.
- Reward math checks:
  - 1h -> ~178,571 Toman live value
  - 10h -> 1,785,714 Toman live value
  - 28h -> 5,000,000 Toman earned
  - 56h -> 10,000,000 Toman earned
- Sync conflict checks:
  - newer remote row beats stale pending local row
  - newer pending local row remains eligible to upload
- Admin model:
  - admin membership is in a separate allowlist table
  - no normal-user insert/update/delete policy exists on `admin_users`
  - admin analytics are exposed through read-only RPCs that verify admin membership
  - passwords and session notes are not returned

Final repo CI should still run lint, TypeScript typecheck, unit tests and Vite build after push.
