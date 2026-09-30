import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeMigration, analyzeProject, applyOperations, diffSchemas, emptySchema, type MigrationFile } from '../src/index.js';
const wrap = (body: string) => `<?php return new class extends Migration { function up() { Schema::create('users', function($t) { ${body} }); } };`;
const analyze = (body: string) => analyzeMigration(wrap(body));
const replay = (body: string) => {
  const result = analyze(body);
  expect(result.diagnostics).toEqual([]);
  return applyOperations(emptySchema(), result.operations);
};
const read = (name: string) => readFileSync(new URL(`./fixtures/indexes/${name}`, import.meta.url), 'utf8');
const fixture = (filename: string): MigrationFile => ({ filename, source: read(filename) });
const create = '2026_02_01_000000_create_accounts.php';
const update = '2026_02_02_000000_update_accounts.php';
const primary = '2026_02_03_000000_primary_accounts.php';
const invalid = '2026_02_02_000000_invalid_index.php';

// Golden projection intentionally focuses on index lifecycle and trust boundaries;
// the existing project goldens continue to cover full operations/snapshots/locations.
function projectSummary(files: MigrationFile[]) {
  const result = analyzeProject(files);
  const summary = (schema: typeof result.finalSchema) => schema === null ? null : Object.fromEntries(Object.entries(schema.tables).map(([name, table]) => [name, {
    indexes: table.indexes,
    primaryColumns: Object.values(table.columns).filter(column => column.primary).map(column => column.name).sort(),
  }]));
  return {
    complete: result.complete, appliedCount: result.appliedCount,
    diagnostics: result.diagnostics.map(d => ({ phase: d.phase, code: d.code, file: d.source.file, line: d.source.line, ...(d.operationIndex !== undefined ? { operationIndex: d.operationIndex } : {}) })),
    migrations: result.migrations.map(step => ({ filename: step.filename, status: step.status, before: summary(step.schemaBefore), after: summary(step.schemaAfter), indexChanges: step.diff === null ? null : step.diff.changes.filter(change => change.kind.startsWith('index')) })),
    final: summary(result.finalSchema), lastValid: summary(result.lastValidSchema),
  };
}

