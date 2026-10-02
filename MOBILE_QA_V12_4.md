# StudyFlow v12.4 — Mobile UX deep repair

This pass targets the concrete defects visible in the October 3 iPhone screenshots.

## Fixed

- The Timer tab no longer keeps a permanent gradient/highlight while another route is active.
- Only the current bottom-navigation destination receives the active treatment.
- Quick Add is removed from Focus and Statistics, where it was covering important content.
- Dashboard dates are a fixed seven-day phone grid instead of a clipped horizontal strip.
- Dashboard rhythm chart is shorter on phones and no longer consumes most of the first screen.
- Statistics no longer applies chart dimensions to every SVG icon. This was the cause of the giant pulse/heartbeat graphic.
- Month chart x-axis labels are thinned on phones to prevent `Sep Sep Sep...` collisions.
- Statistics Today/Week/Month/Year/All selector is a five-column phone control and cannot run off-screen.
- Active Focus is forced into a compact top-to-bottom flow instead of inheriting desktop viewport spacing.
- Companion caption/status dot sizing is explicitly repaired on phones.
- Zen, Distracted and average-score tools are a compact three-item row with readable labels.
- Timer display and controls stay together in one compact card with additional clearance above the fixed tab bar.
- Existing iOS safe-area compensation and Supabase GitHub Actions injection are retained.

## Validation performed before packaging

- CSS brace/parsing checks.
- TypeScript/TSX syntax transpilation checks for AppShell and Timer.
- Static regression assertions for navigation state, date grid, chart SVG scoping, x-axis thinning, focus layout and PWA stylesheet wiring.
- Patch structure check: files land directly in the repository root when extracted.

`APPLY_LATEST.cmd` additionally runs the real project lint, TypeScript typecheck, test suite and production Vite build before it is allowed to commit or push.
