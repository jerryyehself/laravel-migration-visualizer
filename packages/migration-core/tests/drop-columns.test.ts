import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeMigration, analyzeProject } from '../src/index.js';
const php = (body: string, method = 'table', table = 'users') => `<?php return new class extends Migration { function up() { Schema::${method}('${table}', function($t) { ${body} }); } };`;
const file = (day: number, body: string, method = 'table', table = 'users') => ({ filename: `2026_10_0${day}_000000_users.php`, source: php(body, method, table) });
const create = file(1, "$t->string('a'); $t->string('b'); $t->string('keep');", 'create');
describe('static dropColumn arrays', () => {
  it('expands input order and preserves the common statement location', () => {
    const result = analyzeMigration(php("$t->dropColumn(['b','a']);"), 'array.php');
    expect(result.complete).toBe(true);
    expect(result.operations).toMatchObject([{ kind: 'dropColumn', table: 'users', column: 'b' }, { kind: 'dropColumn', table: 'users', column: 'a' }]);
    expect(result.operations[0].source).toEqual(result.operations[1].source);
    expect(result.operations[0].source).toMatchObject({ file: 'array.php', line: 1 });
  });
  it.each(["'a'", "['a']", "array('a')"])('preserves single-column behavior for %s', args => {
    const result = analyzeProject([create, file(2, `$t->dropColumn(${args});`)]);
    expect(result.complete).toBe(true);
    expect(Object.keys(result.finalSchema!.tables.users.columns)).toEqual(['b', 'keep']);
  });
  it.each(["[]", "['a','a']", "['a','']", "['a',42]", "['a',null]", "['a',$name]", "['key'=>'a']", "[...$names]", "$names", "'a','b'"])('rejects unsupported %s without partial array operations', args => {
    const result = analyzeMigration(php(`$t->dropColumn(${args});`));
    expect(result.complete).toBe(false);
    expect(result.operations).toEqual([]);
    expect(result.diagnostics.map(d => d.code)).toEqual(['UNSUPPORTED_BLUEPRINT']);
  });
  it('rejects chained modifiers', () => {
    const result = analyzeMigration(php("$t->dropColumn(['b','a'])->comment('x');"));
    expect(result.complete).toBe(false);
    expect(result.operations).toEqual([]);
  });
  it('produces removed-column diffs and isolated snapshots', () => {
    const result = analyzeProject([file(2, "$t->dropColumn(['b','a']);"), create]);
    expect(result.complete).toBe(true);
    expect(result.migrations[1].diff!.changes.map(c => c.kind)).toEqual(['columnRemoved','columnRemoved']);
    expect(result.migrations[1].diff!.changes).toMatchObject([{ column: 'a' }, { column: 'b' }]);
    result.migrations[1].schemaBefore!.tables.users.columns.a.type = 'mutated';
    expect(result.migrations[0].schemaAfter!.tables.users.columns.a.type).toBe('string');
    expect(result.migrations[1].diff!.changes[0]).toMatchObject({ before: { type: 'string' } });
    result.migrations[1].schemaAfter!.tables.users.columns.keep.type = 'snapshot';
    expect(result.finalSchema!.tables.users.columns.keep.type).toBe('string');
  });
  it('rolls back earlier drops and blocks later snapshots when a later name is missing', () => {
    const result = analyzeProject([create, file(2, "$t->dropColumn(['a','missing']);"), file(3, "$t->string('later');")]);
    expect(result.migrations.map(m => m.status)).toEqual(['applied','failed','blocked']);
    expect(result.finalSchema).toBeNull();
    expect(Object.keys(result.lastValidSchema.tables.users.columns)).toEqual(['a','b','keep']);
    expect(result.migrations[1].schemaBefore).toEqual(result.lastValidSchema);
    expect(result.migrations[1].schemaAfter).toBeNull();
    expect(result.migrations[1].diff).toBeNull();
    expect(result.migrations[2].schemaBefore).toBeNull();
    expect(result.migrations[2].schemaAfter).toBeNull();
    expect(result.migrations[2].diff).toBeNull();
    expect(result.diagnostics.map(d => d.code)).toEqual(['SCHEMA_REPLAY_ERROR','SCHEMA_BLOCKED']);
    expect(result.diagnostics[0]).toMatchObject({ operationIndex: 1, source: { file: file(2,'').filename } });
  });
  it.each(['index','unique','primary'])('retains the whole migration when a later column belongs to %s', type => {
    const initial = analyzeProject([file(1, `$t->string('a'); $t->string('b'); $t->${type}('b','guard');`, 'create')]).finalSchema!;
    const original = structuredClone(initial);
    const result = analyzeProject([file(2, "$t->dropColumn(['a','b']);")], { initialSchema: initial });
    expect(result.complete).toBe(false);
    expect(result.lastValidSchema).toEqual(original);
    expect(initial).toEqual(original);
    expect(result.diagnostics[0]).toMatchObject({ code: 'SCHEMA_REPLAY_ERROR', operationIndex: 1 });
  });
  it.each(['outgoing','incoming'])('retains all columns protected by an %s foreign key', direction => {
    const parent = file(1, "$t->integer('a'); $t->integer('b');", 'create');
    const relation = direction === 'outgoing'
      ? file(2, "$t->foreign('b')->references('a')->on('users');")
      : file(2, "$t->integer('user'); $t->foreign('user')->references('b')->on('users');", 'create','posts');
    const initial = analyzeProject([parent, relation]).finalSchema!;
    const result = analyzeProject([file(3, "$t->dropColumn(['a','b']);")], { initialSchema: initial });
    expect(result.complete).toBe(false);
    expect(result.lastValidSchema).toEqual(initial);
    expect(result.diagnostics[0].message).toContain('foreign keys');
  });
  it('allows explicit constraint removal before bulk column removal', () => {
    const result = analyzeProject([
      file(1, "$t->integer('a'); $t->integer('b'); $t->index('b','guard'); $t->foreign('b')->references('a')->on('users');", 'create'),
      file(2, "$t->dropForeign(['b']); $t->dropIndex('guard'); $t->dropColumn(['a','b']);"),
    ]);
    expect(result.complete).toBe(true);
    expect(result.finalSchema!.tables.users).toEqual({ name: 'users', columns: {}, indexes: {}, foreignKeys: {} });
  });
  it('treats prototype-like names as ordinary columns', () => {
    const result = analyzeProject([file(1, "$t->string('__proto__'); $t->string('constructor');", 'create'), file(2, "$t->dropColumn(['constructor','__proto__']);")]);
    expect(result.complete).toBe(true);
    expect(result.finalSchema!.tables.users.columns).toEqual({});
    expect(Object.hasOwn(result.migrations[0].schemaAfter!.tables.users.columns,'__proto__')).toBe(true);
  });
  it('matches independently authored cross-file success and blocked goldens', () => {
    const root = new URL('./fixtures/drop-columns/', import.meta.url);
    const read = (name: string) => readFileSync(new URL(name,root),'utf8');
    const project = (middle: string) => analyzeProject(['2026_10_03_000000_add_later.php',middle,'2026_10_01_000000_create_users.php'].map(filename => ({ filename, source: read(filename) })));
    const view = (r: ReturnType<typeof analyzeProject>) => ({ complete:r.complete, appliedCount:r.appliedCount, finalSchema:r.finalSchema, lastValidSchema:r.lastValidSchema, steps:r.migrations.map(m => ({ status:m.status,before:m.schemaBefore,after:m.schemaAfter,diff:m.diff })), diagnosticCodes:r.diagnostics.map(d => d.code) });
    expect(view(project('2026_10_02_000000_drop_columns.php'))).toEqual(JSON.parse(read('success.golden.json')));
    expect(view(project('2026_10_02_000000_bad_columns.php'))).toEqual(JSON.parse(read('blocked.golden.json')));
  });
});
