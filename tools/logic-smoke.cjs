const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const ts = require('typescript');

function loadTS(file) {
  const full = path.join(process.cwd(), file);
  const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
    fileName: full,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
  }).outputText;
  const module = {exports: {}};
  const fn = vm.runInThisContext(`(function(exports, require, module) { ${code}\n})`, {filename: full});
  fn(module.exports, (id) => {throw new Error(`Unexpected runtime dependency: ${id}`);}, module);
  return module.exports;
}
const calendar = loadTS('src/utils/persianCalendar.ts');
const engine = loadTS('src/utils/studyOS.ts');
const invites = loadTS('src/utils/challengeInvite.ts');
const toPlain = x => JSON.parse(JSON.stringify(x));
assert.deepEqual(toPlain(calendar.toPersianParts(new Date('2026-10-30T12:00:00Z'))), {year: 1405, month: 8, day: 8});
assert.deepEqual(toPlain(calendar.persianToGregorian(1405, 1, 1)), {year: 2026, month: 3, day: 21});
assert.deepEqual(toPlain(calendar.persianToGregorian(1404, 12, 29)), {year: 2026, month: 3, day: 20});
assert.throws(() => calendar.persianToGregorian(1404, 12, 30), RangeError);
assert.equal(calendar.parsePersianDigits('۱۴۰۵/۰۸/۰۸'), '1405/08/08');
if (process.argv.includes('--timezone-case')) {
  const iso = calendar.persianLocalToIso(1405, 8, 8, 12, 45);
  const back = new Date(iso);
  assert.equal(back.getHours(), 12);
  assert.equal(back.getMinutes(), 45);
  process.exit(0);
}
for (const tz of ['Asia/Tehran','Europe/Berlin','America/Los_Angeles']) {
  const result = require('node:child_process').spawnSync(process.execPath, [__filename, '--timezone-case'], {
    env: {...process.env, TZ: tz}, encoding: 'utf8'
  });
  assert.equal(result.status, 0, `Timezone ${tz}: ${result.stderr}`);
}
assert.equal(invites.goalFromInvite('?challenge=45'), 45);
assert.equal(invites.goalFromInvite('?challenge=%3Cscript%3E'), null);
assert.ok(invites.challengeInviteUrl(45).endsWith('?challenge=45#/'));
const now = new Date(2026, 9, 30, 12);
const base = {userId: 'a', createdAt:now.toISOString(), updatedAt:now.toISOString(), syncStatus:'synced'};
const subject = {...base,id:'math',name:'ریاضی',color:'#aabbee',priority:2,archived:false};
const task = (id, deadline) => ({...base,id,subjectId:'math',title:id,deadline,status:'todo',priority:2,estimatedMinutes:60});
const data = {userId:'a',tasks:[task('later','2026-12-01T12:00:00'),task('overdue','2026-10-28T12:00:00')],subjects:[subject],exams:[],sessions:[],now,capacityMinutes:45};
const plan = engine.buildStudyOS(data);
assert.equal(plan.plan[0].taskId,'overdue');
assert.ok(plan.allocated <= 45);
assert.equal(engine.buildStudyOS({...data,tasks:[{...task('other'),userId:'b'}],subjects:[{...subject,userId:'b'}]}).plan.length,0);
assert.equal(engine.daysUntil('2027-03-21T12:00:00', new Date(2027,2,20,12)),1);
console.log('PASS: Jalali/Nowruz, timezones, invite validation, StudyOS priority, account isolation.');