describe('index normalization', () => {
  it.each(['index', 'unique', 'primary'])('supports standalone single and composite %s', type => {
    const result = analyze(`$t->string('a'); $t->string('b'); $t->${type}(['a', 'b'], 'custom');`);
    expect(result.complete).toBe(true);
    expect(result.operations.at(-1)).toMatchObject({ kind: 'addIndex', index: { name: 'custom', type, columns: ['a', 'b'] } });
    expect(analyze(`$t->string('a'); $t->${type}('a', null);`).operations.at(-1)).toMatchObject({ index: { name: `users_a_${type}` } });
  });
  it.each(['index', 'unique', 'primary'])('supports fluent %s with automatic/explicit names', type => {
    expect(analyze(`$t->string('a')->${type}();`).operations.at(-1)).toMatchObject({ kind: 'addIndex', index: { name: `users_a_${type}`, type, columns: ['a'] } });
    expect(analyze(`$t->string('a')->nullable()->${type}('custom')->comment('ok');`).operations.at(-1)).toMatchObject({ index: { name: 'custom' } });
    expect(analyze(`$t->string('a')->${type}(true);`).complete).toBe(true);
  });
  it('defers fluent indexes until the end of the closure, retaining statement source', () => {
    const result = analyze("$t->string('a')->unique(); $t->string('b');");
    expect(result.operations.map(op => op.kind)).toEqual(['createTable', 'addColumn', 'addColumn', 'addIndex']);
    expect(result.operations[3].source).toEqual(result.operations[1].source);
  });
  it.each(['index', 'unique', 'primary'])('does not create a fluent %s for an explicit null', type => {
    const result = analyze(`$t->string('a')->${type}(null)->nullable();`);
    expect(result.complete).toBe(true);
    expect(result.operations.map(op => op.kind)).toEqual(['createTable', 'addColumn']);
    const state = applyOperations(emptySchema(), result.operations);
    expect(state.tables.users.indexes).toEqual({});
    expect(state.tables.users.columns.a).toEqual({ name:'a', type:'string', length:255, nullable:true });
  });
  it('keeps the implicit id primary when a fluent primary is explicitly null', () => {
    const state = replay('$t->id()->primary(null);');
    expect(state.tables.users.indexes).toEqual({ users_id_primary: { name:'users_id_primary', type:'primary', columns:['id'] } });
  });
  it('keeps project snapshots and diff free of a fluent null index', () => {
    const result = analyzeProject([
      { filename:'2026_03_01_000000_create_users.php', source:wrap("$t->string('a');") },
      { filename:'2026_03_02_000000_add_email.php', source:wrap("$t->string('email')->unique(null);").replace("Schema::create", "Schema::table") },
    ]);
    expect(result.complete).toBe(true);
    expect(result.migrations[1].schemaBefore?.tables.users.indexes).toEqual({});
    expect(result.migrations[1].schemaAfter?.tables.users.indexes).toEqual({});
    expect(result.migrations[1].diff?.changes.map(change => change.kind)).toEqual(['columnAdded']);
    expect(result.finalSchema?.tables.users.indexes).toEqual({});
  });
  it('uses Laravel default name normalization without a connection prefix', () => {
    const result = analyzeMigration(wrap("$t->string('Email'); $t->index('Email');").replace("'users'", "'Org.Users-Archive'"));
    expect(result.operations.at(-1)).toMatchObject({ index: { name: 'org_users_archive_email_index' } });
  });
  it('supports long arrays and conventional drop names', () => {
    const result = analyze("$t->index(array('a','b')); $t->dropIndex(['a','b']); $t->dropUnique('custom'); $t->dropPrimary(); $t->dropPrimary(null); $t->dropPrimary(['a','b']);");
    expect(result.complete).toBe(true);
    expect(result.operations.slice(2)).toMatchObject([
      { kind:'dropIndex', name:'users_a_b_index', indexType:'index' },
      { kind:'dropIndex', name:'custom', indexType:'unique' },
      { kind:'dropIndex', name:null, indexType:'primary' },
      { kind:'dropIndex', name:null, indexType:'primary' },
      { kind:'dropIndex', name:'users_a_b_primary', indexType:'primary' },
    ]);
  });
  it.each([
    "$t->index([]);", "$t->index(['a','a']);", "$t->index(['a', $dynamic]);", "$t->index(['key' => 'a']);",
    "$t->index(['a', ...$names]);", "$t->index('a', 'name', 'btree');", "$t->index('a')->algorithm('btree');",
    "$t->string('a')->unique(false);", "$t->string('a')->index()->unique();", "$t->string('a')->unique()->change();",
    "$t->id()->primary();", "$t->dropIndex();", "$t->dropUnique(null);", "$t->string('a')->default(['x']);",
  ])('rejects unsupported index statements atomically: %s', body => {
    const result = analyze(body);
    expect(result.complete).toBe(false);
    expect(result.operations).toHaveLength(1);
  });
});

