const fs = require('fs');

const read = (p) => fs.readFileSync(p, 'utf8');
const fail = (m) => { console.error(`FAIL: ${m}`); process.exitCode = 1; };
const pass = (m) => console.log(`PASS: ${m}`);

const appShell = read('src/components/AppShell.tsx');
const mobileBase = read('src/mobile-final-v12.css');
const mobilePolish = read('src/mobile-v13-4.css');
const authGate = read('src/components/AuthGate.tsx');
const sync = read('src/lib/sync.ts');
const migration = read('supabase/migrations/007_public_leaderboard.sql');
const main = read('src/main.tsx');

if (!appShell.includes('data-ui-build="13.4"')) fail('AppShell build marker is not 13.4'); else pass('AppShell build marker');
if (mobileBase.includes('data-ui-build="12.5"')) fail('stale v12.5-only mobile selectors remain'); else pass('mobile rules are version-resilient');
if (!appShell.includes('GlobalLeaderboardCard board={leaderboard} variant="sidebar"')) fail('desktop sidebar leaderboard missing'); else pass('desktop sidebar leaderboard');
if (!appShell.includes('GlobalLeaderboardCard board={leaderboard} variant="dashboard"')) fail('mobile dashboard leaderboard missing'); else pass('mobile leaderboard');
if (!main.includes("import './mobile-v13-4.css';")) fail('v13.4 stylesheet import missing'); else pass('v13.4 stylesheet import');
if (!authGate.includes('void reconcileAccountInBackground')) fail('auth still blocks on sync'); else pass('post-login sync runs in background');
if (!sync.includes('syncFlights')) fail('single-flight sync guard missing'); else pass('concurrent sync guard');
if (!migration.includes('studyflow_public_leaderboard')) fail('leaderboard RPC migration missing'); else pass('leaderboard RPC migration');
if (/email|note|subject_name|start_time|end_time/i.test(migration.split('returns table(')[1]?.split(')\nlanguage')[0] || '')) fail('public leaderboard return shape exposes private detail'); else pass('leaderboard return shape is aggregate-only');
if (!mobilePolish.includes('[data-route="timer"]') || !mobilePolish.includes('[data-route="stats"]') || !mobilePolish.includes('[data-route="planner"]')) fail('mobile route polish incomplete'); else pass('focus/stats/planner mobile polish');

if (process.exitCode) process.exit(process.exitCode);
console.log('StudyFlow v13.4 static regression checks passed.');
