const fs = require('fs');
const path = require('path');

const root = process.cwd();
const mainPath = path.join(root, 'src', 'main.tsx');
if (!fs.existsSync(mainPath)) {
  console.error('ERROR: src/main.tsx not found.');
  process.exit(1);
}

let main = fs.readFileSync(mainPath, 'utf8');
const mobileImport = "import './mobile-final-v12.css';";
const mobileImportDouble = 'import "./mobile-final-v12.css";';
main = main.split(mobileImport).join('');
main = main.split(mobileImportDouble).join('');
main = main.replace(/\n{3,}/g, '\n\n');
const stylesLine = "import './styles.css';";
if (main.includes(stylesLine)) main = main.replace(stylesLine, `${stylesLine}\n${mobileImport}`);
else main = `${mobileImport}\n${main}`;
fs.writeFileSync(mainPath, main);
console.log('v12.4 mobile stylesheet is wired after styles.css.');

const workflowsDir = path.join(root, '.github', 'workflows');
if (!fs.existsSync(workflowsDir)) {
  console.error('ERROR: .github/workflows was not found.');
  process.exit(1);
}

const workflowFiles = fs.readdirSync(workflowsDir)
  .filter((name) => /\.ya?ml$/i.test(name))
  .map((name) => path.join(workflowsDir, name));
const targets = workflowFiles.filter((file) => /npm\s+(?:run\s+)?build|vite\s+build|npm\.cmd\s+run\s+build/i.test(fs.readFileSync(file, 'utf8')));
if (!targets.length) {
  console.error('ERROR: No GitHub Actions workflow containing a production build step was found.');
  process.exit(1);
}

function injectWorkflowEnv(source) {
  const urlRef = '${{ secrets.VITE_SUPABASE_URL }}';
  const keyRef = '${{ secrets.VITE_SUPABASE_ANON_KEY }}';
  const hasUrl = /VITE_SUPABASE_URL\s*:/.test(source);
  const hasKey = /VITE_SUPABASE_ANON_KEY\s*:/.test(source);
  if (hasUrl && hasKey) return source;
  const jobsMatch = source.match(/^jobs:\s*$/m);
  if (!jobsMatch || jobsMatch.index == null) throw new Error('Workflow has no top-level jobs: block.');
  const beforeJobs = source.slice(0, jobsMatch.index);
  const topEnv = beforeJobs.match(/^env:\s*$/m);
  if (topEnv && topEnv.index != null) {
    const insertAt = topEnv.index + topEnv[0].length;
    const additions = [];
    if (!hasUrl) additions.push(`  VITE_SUPABASE_URL: ${urlRef}`);
    if (!hasKey) additions.push(`  VITE_SUPABASE_ANON_KEY: ${keyRef}`);
    return source.slice(0, insertAt) + '\n' + additions.join('\n') + source.slice(insertAt);
  }
  const lines = ['env:'];
  if (!hasUrl) lines.push(`  VITE_SUPABASE_URL: ${urlRef}`);
  if (!hasKey) lines.push(`  VITE_SUPABASE_ANON_KEY: ${keyRef}`);
  return source.slice(0, jobsMatch.index) + lines.join('\n') + '\n\n' + source.slice(jobsMatch.index);
}

for (const file of targets) {
  const original = fs.readFileSync(file, 'utf8');
  const updated = injectWorkflowEnv(original);
  fs.writeFileSync(file, updated);
  console.log(`Supabase production env verified in ${path.relative(root, file)}.`);
}

console.log('StudyFlow v12.4 phone UX configuration complete.');
