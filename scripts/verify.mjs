import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
let commit = null;
let clean = false;
try {
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  if (resolve(git(['rev-parse', '--show-toplevel'])) === resolve(root)) {
    commit = git(['rev-parse', 'HEAD']);
    clean = !git(['status', '--porcelain']);
  }
} catch { /* Source archives can verify without Git history; they cannot create release bundles. */ }
const commands = ['test', 'typecheck', 'build', ...Object.keys(pkg.scripts).filter(name => name.startsWith('demo:'))];
const report = { productVersion: pkg.version, commit, clean, node: process.version, platform: process.platform,
  startedAt: new Date().toISOString(), commands: [] };
mkdirSync(new URL('../artifacts/', import.meta.url), { recursive: true });
for (const command of commands) {
  console.log(`\n[verify] npm run ${command}`);
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', command], { cwd: root, stdio: 'inherit' });
  report.commands.push({ command, exitCode: result.status, error: result.error?.message });
  writeFileSync(new URL('../artifacts/verification.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`[verify] ${commands.length} commands passed; evidence: artifacts/verification.json`);
