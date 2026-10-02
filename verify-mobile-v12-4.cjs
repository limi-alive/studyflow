const fs = require('fs');

function must(condition, message) {
  if (!condition) {
    console.error(`VERIFY FAILED: ${message}`);
    process.exit(1);
  }
}

const css = fs.readFileSync('src/mobile-final-v12.css', 'utf8');
const shell = fs.readFileSync('src/components/AppShell.tsx', 'utf8');
const timer = fs.readFileSync('src/pages/Timer.tsx', 'utf8');
const main = fs.readFileSync('src/main.tsx', 'utf8');

let depth = 0;
for (const char of css) {
  if (char === '{') depth += 1;
  if (char === '}') depth -= 1;
  must(depth >= 0, 'CSS closes a block before it opens one.');
}
must(depth === 0, 'CSS braces are unbalanced.');
must((main.match(/mobile-final-v12\.css/g) || []).length === 1, 'mobile stylesheet must be imported exactly once.');
must(shell.includes('data-route={routeKey}'), 'route marker is missing.');
must(!shell.includes("to === '/timer' ? 'nav-focus'"), 'Timer still has a permanent special nav class.');
must(shell.includes("routeKey !== 'timer' && routeKey !== 'stats'"), 'FAB is not suppressed on focus and analytics routes.');
must(css.includes('.bottom-nav a:not(.active)'), 'inactive bottom tabs are not explicitly reset.');
must(css.includes('grid-template-columns:repeat(7,minmax(0,1fr))'), 'dashboard week dates are not a 7-column phone grid.');
must(css.includes('grid-template-columns:repeat(5,minmax(0,1fr))'), 'analytics range selector is not a 5-column phone grid.');
must(css.includes('.recharts-xAxis .recharts-cartesian-axis-tick{display:none!important}'), 'analytics x-axis tick thinning is missing.');
must(!css.includes('.analytics-hero svg,.stats-chart-card svg{'), 'generic stats-card SVG inflation bug is still present.');
must(css.includes('.stats-chart-card > svg'), 'utility icon size repair is missing.');
must(css.includes('.timer-stage.timer-active'), 'active focus layout override is missing.');
must(css.includes('.companion-status-dot{display:block!important;width:6px!important;height:6px!important'), 'companion caption status-dot repair is missing.');
must(css.includes('.focus-tool span{display:inline!important'), 'focus tool labels remain hidden on phones.');
must(css.includes('button[aria-label*=\"sidebar\" i]'), 'legacy mobile drawer-handle suppression is missing.');
must(css.includes('.stats-chart-card svg text{display:none!important'), 'generic custom-SVG date label thinning is missing.');
must(timer.includes('Score {focusProgress.averageScore'), 'mobile focus score copy was not simplified.');
must(timer.includes('focus-active-context'), 'focus context markup unexpectedly changed or disappeared.');
console.log('v12.4 mobile regression checks passed: nav state, 7-day dashboard, stats SVG/ticks, focus composition and safe fixed-nav spacing.');
