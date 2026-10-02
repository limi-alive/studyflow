# StudyFlow Account Setup — v12

After `APPLY_LATEST.cmd` finishes and GitHub Actions deploys the site:

1. Open your Supabase project.
2. Open **SQL Editor**.
3. Open this file from the StudyFlow repo:
   `supabase/migrations/004_auth_signup_username.sql`
4. Copy the entire SQL file into a new SQL query and run it once.
5. In Supabase Authentication settings, keep **Email + Password** enabled.
6. Reload StudyFlow.
7. The account screen will let each person create a separate username, email and password.

The app never writes account passwords to IndexedDB or localStorage. Password verification, sessions and recovery are handled by Supabase Auth.

## Important

The app signs in with **email + password**. The username is the public StudyFlow identity and is globally unique. This follows the project specification and avoids exposing a username-to-email lookup endpoint.

The migration also applies strict per-user RLS to the existing user-owned tables so authenticated User A cannot read/write User B rows.
