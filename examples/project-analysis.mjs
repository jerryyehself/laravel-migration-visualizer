// IO stays in this Node adapter. The same core API can be called by a browser UI.
import { readFileSync } from 'node:fs';
import { analyzeProject } from '@lmv/migration-core';
const filenames = [
  '2026_01_03_000000_revise_users.php',
  '2026_01_01_000000_create_users.php',
  '2026_01_02_000000_update_users.php',
];
const files = filenames.map(filename => ({
  filename,
  source: readFileSync(new URL(`../packages/migration-core/tests/fixtures/project/${filename}`, import.meta.url), 'utf8'),
}));
const result = analyzeProject(files);
console.log(JSON.stringify(result, null, 2));
if (!result.complete) process.exitCode = 1;
