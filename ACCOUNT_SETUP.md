# Account setup for StudyFlow v11

The frontend can work without this migration, but global username uniqueness and password-protected cloud reset require the Supabase migration:

`supabase/migrations/003_profiles_reset.sql`

Run it once in the Supabase SQL editor for the project.

What it does:
- creates `profiles` with a database-level UNIQUE username constraint;
- adds safe RPCs to check/claim a username without exposing other users' account data;
- adds `wipe_my_study_data()` so an authenticated user can erase their own study data while keeping the login account itself;
- passwords remain in Supabase Auth and are never stored in StudyFlow localStorage or IndexedDB.

The monthly 28h / 5,000,000 toman reward is a tracking rule. It records eligibility and paid/unpaid status; it does not move money automatically.
