import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeMigration, analyzeProject, applyOperations, diffSchemas, SchemaReplayError, type AtomicOperation } from '../src/index.js';
const php = (body: string, method = 'table', table = 'users') => "<?php return new class extends Migration { function up() { Schema::" + method + "('" + table + "', function($t) { " + body + " }); } };";
const file = (day: number, body: string, method = 'table') => ({ filename: '2026_09_0' + day + '_000000_users.php', source: php(body, method) });
const initial = (type = 'index') => analyzeProject([file(1, "$t->id(); $t->string('a'); $t->string('b'); $t->" + type + "(['b','a'], 'old');", 'create')]).finalSchema!;
const rename = (from: string, to: string, table = 'users'): AtomicOperation => ({ kind: 'renameIndex', table, from, to, source: { file: 'manual.php', line: 5, column: 2 } });

describe('explicit ordinary index rename', () => {
  it('normalizes exactly two names with the statement source', () => {
    const result = analyzeMigration(php("$t->renameIndex('old', 'new');"), 'input.php');
    expect(result.complete).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.operations).toMatchObject([{ kind: 'renameIndex', table: 'users', from: 'old', to: 'new', source: { file: 'input.php', line: 1 } }]);
  });
  it.each(['index', 'unique'])('renames %s without changing column order, type or primary metadata', type => {
    const before = initial(type), original = structuredClone(before);
    const result = analyzeProject([file(2, "$t->renameIndex('old','new');")], { initialSchema: before });
    expect(result.complete).toBe(true);
    expect(result.finalSchema!.tables.users.indexes.new).toEqual({ name: 'new', type, columns: ['b','a'] });
    expect(result.finalSchema!.tables.users.indexes).not.toHaveProperty('old');
    expect(result.finalSchema!.tables.users.columns).toEqual(before.tables.users.columns);
    expect(result.finalSchema!.tables.users.indexes.users_id_primary).toEqual(before.tables.users.indexes.users_id_primary);
    expect(result.migrations[0].diff!.changes).toEqual([
      { kind: 'indexAdded', table: 'users', index: 'new', after: { name: 'new', type, columns: ['b','a'] } },
      { kind: 'indexRemoved', table: 'users', index: 'old', before: { name: 'old', type, columns: ['b','a'] } },
    ]);
    expect(before).toEqual(original);
  });
  it.each(["", "'old'", "'old','new','extra'", "null,'new'", "'old',false", "['a'],'new'", "'old',''", "'','new'", "$from,'new'"])('rejects invalid rename arguments: %s', args => {
    const result = analyzeMigration(php('$t->renameIndex(' + args + ');'));
    expect(result.complete).toBe(false);
    expect(result.operations).toEqual([]);
    expect(result.diagnostics.map(d => d.code)).toEqual(['UNSUPPORTED_BLUEPRINT']);
  });
  it.each(["$t->renameIndex('old','new')->comment('x');", "$t->string('a')->renameIndex('old','new');", "$t->renameIndex('old','new')->change();"])('rejects fluent or chained rename syntax: %s', body => {
    const result = analyzeMigration(php(body));
    expect(result.complete).toBe(false);
    expect(result.operations).toEqual([]);
  });
  it('rejects rename inside Schema::create', () => {
    const result = analyzeMigration(php("$t->renameIndex('old','new');", 'create'));
    expect(result.complete).toBe(false);
    expect(result.operations.map(op => op.kind)).toEqual(['createTable']);
  });
  it.each([
    { from: 'missing', to: 'new', table: 'users', error: 'Unknown index' },
    { from: 'old', to: 'users_id_primary', table: 'users', error: 'Index already exists' },
    { from: 'old', to: 'old', table: 'users', error: 'Index already exists' },
    { from: 'old', to: 'new', table: 'missing', error: 'Unknown table' },
    { from: 'users_id_primary', to: 'new', table: 'users', error: 'primary' },
    { from: '', to: 'new', table: 'users', error: 'non-empty' },
    { from: 'old', to: '', table: 'users', error: 'non-empty' },
  ])('rejects public replay $from → $to in $table without changing input', ({ from, to, table, error }) => {
    const before = initial(), original = structuredClone(before);
    const op = rename(from, to, table);
    expect(() => applyOperations(before, [op])).toThrow(error);
    expect(before).toEqual(original);
    try { applyOperations(before, [op]); } catch (failure) {
      expect(failure).toBeInstanceOf(SchemaReplayError);
      expect(failure).toMatchObject({ operationIndex: 0, source: op.source });
    }
  });
  it('keeps unknown rename atomic and blocks later snapshots', () => {
    const result = analyzeProject([
      file(1, "$t->string('a')->index('old');", 'create'),
      file(2, "$t->renameIndex('old','partial'); $t->renameIndex('missing','new');"),
      file(3, "$t->string('later');"),
    ]);
    expect(result.migrations.map(m => m.status)).toEqual(['applied', 'failed', 'blocked']);
    expect(result.finalSchema).toBeNull();
    expect(Object.keys(result.lastValidSchema.tables.users.indexes)).toEqual(['old']);
    expect(result.migrations[1].schemaBefore).toEqual(result.lastValidSchema);
    expect(result.migrations[1].schemaAfter).toBeNull();
    expect(result.migrations[1].diff).toBeNull();
    expect(result.migrations[2].schemaBefore).toBeNull();
    expect(result.migrations[2].schemaAfter).toBeNull();
    expect(result.migrations[2].diff).toBeNull();
    expect(result.diagnostics.map(d => d.code)).toEqual(['SCHEMA_REPLAY_ERROR', 'SCHEMA_BLOCKED']);
    expect(result.diagnostics[0]).toMatchObject({ phase: 'replay', operationIndex: 1, source: { file: file(2, '').filename } });
  });
  it('supports rename followed by a drop under the new name', () => {
    const result = analyzeProject([file(2, "$t->renameIndex('old','new'); $t->dropUnique('new');")], { initialSchema: initial('unique') });
    expect(result.complete).toBe(true);
    expect(Object.keys(result.finalSchema!.tables.users.indexes)).toEqual(['users_id_primary']);
    expect(result.migrations[0].diff!.changes.map(c => c.kind)).toEqual(['indexRemoved']);
  });
  it('does not implicitly discover the old index by its column name', () => {
    const result = analyzeProject([file(2, "$t->renameIndex('a','new');")], { initialSchema: initial() });
    expect(result.complete).toBe(false);
    expect(result.lastValidSchema.tables.users.indexes.old).toBeDefined();
  });
  it('handles special names without prototype collisions', () => {
    const before = initial();
    const after = applyOperations(before, [rename('old', '__proto__'), rename('__proto__', 'constructor')]);
    expect(Object.hasOwn(after.tables.users.indexes, 'constructor')).toBe(true);
    expect(after.tables.users.indexes.constructor).toEqual({ name: 'constructor', type: 'index', columns: ['b','a'] });
    expect(Object.hasOwn(after.tables.users.indexes, '__proto__')).toBe(false);
    expect(before.tables.users.indexes.old.name).toBe('old');
  });
  it('preserves foreign key metadata when renaming an ordinary index', () => {
    const before = analyzeProject([file(1, "$t->integer('key'); $t->integer('parent'); $t->index('parent','old'); $t->foreign('parent')->references('key')->on('users');", 'create')]).finalSchema!;
    const result = analyzeProject([file(2, "$t->renameIndex('old','new');")], { initialSchema: before });
    expect(result.complete).toBe(true);
    expect(result.finalSchema!.tables.users.foreignKeys).toEqual(before.tables.users.foreignKeys);
    expect(result.finalSchema!.tables.users.columns).toEqual(before.tables.users.columns);
  });
  it('isolates renamed index arrays in replay, snapshots and diff payloads', () => {
    const before = initial();
    const after = applyOperations(before, [rename('old','new')]);
    after.tables.users.indexes.new.columns[0] = 'mutated';
    expect(before.tables.users.indexes.old.columns).toEqual(['b','a']);
    const result = analyzeProject([file(2, "$t->renameIndex('old','new');")], { initialSchema: before });
    result.migrations[0].schemaAfter!.tables.users.indexes.new.columns[0] = 'snapshot';
    expect(result.finalSchema!.tables.users.indexes.new.columns).toEqual(['b','a']);
    expect(result.migrations[0].diff!.changes.find(change => change.kind === 'indexAdded')).toMatchObject({ after: { columns: ['b','a'] } });
    const diff = diffSchemas(before, result.finalSchema!);
    const added = diff.changes.find(c => c.kind === 'indexAdded');
    if (added?.kind === 'indexAdded') added.after.columns[0] = 'diff';
    expect(result.finalSchema!.tables.users.indexes.new.columns).toEqual(['b','a']);
  });
  it('matches independently authored cross-file success and blocked goldens', () => {
    const root = new URL('./fixtures/rename-index/', import.meta.url);
    const read = (name: string) => readFileSync(new URL(name, root), 'utf8');
    const first = '2026_09_01_000000_create_users.php', second = '2026_09_02_000000_rename_users.php', bad = '2026_09_02_000000_bad_users.php', third = '2026_09_03_000000_drop_users_index.php';
    const project = (names: string[]) => analyzeProject([...names].reverse().map(filename => ({ filename, source: read(filename) })));
    const view = (r: ReturnType<typeof analyzeProject>) => ({ complete: r.complete, appliedCount: r.appliedCount, finalSchema: r.finalSchema, lastValidSchema: r.lastValidSchema, steps: r.migrations.map(m => ({ status: m.status, before: m.schemaBefore, after: m.schemaAfter, diff: m.diff })), diagnosticCodes: r.diagnostics.map(d => d.code) });
    expect(view(project([first, second, third]))).toEqual(JSON.parse(read('success.golden.json')));
    expect(view(project([first, bad, third]))).toEqual(JSON.parse(read('blocked.golden.json')));
  });
});
