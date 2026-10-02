# StudyFlow v12 — Account Entry + Reward Sidebar

## Added

- First-run account gate inside the app.
- Create account with unique username, email, password and password confirmation.
- Sign in with email + password.
- Forgot-password email flow and in-app new-password screen.
- Continue Offline remains available.
- Signed-in identity and Sign Out control in the desktop sidebar.
- Premium Monthly Reward card in the sidebar:
  - total reward earned this month
  - progress through the current 28-hour block
  - hours remaining until the next +5,000,000 toman
  - outstanding reward indicator
  - click-through to full reward details in Settings
- Settings Account panel now has a direct Sign in / Create account button when offline.

## Account isolation

`004_auth_signup_username.sql` is self-contained and should be run once in Supabase SQL Editor.
It:

- creates/updates `profiles`
- reserves usernames case-insensitively
- lets the signup screen safely check username availability without exposing profile rows
- creates the auth-user profile automatically
- keeps password handling in Supabase Auth
- enables strict `auth.uid() = user_id` RLS policies on existing private StudyFlow tables
- keeps the password-protected `wipe_my_study_data()` reset function

## Reward rule

Every 28 study hours completed inside the selected calendar month unlocks another 5,000,000 toman reward block.
StudyFlow tracks eligibility and payment status only; it does not transfer money.
