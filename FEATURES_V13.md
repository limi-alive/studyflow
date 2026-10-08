# StudyFlow v13 — Cross-device Sync, Reward Rate & Admin Center

## Cross-device account sync

When the same signed-in account is used on another device, StudyFlow now automatically reconciles:

- subjects and topics
- tasks
- study sessions
- goals and exams
- language/theme/timer settings
- companion + motion preference
- focus-system preferences and progress snapshot
- reward payment ledger

Sync runs after sign-in, when the app returns to the foreground, when the network reconnects, after important writes, and every 20 seconds while the app is open. Study records use `updated_at` conflict resolution so a stale device does not overwrite a newer cloud row.

The offline identity is kept separate from the signed-in cloud identity. Signing out therefore does not expose the previous cloud account through Offline mode.

## Reward rate

The official rule remains:

- 28 study hours = 5,000,000 Toman unlocked

StudyFlow also shows the proportional rate:

- about 178,571 Toman per study hour

`Live study value` is informational before a full 28-hour block is unlocked. `Earned` remains based only on completed 28-hour blocks.

## Admin Center

The new read-only Admin Center can show:

- total registered StudyFlow profiles
- active users for Today / This week / This month / All time
- ranking (1st, 2nd, 3rd, ...)
- study time and session count per user
- all-time study total
- last study activity
- subject breakdown for a selected user
- recent session subject, duration, date and timer mode

Passwords and private session notes are not exposed to the Admin Center.

Admin authority is stored only in `public.admin_users`. Regular browser users have no policy that can insert, update or delete rows in that table.
