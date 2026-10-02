# StudyFlow implementation status

This repository implements the first working product slice from `PRODUCT_SPEC.md` and establishes the architecture for the remaining releases.

## Implemented in the current codebase

- React + TypeScript + Vite mobile-first PWA shell.
- Tailwind-based styling plus a CSS-variable theme engine.
- 12 initial themes: Liquid, Chrome, Pink Chrome, Dark Hero, AMOLED, Aurora, Cyber, Cozy Study, Sakura, Minimal, Space and Forest.
- IndexedDB via Dexie; local account works without sign-in.
- Persistent UUID-based data model for subjects, topics, tasks, sessions, goals and exams.
- Timestamp-based active timer persisted across refresh/restart.
- Stopwatch, countdown, Pomodoro and deep-focus timer modes.
- Subject/chapter/topic, task, goal, exam and session CRUD foundations plus manual session entry.
- Daily/home metrics, 7-day chart, 30-day statistics, subject distribution and heatmap.
- JSON full-data export/import with a pre-import local safety snapshot, plus CSV session export.
- Supabase email/password authentication foundation.
- Upgrade path from local offline user ID to authenticated Supabase user ID.
- Push/pull cloud sync with UUID upsert and last-updated-wins behavior for simple conflicts.
- Supabase RLS for private data and schema for future friendship/shared-challenge features.
- Responsive desktop sidebar and mobile five-tab navigation, global search and a quick-add launcher.
- PWA manifest/service worker/offline app shell and a five-step optional onboarding flow.
- Reduced-motion support and theme contrast-oriented variables.
- GitHub CI pipeline: lint -> typecheck -> test -> build -> Pages deploy on main.
- Unit tests for timestamp timer math, pauses, midnight splitting and summary statistics.

## Partially implemented / needs product hardening

- Persian: direction and language preference are implemented; every individual UI string still needs full translation coverage.
- Jalali: preference is stored; calendar views still need a full Jalali date picker/rendering layer.
- Pomodoro: core countdown mode exists; automatic focus/break cycling and long-break cadence still need orchestration.
- Notifications: permission UX, focus-complete notification and haptics exist; scheduled study/exam/goal reminders still need a background scheduling layer.
- Backup/import: JSON export/import and CSV session export exist; stricter schema validation and PDF report export remain.
- Conflict handling: automatic newest-update-wins is implemented; interactive Keep Local / Keep Cloud / Keep Both UI is not yet implemented.
- Planner: task CRUD works; weekly drag/drop/monthly calendar/repeating task engine require completion.
- Goals/exams/topics: basic management screens exist; advanced progress editing, drag/drop hierarchy and detailed exam planning remain.
- Accessibility: semantic controls and reduced motion exist; full keyboard/screen-reader audit remains.

## Deliberately deferred according to V1.5 / V2 priority in the spec

- XP/coins/advanced achievements engine.
- Focus Score and distraction tracking UI.
- Ambient sound mixer.
- Widgets outside the PWA itself.
- Weekly Review / Monthly Wrapped / Yearly Wrapped story flows.
- Theme Store and full custom theme builder.
- Shared Challenge UI, Friends, Study Together and Live Presence.
- App blocking and external calendar integration.
- AI study assistant.

## External setup required

A complete hosted multi-user system requires a Supabase project and a hosting/GitHub repository owned by the deployer. Copy `.env.example` to `.env`, set the public Supabase URL and anon key, run `supabase/schema.sql`, then deploy the repository. Never place the service-role key or database password in the frontend or repository.
