import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { analyzeProject } from '@lmv/migration-core';
// IO belongs to this research CLI; core receives only filenames and PHP strings.
const inputRoot = process.argv[2];
if (!inputRoot) throw new Error('Usage: node scripts/research-baseline.mjs <sample-root>');
const manifests = JSON.parse(readFileSync(new URL('../docs/research/r1-samples.json', import.meta.url), 'utf8'));
const results = manifests.map(sample => {
  const root = resolve(inputRoot, sample.id);
  const sources = new Map(sample.files.map(file => {
    assert(!file.path.split('/').includes('..') && !file.path.startsWith('/'), 'Unsafe manifest path');
    const content = readFileSync(join(root, file.path));
    assert.equal(createHash('sha256').update(content).digest('hex'), file.sha256, `Source changed: ${sample.id}/${file.path}`);
    return [file.path, content.toString('utf8')];
  }));
  const files = sample.paths.filter(path => path.startsWith('database/migrations/') && path.endsWith('.php'))
    .map(filename => ({ filename, source: sources.get(filename) }));
  assert(files.every(file => typeof file.source === 'string'), 'Missing migration source');
  const start = performance.now();
  const result = analyzeProject(files);
  const elapsedMs = Math.round(performance.now() - start);
  const firstFailure = result.migrations.find(step => step.status === 'failed');
  if (firstFailure) {
    assert.notEqual(firstFailure.schemaBefore, null);
    assert.equal(firstFailure.schemaAfter, null);
    assert.equal(firstFailure.diff, null);
    for (const step of result.migrations.slice(result.migrations.indexOf(firstFailure) + 1)) {
      assert.equal(step.status, 'blocked');
      assert.equal(step.schemaBefore, null); assert.equal(step.schemaAfter, null); assert.equal(step.diff, null);
    }
    assert.equal(result.finalSchema, null);
  }
  return {
    id: sample.id, repo: sample.repo, commit: sample.commit, lockedLaravel: sample.lockedLaravel,
    inputScope: 'Unmodified checked-in PHP migrations only; schema dumps are not parsed. Empty initial schema.',
    complete: result.complete, appliedCount: result.appliedCount,
    counts: Object.fromEntries(['applied', 'failed', 'blocked'].map(status => [status, result.migrations.filter(step => step.status === status).length])),
    finalSchemaKnown: result.finalSchema !== null, lastValidTables: Object.keys(result.lastValidSchema.tables),
    firstFailure: firstFailure ? { filename: firstFailure.filename, beforeTables: Object.keys(firstFailure.schemaBefore.tables), diagnostics: firstFailure.diagnostics, operations: firstFailure.analysis.operations } : null,
    successfulPrefix: result.migrations.filter(step => step.status === 'applied').map(step => ({ filename: step.filename, operations: step.analysis.operations, diff: step.diff, tablesAfter: Object.keys(step.schemaAfter.tables) })),
    steps: result.migrations.map(step => ({ filename: step.filename, status: step.status, analysisComplete: step.analysis.complete, analysisDiagnostics: step.analysis.diagnostics, diagnostics: step.diagnostics })),
    observation: { elapsedMs, node: process.version, platform: process.platform, note: 'Single-run observation, not a performance guarantee.' },
  };
});
const coreVersion = JSON.parse(readFileSync(new URL('../packages/migration-core/package.json', import.meta.url),'utf8')).version;
console.log(JSON.stringify({ coreVersion, results }, null, 2));
