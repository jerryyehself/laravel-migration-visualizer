import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = process.argv[2];
if (!root) throw new Error('Usage: node scripts/fetch-research-samples.mjs <sample-root> (requires authenticated gh)');
const exec = promisify(execFile);
const samples = JSON.parse(readFileSync(new URL('../docs/research/r1-samples.json', import.meta.url), 'utf8'));
const pending = samples.flatMap(sample => sample.files.map(file => ({ sample, file })));
await Promise.all(Array.from({ length: 4 }, async () => {
  while (pending.length) {
    const { sample, file } = pending.shift();
    assert(!file.path.startsWith('/') && !file.path.split('/').includes('..'), 'Unsafe path');
    const { stdout } = await exec('gh', ['api', `repos/${sample.repo}/contents/${file.path}?ref=${sample.commit}`], { maxBuffer: 16 * 1024 * 1024 });
    const content = Buffer.from(JSON.parse(stdout).content, 'base64');
    assert.equal(createHash('sha256').update(content).digest('hex'), file.sha256, `Source mismatch: ${sample.id}/${file.path}`);
    const destination = resolve(root, sample.id, file.path);
    await mkdir(join(destination, '..'), { recursive: true });
    await writeFile(destination, content);
  }
}));
console.log(`Fetched and verified ${samples.reduce((sum, sample) => sum + sample.files.length, 0)} files from pinned commits.`);