describe('index schema invariants', () => {
  it('creates an implicit primary index for id, increments and bigIncrements', () => {
    for (const method of ['id', 'increments', 'bigIncrements']) {
      const state = replay(`$t->${method}('key');`);
      expect(state.tables.users.indexes).toEqual({ users_key_primary: { name:'users_key_primary', type:'primary', columns:['key'] } });
      expect(state.tables.users.columns.key.primary).toBe(true);
    }
  });
  it('can drop the implicit primary and replace it with a composite primary', () => {
    const state = replay("$t->id(); $t->string('a'); $t->string('b'); $t->dropPrimary(); $t->primary(['a','b'], 'custom');");
    expect(state.tables.users.columns.id.primary).toBeUndefined();
    expect(state.tables.users.columns.a.primary).toBe(true);
    expect(state.tables.users.columns.b.primary).toBe(true);
    expect(Object.keys(state.tables.users.indexes)).toEqual(['custom']);
  });
  it.each([
    ["$t->string('a'); $t->index('missing');", 'Unknown index column'],
    ["$t->string('a'); $t->index('a','same'); $t->unique('a','same');", 'Index already exists'],
    ["$t->id(); $t->string('a'); $t->primary('a');", 'already has a primary'],
    ["$t->dropIndex('missing');", 'Unknown index'],
    ["$t->string('a'); $t->unique('a','custom'); $t->dropIndex('custom');", 'type mismatch'],
    ["$t->string('a'); $t->index('a'); $t->dropColumn('a');", 'Drop indexes'],
  ])('rejects invalid replay: %s', (body, message) => {
    expect(() => replay(body)).toThrow(message);
  });
  it('allows a referenced column to be dropped after its index is removed', () => {
    expect(replay("$t->string('a'); $t->index('a'); $t->dropIndex(['a']); $t->dropColumn('a');").tables.users).toMatchObject({ columns:{}, indexes:{} });
  });
  it('renames index column references without renaming index identity', () => {
    const state = replay("$t->string('a'); $t->index('a'); $t->renameColumn('a','b');");
    expect(state.tables.users.indexes.users_a_index.columns).toEqual(['b']);
    expect(() => applyOperations(state, analyze("$t->dropIndex(['b']);").operations.slice(1))).toThrow('Unknown index');
  });
  it('keeps input indexes unchanged on failure', () => {
    const initial = replay("$t->id(); $t->string('email')->unique();");
    const original = structuredClone(initial);
    expect(() => applyOperations(initial, analyze("$t->dropUnique(['email']); $t->index('missing');").operations.slice(1))).toThrow();
    expect(initial).toEqual(original);
  });
  it('handles prototype-like index identifiers safely', () => {
    const state = replay("$t->string('__proto__'); $t->unique('__proto__','constructor'); $t->index('__proto__','__proto__');");
    expect(Object.keys(state.tables.users.indexes)).toEqual(['constructor','__proto__']);
    expect(state.tables.users.indexes.__proto__.columns).toEqual(['__proto__']);
  });
});

describe('index diff and project goldens', () => {
  it('detects index column order and type changes without mutating either input', () => {
    const before = replay("$t->string('a'); $t->string('b'); $t->index(['a','b'],'lookup');");
    const after = structuredClone(before);
    after.tables.users.indexes.lookup.columns.reverse();
    after.tables.users.indexes.lookup.type = 'unique';
    const diff = diffSchemas(before, after);
    expect(diff.changes).toEqual([{kind:'indexChanged',table:'users',index:'lookup',before:before.tables.users.indexes.lookup,after:after.tables.users.indexes.lookup}]);
    if (diff.changes[0].kind !== 'indexChanged') throw new Error('Expected index change');
    diff.changes[0].before.columns.push('other');
    expect(before.tables.users.indexes.lookup.columns).toEqual(['a','b']);
  });
  it('ignores index map insertion order and reports removals/additions structurally', () => {
    const before = replay("$t->string('a'); $t->index('a','first'); $t->unique('a','second');");
    const reordered = structuredClone(before);
    reordered.tables.users.indexes = Object.fromEntries(Object.entries(reordered.tables.users.indexes).reverse());
    expect(diffSchemas(before,reordered).changes).toEqual([]);
    delete reordered.tables.users.indexes.first;
    reordered.tables.users.indexes.third = {name:'third',type:'index',columns:['a']};
    expect(diffSchemas(before,reordered).changes.map(change => change.kind)).toEqual(['indexRemoved','indexAdded']);
  });
  it('compares net structure after temporary index creation and removal', () => {
    const before = replay("$t->string('a');");
    const after = applyOperations(before, analyze("$t->index('a'); $t->dropIndex(['a']);").operations.slice(1));
    expect(diffSchemas(before,after).changes).toEqual([]);
  });
  it('matches successful three-file snapshots and index lifecycle golden', () => {
    expect(projectSummary([fixture(primary),fixture(create),fixture(update)])).toEqual(JSON.parse(read('success.golden.json')));
  });
  it('matches failure rollback and unknown downstream snapshots golden', () => {
    expect(projectSummary([fixture(primary),fixture(invalid),fixture(create)])).toEqual(JSON.parse(read('blocked.golden.json')));
  });
});
