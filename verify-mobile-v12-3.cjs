const fs = require('fs');

function must(condition, message) {
  if (!condition) {
    console.error(`VERIFY FAILED: ${message}`);
    process.exit(1);
  }
}

const css = fs.readFileSync('src/mobile-final-v12.css', 'utf8');
const shell = fs.readFileSync('src/components/AppShell.tsx', 'utf8');
const sidebarReward = fs.readFileSync('src/components/SidebarRewardCard.tsx', 'utf8');
const dashboardReward = fs.readFileSync('src/components/DashboardRewardCard.tsx', 'utf8');
const main = fs.readFileSync('src/main.tsx', 'utf8');

let depth = 0;
for (const char of css) {
  if (char === '{') depth += 1;
  if (char === '}') depth -= 1;
  must(depth >= 0, 'CSS closes a block before it opens one.');
}
must(depth === 0, 'CSS braces are unbalanced.');
must((main.match(/mobile-final-v12\.css/g) || []).length === 1, 'mobile stylesheet must be imported exactly once.');
must(shell.includes("routeKey === 'dashboard'"), 'reward card is not explicitly dashboard-only.');
must(shell.includes('data-route={routeKey}'), 'route-scoped mobile layout marker is missing.');
must(shell.includes('resolvedRoutePath'), 'hash/browser route normalization is missing.');
must(css.includes('calc(var(--mobile-header-h) + env(safe-area-inset-top))'), 'iOS top safe-area compensation is missing.');
must(css.includes('.bottom-nav a.nav-focus.active .nav-icon'), 'Timer highlight is not limited to the active route.');
must(!css.includes('.bottom-nav a.nav-focus .nav-icon{'), 'Timer would remain highlighted on every tab.');
must(css.includes('.app-shell[data-route="timer"]>.fab'), 'focus screen FAB suppression is missing.');
must(!sidebarReward.includes('تومان'), 'Sidebar reward still contains Persian currency copy.');
must(!dashboardReward.includes('تومان'), 'Dashboard reward still contains Persian currency copy.');
console.log('Mobile regression checks passed: safe areas, dashboard-only reward, nav state, focus FAB and English reward copy.');
