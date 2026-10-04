import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, readdirSync, rmSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const product = JSON.parse(readFileSync(join(root, 'package.json')));
const core = JSON.parse(readFileSync(join(root, 'packages/migration-core/package.json')));
const web = JSON.parse(readFileSync(join(root, 'apps/web/package.json')));
if (resolve(git(['rev-parse', '--show-toplevel'])) !== resolve(root)) throw new Error('Release requires this repository Git checkout');
if (!/^\d+\.\d+\.\d+$/.test(product.version) || product.version !== web.version) throw new Error('Product/web release versions must match');
if (git(['status', '--porcelain'])) throw new Error('Release requires a clean checkout; commit or preserve pending work first');
const commit = git(['rev-parse', 'HEAD']);
const verification = JSON.parse(readFileSync(join(root, 'artifacts/verification.json')));
const expected = ['test', 'typecheck', 'build', ...Object.keys(product.scripts).filter(name => name.startsWith('demo:'))];
if (verification.commit !== commit || !verification.clean || verification.productVersion !== product.version ||
    JSON.stringify(verification.commands.map(item => item.command)) !== JSON.stringify(expected) ||
    verification.commands.some(item => item.exitCode !== 0)) throw new Error('Run npm run verify on this clean HEAD before bundling');
const prefix = `laravel-migration-visualizer-v${product.version}`;
const temporary = mkdtempSync(join(tmpdir(), 'lmv-release-'));
const stage = join(temporary, prefix);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
try {
  mkdirSync(join(stage, 'source'), { recursive: true });
  const sourceTar = join(temporary, 'source.tar');
  execFileSync('git', ['archive', '--format=tar', '-o', sourceTar, commit], { cwd: root });
  execFileSync('tar', ['-xf', sourceTar, '-C', join(stage, 'source')], { env: { ...process.env, COPYFILE_DISABLE: '1' } });
  cpSync(join(root, 'apps/web/dist'), join(stage, 'web'), { recursive: true });
  cpSync(join(root, 'artifacts/verification.json'), join(stage, 'verification.json'));
  cpSync(join(root, 'docs/user-guide.zh-TW.md'), join(stage, 'README.zh-TW.md'));
  const files = {};
  function visit(dir) {
    for (const item of readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      const path = join(dir, item.name);
      if (item.isDirectory()) visit(path);
      else if (item.isFile()) files[relative(stage, path).replaceAll('\\', '/')] = hash(readFileSync(path));
      else throw new Error(`Unexpected non-file release entry: ${path}`);
    }
  }
  visit(stage);
  writeFileSync(join(stage, 'manifest.json'), JSON.stringify({ productVersion: product.version, coreVersion: core.version,
    commit, node: process.version, generatedAt: new Date().toISOString(), files }, null, 2) + '\n');
  const archive = join(root, 'artifacts', `${prefix}.tar.gz`);
  execFileSync('tar', ['-czf', archive, '-C', temporary, prefix], { env: { ...process.env, COPYFILE_DISABLE: '1' } });
  writeFileSync(archive + '.sha256', `${hash(readFileSync(archive))}  ${prefix}.tar.gz\n`);
  console.log(`Release: ${archive}\nCommit: ${commit}\n${Object.keys(files).length} files hashed; no node_modules or Git credentials included`);
} finally { rmSync(temporary, { recursive: true, force: true }); }
