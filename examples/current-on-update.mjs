import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeProject } from '@lmv/migration-core';

const root = new URL('../packages/migration-core/tests/fixtures/current-on-update/', import.meta.url);
const load = filename => ({ filename, source: readFileSync(new URL(filename, root), 'utf8') });
const first = '2026_08_01_000000_create_events.php', second = '2026_08_02_000000_update_events.php', third = '2026_08_03_000000_reset_events.php';
const success = analyzeProject([third, second, first].map(load));
assert.equal(success.complete, true);
assert.equal(success.appliedCount, 3);
assert.deepEqual(success.diagnostics, []);
const updated = success.migrations[1].schemaAfter.tables.events.columns;
assert.equal(updated.at.useCurrentOnUpdate, true);
assert.equal(updated.at.default, null);
assert.equal(Object.hasOwn(updated.at, 'useCurrent'), false);
assert.equal(updated.zoned.useCurrent, true);
assert.equal(updated.zoned.useCurrentOnUpdate, true);
assert.deepEqual(success.migrations[1].analysis.operations.map(o => o.kind), ['changeColumn', 'addColumn']);
assert.deepEqual(success.migrations[1].diff.changes.map(c => c.kind), ['columnChanged', 'columnAdded']);
assert.deepEqual(success.migrations[2].diff.changes.map(c => c.kind), ['columnChanged', 'columnChanged']);
for (const column of Object.values(success.finalSchema.tables.events.columns)) {
  assert.equal(Object.hasOwn(column, 'useCurrentOnUpdate'), false);
  assert.equal(Object.hasOwn(column, 'useCurrent'), false);
}
assert.deepEqual(success.finalSchema.tables.events.indexes, success.migrations[0].schemaAfter.tables.events.indexes);
const blocked = analyzeProject([third, '2026_08_02_000000_bad_events.php', first].map(load));
assert.equal(blocked.complete, false);
assert.equal(blocked.finalSchema, null);
assert.equal(blocked.appliedCount, 1);
assert.deepEqual(blocked.migrations.map(m => m.status), ['applied', 'failed', 'blocked']);
assert.equal(blocked.migrations[1].analysis.operations[0].column.useCurrentOnUpdate, true);
assert.equal(Object.hasOwn(blocked.lastValidSchema.tables.events.columns, 'partial'), false);
assert.equal(blocked.migrations[1].schemaAfter, null);
assert.equal(blocked.migrations[2].schemaBefore, null);
assert.equal(blocked.migrations[2].diff, null);
console.log(JSON.stringify({ complete: success.complete, appliedCount: success.appliedCount, updatedColumns: updated,
  resetColumns: success.finalSchema.tables.events.columns, blockedStatuses: blocked.migrations.map(m => m.status),
  scope: 'Static current-time intent metadata, not PHP or database execution.' }, null, 2));
