'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const readline = require('node:readline');

const root = path.resolve(__dirname,'..');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'release-manifest.json'),'utf8'));
const targetRepo = 'https://github.com/limi-alive/studyflow.git';

function run(program, args, cwd=root) {
  // Node 24 on Windows cannot safely spawn .cmd directly with shell:false.
  const isNpm = program === 'npm.cmd';
  const actual = isNpm && process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : program;
  const actualArgs = isNpm && process.platform === 'win32' ? ['/d','/s','/c',`npm.cmd ${args.join(' ')}`] : args;
  console.log(`\n> ${program} ${args.join(' ')}`);
  const result = cp.spawnSync(actual,actualArgs,{cwd,stdio:'inherit',shell:false,windowsHide:false,env:process.env});
  if (result.error) throw new Error(`Could not start ${program}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${program} failed (exit ${result.status})`);
}
function capture(program, args, cwd=root) {
  const result = cp.spawnSync(program,args,{cwd,encoding:'utf8',shell:false,windowsHide:true});
  if(result.error || result.status!==0) throw new Error(`Failed: ${program} ${args.join(' ')}: ${(result.stderr||result.error?.message||'').slice(0,320)}`);
  return result.stdout.trim();
}
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function validate() {
  for (const [relative, expected] of Object.entries(manifest.files)) {
    const candidate = path.resolve(root,relative);
    if (!candidate.startsWith(root+path.sep) || !fs.existsSync(candidate) || sha256(candidate)!==expected) {
      throw new Error(`Bundle integrity check failed: ${relative}. Re-extract the original ZIP.`);
    }
  }
  if (fs.existsSync(path.join(root,'.env'))) {
    console.log('NOTE: .env is local only; it will NOT be copied or committed.');
  }
  console.log(`PASS: ${Object.keys(manifest.files).length} release files verified; no secrets included.`);
}
function ask(message) {
  return new Promise(resolve => {
    const rl=readline.createInterface({input:process.stdin,output:process.stdout});
    rl.question(message,answer=>{rl.close();resolve(answer.trim());});
  });
}
async function main() {
  process.chdir(root);
  console.log('\n========================================================');
  console.log(' StudyFlow CLEAN v14.0.1 - VERIFY + OPTIONAL REVIEW PUSH');
  console.log('========================================================\n');
  validate();
  if (process.argv.includes('--check-package')) { console.log('PACKAGE_CHECK_PASS'); return; }
  console.log('[1/6] Installing reproducible dependencies...');
  run('npm.cmd',['ci']);
  console.log('[2/6] Linting...');
  run('npm.cmd',['run','lint']);
  console.log('[3/6] Checking TypeScript...');
  run('npm.cmd',['run','typecheck']);
  console.log('[4/6] Running tests...');
  run('npm.cmd',['run','test']);
  run('node',['tools/logic-smoke.cjs']);
  console.log('[5/6] Building production PWA...');
  run('npm.cmd',['run','build']);
  if (!fs.existsSync(path.join(root,'dist','index.html'))) throw new Error('Production build did not create dist/index.html');
  console.log('\nPASS: local source is validated. The original repository has not been touched.');
  const answer = await ask('\nPublish a NEW review branch to GitHub? Type YES to proceed, or press Enter to stop: ');
  if (answer !== 'YES') { console.log('\nLocal validation complete. No Git push made.'); return; }
  console.log('[6/6] Verifying remote main and publishing a review branch...');
  const remoteMain = capture('git',['ls-remote',targetRepo,'refs/heads/main']).split(/\s+/)[0];
  if (remoteMain !== manifest.baseCommit) throw new Error(`Remote main changed. Expected ${manifest.baseCommit.slice(0,8)}, got ${remoteMain.slice(0,8)}. No publish. Ask for a rebased release.`);
  const checkout = fs.mkdtempSync(path.join(os.tmpdir(),'studyflow-clean-review-'));
  // Use a fresh checkout, never mutate the owner's existing Windows repository.
  const clone = path.join(checkout,'repo');
  run('git',['clone','--quiet','--single-branch','--branch','main',targetRepo,clone],root);
  const sha = capture('git',['rev-parse','HEAD'],clone);
  if (sha!==manifest.baseCommit) throw new Error('Fresh checkout does not match release base. No publish.');
  const branch = 'feature/studyflow-clean-14-0-1-'+new Date().toISOString().replace(/\D/g,'').slice(0,14);
  run('git',['switch','-c',branch],clone);
  for (const relative of Object.keys(manifest.files)) {
    const src=path.join(root,relative), dst=path.join(clone,relative);
    fs.mkdirSync(path.dirname(dst),{recursive:true});
    fs.copyFileSync(src,dst);
  }
  // Remove only retired tracked deployment helpers. The archive retains Git history.
  const retired=['APPLY_LATEST.cmd','apply-latest.cjs','verify-mobile-v12-3.cjs','verify-mobile-v12-4.cjs','verify-v13-4.cjs','verify-v13-5.cjs'];
  run('git',['rm','-q','--ignore-unmatch','--',...retired],clone);
  const paths=Object.keys(manifest.files);
  run('git',['add','--',...paths],clone);
  const staged=capture('git',['diff','--cached','--name-only'],clone);
  if (!staged) { console.log('No changes to publish.'); return; }
  const disallowed=staged.split('\n').some(p=>p.startsWith('.env')&&p!=='.env.example');
  if(disallowed) throw new Error('Unexpected secret candidate staged. Review stopped.');
  run('git',['commit','-m','Consolidate StudyFlow 14.0.1 from verified clean source'],clone);
  run('git',['push','-u','origin',branch],clone);
  console.log('\nSUCCESS: Review branch pushed. MAIN WAS NOT CHANGED.');
  console.log(`Open PR: https://github.com/limi-alive/studyflow/compare/main...${branch}?expand=1`);
  console.log(`Review checkout: ${clone}`);
  console.log('Merge only after GitHub Actions pass and you review the diff.');
}
main().catch(err=>{console.error(`\nSTOPPED: ${err.message}`);console.error('No automatic merge or database change occurred.');process.exitCode=1;});
