import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const repository = 'jerryyehself/laravel-migration-visualizer';
const run = (command, args) => execFileSync(command, args, { cwd: root, encoding: 'utf8' }).trim();
const metadata = JSON.parse(run('gh', ['api', `repos/${repository}`]));
if (metadata.private || metadata.owner.login !== 'jerryyehself') throw new Error('Enable the approved public source repository before deploying');
if (run('git', ['status', '--porcelain'])) throw new Error('Commit or preserve local edits before requesting a deployment');
const main = JSON.parse(run('gh', ['api', `repos/${repository}/commits/main`]));
if (run('git', ['rev-parse', 'HEAD']) !== main.sha) throw new Error('Deployment uses remote main; synchronize this checkout first');
const pages = JSON.parse(run('gh', ['api', `repos/${repository}/pages`]));
if (pages.build_type !== 'workflow') throw new Error('Configure GitHub Pages to use GitHub Actions before deploying');
run('gh', ['workflow', 'run', 'pages.yml', '--repo', repository, '--ref', 'main']);
console.log('Pages workflow queued for remote main. Wait for its successful deployment before reporting the site live.');
console.log(`Track: https://github.com/${repository}/actions/workflows/pages.yml`);
console.log('Target: https://jerryyehself.github.io/laravel-migration-visualizer/');
