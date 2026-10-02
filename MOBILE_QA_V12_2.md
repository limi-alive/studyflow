# StudyFlow v12.2 — Mobile QA

This patch focuses on the phone experience without changing the desktop dashboard layout.

## Mobile layout targets

- 320–340 px: compact phones; navigation labels collapse before content becomes cramped.
- 360–390 px: primary phone target; dashboard reward becomes a stacked compact card.
- 390–430 px: modern iPhone / Android target; two-column micro layouts are retained where readable.
- 431–520 px: large phones; denser reward and settings layouts remain readable.
- 521–820 px: tablet / large mobile; content stays one-column where the desktop grid would become narrow.
- Landscape under 520 px height: bottom navigation compresses and the dashboard reward hides to prioritize study controls.

## Reliability checks run by APPLY_LATEST.cmd

1. npm install
2. ESLint with zero-warning project policy
3. TypeScript project check
4. Test suite
5. Production build
6. dist output verification
7. English-only monetary reward copy check
8. Commit and push only after all previous checks pass

## UX changes

- Fixed safe-area aware mobile app bar.
- Bottom navigation rebuilt for touch targets and narrow screens.
- Dashboard monthly reward card added above dashboard content on phones.
- Monetary reward copy uses English and `Toman` everywhere in the reward UI.
- Auth becomes a bottom sheet on phones and avoids iOS input zoom.
- Timer typography and controls scale from 320 px through large phones.
- Settings, achievements, reward ledgers and review cards collapse cleanly.
- Companion controls and previews no longer force horizontal overflow.
- Charts and wide data surfaces are constrained or horizontally scrollable instead of widening the page.
