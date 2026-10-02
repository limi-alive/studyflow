# StudyFlow mobile QA — v12.3

This pass addresses the issues visible in the iPhone screenshots from v12.2.

## Fixed

- The monthly reward is rendered only on the real Dashboard route, including hash-router deployments.
- The mobile app bar now reserves the iOS top safe area, so content no longer starts behind the header.
- The reward card is much shorter and keeps all reward copy in English.
- The Dashboard rhythm chart is constrained to a phone-sized chart area instead of inheriting desktop height.
- Day chips use a deliberate horizontal snap strip rather than clipping the final day.
- Planner inputs/buttons use compact phone dimensions and 16px input text to avoid iOS auto-zoom.
- Timer companion height, live tools, timer digits and controls are compacted for phone screens.
- Quick Add is hidden while on the Timer route to reduce focus-screen clutter.
- Bottom navigation is now an edge-to-edge native-style tab bar with safe-area padding.
- The Timer icon gradient only appears when Timer is actually the active tab.
- Common legacy desktop sidebar/drawer handles are hidden on phone.
- 320px, 390px, 520px and landscape breakpoints are included.

## Validation performed by APPLY_LATEST.cmd

1. npm install
2. ESLint with zero warnings
3. TypeScript project check
4. Test suite
5. Production build
6. dist output presence
7. mobile regression assertions
8. English-only reward currency copy
9. commit + push only after all checks pass
