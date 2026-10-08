const fs = require('fs');

const read = p => fs.readFileSync(p, 'utf8');
const fail = m => { console.error(`FAIL: ${m}`); process.exitCode = 1; };
const pass = m => console.log(`PASS: ${m}`);

const homeGate = read('src/components/HomeGate.tsx');
const appShell = read('src/components/AppShell.tsx');
const sync = read('src/lib/sync.ts');
const syncNotice = read('src/components/BackgroundSyncNotice.tsx');
const home = read('src/pages/Home.tsx');
const app = read('src/App.tsx');
const css = read('src/ux-v13-5.css');
const main = read('src/main.tsx');

if (homeGate.includes('Syncing your StudyFlow space')) fail('blocking sync screen still exists'); else pass('blocking sync screen removed');
if (!homeGate.includes('if (identity.loading || identity.signedIn) return <HomePage/>')) fail('signed-in dashboard is not immediate'); else pass('signed-in dashboard renders immediately');
if (!sync.includes("studyflow:sync-state")) fail('global sync-state events missing'); else pass('sync emits background state');
if (!sync.includes('syncFlights')) fail('single-flight sync guard missing'); else pass('single-flight sync guard preserved');
if (!appShell.includes('BackgroundSyncNotice')) fail('background sync notice missing from shell'); else pass('background sync notice mounted');
if (!appShell.includes('data-ui-build="13.5"')) fail('build marker is not 13.5'); else pass('build marker updated');
if (!syncNotice.includes('You can keep using StudyFlow while this finishes.')) fail('non-blocking sync copy missing'); else pass('non-blocking sync UX copy');
if (!home.includes('study-pulse-strip')) fail('Study Pulse dashboard strip missing'); else pass('Study Pulse dashboard strip');
if (!home.includes('currentStreak')) fail('streak metric missing from Study Pulse'); else pass('Study Pulse streak metric');
if (!app.includes('route-fallback')) fail('branded lazy-route fallback missing'); else pass('branded lazy-route fallback');
if (!main.includes("import './ux-v13-5.css';")) fail('v13.5 stylesheet import missing'); else pass('v13.5 stylesheet imported last');
if (!css.includes('@media(max-width:820px)') || !css.includes('[data-route="timer"]') || !css.includes('[data-route="planner"]') || !css.includes('[data-route="stats"]')) fail('mobile route polish incomplete'); else pass('mobile route polish coverage');
if (!appShell.includes('GlobalLeaderboardCard board={leaderboard} variant="sidebar"')) fail('global sidebar leaderboard missing'); else pass('global sidebar leaderboard preserved');

if (process.exitCode) process.exit(process.exitCode);
console.log('StudyFlow v13.5 regression checks passed.');
