import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeProject, diffSchemas, emptySchema, orderMigrations, type MigrationFile, type SchemaState } from '../src/index.js';
const read = (name: string) => readFileSync(new URL(`./fixtures/project/${name}`, import.meta.url), 'utf8');
const fixture = (name: string): MigrationFile => ({ filename: name, source: read(name) });
const createName = '2026_01_01_000000_create_users.php';
const updateName = '2026_01_02_000000_update_users.php';
const reviseName = '2026_01_03_000000_revise_users.php';
const unsupportedName = '2026_01_02_000000_unsupported.php';
const wrap = (body: string) => `<?php return new class extends Migration { function up() { ${body} } };`;
const file = (name: string, body = ''): MigrationFile => ({ filename: `2026_01_01_000000_${name}.php`, source: wrap(body) });
const state = (nullable = false): SchemaState => ({ tables: { users: { name: 'users', indexes: {}, columns: { name: { name: 'name', type: 'string', nullable, length: 120 } } } } });

describe('filename ordering', () => {
  it('orders by basename, not folder or input position', () => {
    const files = [file('z'), file('a')].map((f, i) => ({ ...f, filename: `${i ? 'z' : 'a'}/${f.filename}` }));
    const original = structuredClone(files);
    expect(orderMigrations(files).files.map(f => f.filename)).toEqual([files[1].filename, files[0].filename]);
    expect(files).toEqual(original);
  });
  it('supports Windows paths, year 0001, and same timestamp suffix ordering', () => {
    const files = [file('b'), file('a'), { filename: 'C:\\migrations\\0001_01_01_000000_create_users.php', source: wrap('') }];
    const result = orderMigrations(files);
    expect(result.diagnostics).toEqual([]);
    expect(result.files.map(f => f.filename)).toEqual([files[2].filename, files[1].filename, files[0].filename]);
  });
  it.each(['users.php', '001_users.php', '2026_1_01_000000_users.php', '2026_01_01_000000_.php', '2026_01_01_000000_users.txt'])('reports invalid filename: %s', filename => {
    expect(orderMigrations([{ filename, source: '' }]).diagnostics[0].code).toBe('INVALID_MIGRATION_FILENAME');
  });
  it('rejects duplicate names even across folders', () => {
    const f = file('users');
    const result = orderMigrations([f, { ...f, filename: `vendor/${f.filename}` }]);
    expect(result.diagnostics.map(d => d.code)).toEqual(['DUPLICATE_MIGRATION_NAME', 'DUPLICATE_MIGRATION_NAME']);
  });
});
describe('project golden tests', () => {
  it('compares all ordered operations, snapshots, structural diffs and final schema', () => {
    const result = analyzeProject([fixture(reviseName), fixture(createName), fixture(updateName)]);
    expect(JSON.parse(JSON.stringify(result))).toEqual(JSON.parse(read('success.golden.json')));
  });
  it('preserves successful prefix and blocks replay after unsupported migration', () => {
    const result = analyzeProject([fixture(reviseName), fixture(unsupportedName), fixture(createName)]);
    expect(JSON.parse(JSON.stringify(result))).toEqual(JSON.parse(read('blocked.golden.json')));
  });
});
describe('batch analysis boundaries', () => {
  it('is deterministic under shuffled input', () => {
    const files = [fixture(createName), fixture(updateName), fixture(reviseName)];
    expect(analyzeProject(files)).toEqual(analyzeProject([...files].reverse()));
  });
  it('empty project is complete with an empty schema', () => {
    expect(analyzeProject([])).toMatchObject({ complete: true, migrations: [], diagnostics: [], appliedCount: 0, finalSchema: emptySchema() });
  });
  it('accepts an explicit initial schema without mutating it', () => {
    const initial = state();
    const original = structuredClone(initial);
    const result = analyzeProject([fixture(updateName)], { initialSchema: initial });
    expect(result.complete).toBe(true);
    expect(initial).toEqual(original);
    expect(result.migrations[0].schemaBefore).toEqual(initial);
    expect(result.finalSchema!.tables.users.columns.display_name).toBeDefined();
  });
  it('all snapshots, diffs, summaries and caller inputs are independent objects', () => {
    const initial = state();
    const files = [fixture(updateName), fixture(reviseName)];
    const input = structuredClone(files);
    const result = analyzeProject(files, { initialSchema: initial });
    result.migrations[0].schemaBefore!.tables.users.columns.name.length = 999;
    result.migrations[0].schemaAfter!.tables.users.columns.display_name.length = 999;
    result.finalSchema!.tables.users.columns.display_name.length = 999;
    expect(initial.tables.users.columns.name.length).toBe(120);
    expect(result.initialSchema.tables.users.columns.name.length).toBe(120);
    expect(result.migrations[1].schemaBefore!.tables.users.columns.display_name.length).toBe(120);
    expect(result.lastValidSchema.tables.users.columns.display_name.length).toBe(200);
    expect(files).toEqual(input);
    expect(result.migrations[0].diff!.changes).toContainEqual(expect.objectContaining({ kind: 'columnAdded', column: 'display_name', after: expect.objectContaining({ length: 120 }) }));
  });
  it('invalid project names block all replay, even the valid prefix', () => {
    const result = analyzeProject([fixture(createName), { filename: 'invalid.php', source: wrap('') }]);
    expect(result.complete).toBe(false);
    expect(result.appliedCount).toBe(0);
    expect(result.finalSchema).toBeNull();
    expect(result.migrations.every(m => m.status === 'blocked' && m.schemaBefore === null && m.schemaAfter === null && m.diff === null)).toBe(true);
  });
  it('duplicate migration identities never overwrite or replay silently', () => {
    const f = fixture(createName);
    const result = analyzeProject([f, { ...f, filename: `other/${f.filename}` }]);
    expect(result.migrations).toHaveLength(2);
    expect(result.appliedCount).toBe(0);
    expect(result.diagnostics.filter(d => d.code === 'DUPLICATE_MIGRATION_NAME')).toHaveLength(2);
  });
  it('identical duplicate paths have one local ordering diagnostic per entry', () => {
    const f = fixture(createName);
    const result = analyzeProject([f, f]);
    expect(result.migrations.every(m => m.diagnostics.filter(d => d.phase === 'ordering').length === 1)).toBe(true);
    expect(result.appliedCount).toBe(0);
  });
  it('a replay error after success keeps only the successful prefix', () => {
    const bad = {filename: updateName, source: wrap("Schema::table('users', function($t) { $t->text('bio'); $t->id(); });")};
    const result = analyzeProject([fixture(createName), bad, fixture(reviseName)]);
    expect(result.appliedCount).toBe(1);
    expect(result.migrations.map(m => m.status)).toEqual(['applied', 'failed', 'blocked']);
    expect(result.lastValidSchema).toEqual(result.migrations[0].schemaAfter);
    expect(result.lastValidSchema.tables.users.columns.bio).toBeUndefined();
    expect(result.finalSchema).toBeNull();
  });
  it('replay failure rolls back the entire file and reports exact operation source', () => {
    const bad = file('b', "Schema::table('users', function($t) { $t->text('bio'); $t->dropColumn('missing'); });");
    const initial = state();
    const result = analyzeProject([bad, file('c')], { initialSchema: initial });
    expect(result.migrations.map(m => m.status)).toEqual(['failed', 'blocked']);
    expect(result.migrations[0].schemaBefore).toEqual(initial);
    expect(result.migrations[0].schemaAfter).toBeNull();
    expect(result.lastValidSchema).toEqual(initial);
    expect(result.diagnostics[0]).toMatchObject({ phase: 'replay', code: 'SCHEMA_REPLAY_ERROR', operationIndex: 1, source: result.migrations[0].analysis.operations[1].source });
  });
  it('collects later syntax errors but never guesses their snapshots', () => {
    const bad = { ...file('a'), source: '<?php return new class {' };
    const next = { ...file('b'), source: '<?php function {' };
    const result = analyzeProject([next, bad]);
    expect(result.diagnostics.filter(d => d.code === 'PARSE_ERROR')).toHaveLength(2);
    expect(result.migrations[0].status).toBe('failed');
    expect(result.migrations[1].status).toBe('blocked');
    expect(result.migrations[1].schemaBefore).toBeNull();
  });
  it('valid no-op file has equal snapshots and empty diff', () => {
    const result = analyzeProject([file('noop')]);
    expect(result.complete).toBe(true);
    expect(result.migrations[0]).toMatchObject({status:'applied', schemaBefore: emptySchema(), schemaAfter: emptySchema(), diff:{changes:[]}});
  });
});
describe('structural schema diff', () => {
  it('includes whole tables on add/remove, without redundant column changes', () => {
    expect(diffSchemas(emptySchema(), state()).changes).toEqual([{ kind:'tableAdded',table:'users',after:state().tables.users }]);
    expect(diffSchemas(state(), emptySchema()).changes).toEqual([{ kind:'tableRemoved',table:'users',before:state().tables.users }]);
  });
  it('reports column attributes changing', () => {
    expect(diffSchemas(state(), state(true)).changes).toEqual([{kind:'columnChanged',table:'users',column:'name',before:state().tables.users.columns.name,after:state(true).tables.users.columns.name}]);
  });
  it('ignores object key insertion order', () => {
    const other = state();
    other.tables.users.columns.name = { length:120,nullable:false,type:'string',name:'name' };
    expect(diffSchemas(state(), other)).toEqual({changes:[]});
  });
  it('distinguishes absent defaults from explicit null', () => {
    const other = state(); other.tables.users.columns.name.default = null;
    expect(diffSchemas(state(), other).changes[0].kind).toBe('columnChanged');
  });
  it('represents explicit rename as removed + added without semantic inference', () => {
    const result = analyzeProject([fixture(createName),fixture(updateName)]);
    expect(result.migrations[1].diff!.changes.map(c => c.kind)).toEqual(['columnAdded','columnRemoved','columnAdded']);
    expect(result.migrations[1].analysis.operations[1].kind).toBe('renameColumn');
  });
  it('copies returned values and never mutates input', () => {
    const before = state(), after = state(true);
    const diff = diffSchemas(before, after);
    const change = diff.changes[0];
    if(change.kind !== 'columnChanged') throw new Error('Expected change');
    change.before.length = 1; change.after.length = 2;
    expect(before.tables.users.columns.name.length).toBe(120);
    expect(after.tables.users.columns.name.length).toBe(120);
  });
  it('compares net structure rather than listing intermediate operations', () => {
    const result = analyzeProject([file('temporary', "Schema::table('users', function($t) { $t->text('temp'); $t->dropColumn('temp'); });")], {initialSchema:state()});
    expect(result.migrations[0].analysis.operations).toHaveLength(2);
    expect(result.migrations[0].diff).toEqual({changes:[]});
  });
  it('handles prototype-like identifiers', () => {
    const unusual = JSON.parse('{"tables":{"__proto__":{"name":"__proto__","indexes":{},"columns":{"constructor":{"name":"constructor","type":"text","nullable":false}}}}}') as SchemaState;
    expect(diffSchemas(emptySchema(), unusual).changes[0]).toMatchObject({kind:'tableAdded',table:'__proto__'});
    expect(diffSchemas(unusual, structuredClone(unusual)).changes).toEqual([]);
  });
});
