# StudyFlow v11

## Monthly money reward
- Every 28 hours of study in the current selected calendar month unlocks 5,000,000 toman.
- Rewards stack: 56h = 10M, 84h = 15M, etc.
- The app shows earned, marked-paid and outstanding amounts.
- Payment is a personal tracker only; StudyFlow does not transfer money.

## Achievements
First Step, 10h, 28h Club, 50h, 100h, 7-day streak, 30-day streak, Deep Diver, Early Bird, Night Owl, and Locked In (95+ Focus Score).

## Reviews
- Weekly review with week-over-week delta.
- Monthly Wrapped with total focus, sessions, top subject, best day, peak hour and reward blocks.

## Account & security
- Existing cloud users automatically receive a unique generated username after the SQL migration.
- Username can be changed and is protected by a database-level case-insensitive unique index.
- Password changes require the current password.
- Passwords remain inside Supabase Auth; they are never saved in localStorage or IndexedDB.

## Reset all data
Two-step destructive confirmation:
1. explicit irreversible-data warning;
2. type DELETE + current account password.

Reset deletes study data from local IndexedDB and cloud tables but preserves the login account itself.
