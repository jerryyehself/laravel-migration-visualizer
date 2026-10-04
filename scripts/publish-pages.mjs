import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const repository = 'jerryyehself/laravel-migration-visualizer-pages';
const base = '/laravel-migration-visualizer-pages/';
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, stdio: 'inherit' });
const metadata = JSON.parse(execFileSync('gh', ['api', `repos/${repository}`], { encoding: 'utf8' }));
if (metadata.private || metadata.owner.login !== 'jerryyehself') throw new Error('Expected the dedicated public site repository');
run('npm', ['run', 'build', '-w', '@lmv/web', '--', '--base', base]);
const dist = join(root, 'apps/web/dist');
const allowed = ['index.html', 'assets'];
if (readdirSync(dist).some(name => !allowed.includes(name))) throw new Error('Unexpected file in the website build');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
if (!html.includes(`${base}assets/`)) throw new Error('Missing Pages asset base path');
const temporary = mkdtempSync(join(tmpdir(), 'lmv-pages-'));
const checkout = join(temporary, 'site');
try {
  run('git', ['clone', '--depth=1', `https://github.com/${repository}.git`, checkout]);
  if (readdirSync(checkout).some(name => !['.git', 'index.html', 'assets', '.nojekyll'].includes(name))) {
    throw new Error('Unexpected deployment repository content; refusing to replace it');
  }
  // Never copy the source checkout, docs, credentials or conversation backups.
  for (const entry of readdirSync(checkout)) {
    if (entry !== '.git') rmSync(join(checkout, entry), { recursive: true, force: true });
  }
  cpSync(dist, checkout, { recursive: true });
  writeFileSync(join(checkout, '.nojekyll'), '');
  run('git', ['config', 'user.name', 'jerryyehself'], checkout);
  run('git', ['config', 'user.email', '87906523+jerryyehself@users.noreply.github.com'], checkout);
  run('git', ['checkout', '-B', 'main'], checkout);
  run('git', ['add', 'index.html', 'assets', '.nojekyll'], checkout);
  const status = execFileSync('git', ['status', '--porcelain'], { cwd: checkout, encoding: 'utf8' }).trim();
  if (status) {
    run('git', ['commit', '-m', 'Publish Laravel Migration Visualizer website'], checkout);
    run('git', ['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential', 'push', 'origin', 'main'], checkout);
  } else console.log('Website build unchanged; no deployment commit needed');
  console.log('Pages URL: https://jerryyehself.github.io/laravel-migration-visualizer-pages/');
} finally {
  rmSync(temporary, { recursive: true, force: true });
  // Keep the ordinary localhost preview compatible with its root URL.
  run('npm', ['run', 'build', '-w', '@lmv/web']);
}
