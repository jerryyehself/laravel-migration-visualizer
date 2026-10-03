import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { analyzeProject } from '@lmv/migration-core';
const root = new URL('../packages/migration-core/tests/fixtures/laravel-12/', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const provenance = JSON.parse(read('provenance.json'));
const result = analyzeProject(provenance.files.map(({ filename }) => ({ filename, source: read(filename) })).reverse());
assert.equal(result.complete, true);
assert.deepEqual(result.diagnostics, []);
assert.equal(Object.keys(result.finalSchema.tables).length, 8);
assert.equal(result.finalSchema.tables.failed_jobs.columns.failed_at.useCurrent, true);
assert.equal(Object.values(result.finalSchema.tables).flatMap(t => Object.values(t.foreignKeys)).length, 0);
assert.deepEqual(result.migrations.map(m => Object.keys(m.schemaAfter.tables).length), [3, 5, 8]);
console.log(JSON.stringify({ commit: provenance.commit, complete: result.complete, appliedCount: result.appliedCount,
  migrations: result.migrations.map(m => ({ filename: m.filename, beforeTables: Object.keys(m.schemaBefore.tables).length, afterTables: Object.keys(m.schemaAfter.tables).length })),
  tables: Object.keys(result.finalSchema.tables), foreignKeyCount: 0, failedAt: result.finalSchema.tables.failed_jobs.columns.failed_at,
  scope: 'Only these three pinned official Laravel 12 migrations; not universal Laravel compatibility.' }, null, 2));
