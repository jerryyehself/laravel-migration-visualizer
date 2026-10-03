import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeMigration, analyzeProject, applyOperations, type AtomicOperation } from '../src/index.js';
const php = (body: string, method = 'table', table = 'users') => `<?php return new class extends Migration { function up() { Schema::${method}('${table}', function($t) { ${body} }); } };`;
const file = (day: number, body: string, method = 'table') => ({ filename: `2026_07_0${day}_000000_users.php`, source: php(body, method) });
const initial = () => analyzeProject([file(1, "$t->string('name',25)->nullable()->default('old')->comment('old')->unique();", 'create')]).finalSchema!;
describe('column replacement via change', () => {
  it('normalizes a replacement definition, not an addColumn', () => {
    const result = analyzeMigration(php("$t->string('name',50)->change()->nullable();"));
    expect(result.complete).toBe(true);
    expect(result.operations).toMatchObject([{ kind: 'changeColumn', table: 'users', column: { name: 'name', type: 'string', length: 50, nullable: true } }]);
  });
  it('replaces omitted attributes while keeping independent indexes', () => {
    const before = initial();
    const result = analyzeProject([file(2, "$t->string('name',50)->change();")], { initialSchema: before });
    expect(result.complete).toBe(true);
    expect(result.finalSchema!.tables.users.columns.name).toEqual({ name: 'name', type: 'string', length: 50, nullable: false });
    expect(result.finalSchema!.tables.users.indexes).toEqual(before.tables.users.indexes);
    expect(before.tables.users.columns.name.default).toBe('old');
    expect(result.migrations[0].diff!.changes.map(c => c.kind)).toEqual(['columnChanged']);
  });
  it('retains explicitly restated attributes and handles repeated changes in order', () => {
    const result = analyzeProject([file(2, "$t->string('name',50)->nullable()->default(null)->comment('new')->change(); $t->text('name')->nullable(false)->change();")], { initialSchema: initial() });
    expect(result.complete).toBe(true);
    expect(result.migrations[0].analysis.operations[0]).toMatchObject({kind:'changeColumn',column:{nullable:true,default:null,comment:'new',length:50}});
    expect(result.finalSchema!.tables.users.columns.name).toEqual({ name: 'name', type: 'text', nullable: false });
  });
  it.each(['integer','decimal','enum','dateTimeTz'])('supports a concrete %s replacement', type => {
    const expression = type === 'enum' ? "$t->enum('name',['a','b'])->change();" : type === 'dateTimeTz' ? "$t->dateTimeTz('name',6)->useCurrent()->change();" : `$t->${type}('name')->change();`;
    const result = analyzeProject([file(2, expression)], { initialSchema: initial() });
    expect(result.complete).toBe(true);
    expect(result.finalSchema!.tables.users.columns.name.type).toBe(type);
  });
  it('removes current intent when not restated', () => {
    const result = analyzeProject([file(1, "$t->dateTime('at')->useCurrent();", 'create'), file(2, "$t->dateTime('at',6)->change();")]);
    expect(result.complete).toBe(true);
    expect(result.finalSchema!.tables.users.columns.at).not.toHaveProperty('useCurrent');
    expect(result.migrations[0].schemaAfter!.tables.users.columns.at.useCurrent).toBe(true);
  });
  it.each([
    "$t->string('name')->change(false);", "$t->string('name')->change()->change();",
    "$t->string('name')->unique()->change();", "$t->string('name')->index(null)->change();", "$t->string('name')->unique(false)->change();",
    "$t->id()->change();", "$t->foreignId('name')->change();", "$t->foreignId('name')->constrained()->change();",
    "$t->timestamps()->change();", "$t->rememberToken()->change();", "$t->softDeletes()->change();",
  ])('rejects unsupported change chains without partial operations: %s', body => {
    const result = analyzeMigration(php(body));
    expect(result.complete).toBe(false);
    expect(result.operations).toEqual([]);
    expect(result.diagnostics[0].code).toBe('UNSUPPORTED_BLUEPRINT');
  });
  it('rejects change inside create', () => {
    const result = analyzeMigration(php("$t->string('name')->change();", 'create'));
    expect(result.complete).toBe(false);
    expect(result.operations.filter(o => o.kind !== 'createTable')).toEqual([]);
  });
  it.each(['missing', 'table'])('fails atomically for an unknown %s and blocks later snapshots', target => {
    const second = target === 'missing' ? file(2, "$t->text('partial'); $t->string('missing')->change();") : { ...file(2, ''), source: php("$t->string('name')->change();", 'table', 'missing') };
    const result = analyzeProject([file(1, "$t->string('name');", 'create'), second, file(3, "$t->text('later');")]);
    expect(result.migrations.map(m => m.status)).toEqual(['applied','failed','blocked']);
    expect(result.diagnostics.some(d => d.phase === 'replay')).toBe(true);
    expect(Object.keys(result.lastValidSchema.tables.users.columns)).toEqual(['name']);
    expect(result.finalSchema).toBeNull();
    expect(result.migrations[1].schemaBefore).toEqual(result.lastValidSchema);
    expect(result.migrations[1].schemaAfter).toBeNull();
    expect(result.migrations[2].schemaBefore).toBeNull();
  });
  it('retains primary metadata from the authoritative index', () => {
    const result = analyzeProject([file(1, "$t->integer('key'); $t->primary('key');", 'create'), file(2, "$t->bigInteger('key')->change();")]);
    expect(result.complete).toBe(true);
    expect(result.finalSchema!.tables.users.columns.key.primary).toBe(true);
    expect(Object.keys(result.finalSchema!.tables.users.indexes)).toEqual(['users_key_primary']);
  });
  it('rejects changing existing auto-increment columns', () => {
    const result = analyzeProject([file(1, "$t->id();", 'create'), file(2, "$t->bigInteger('id')->change();")]);
    expect(result.complete).toBe(false);
    expect(result.diagnostics.some(d => d.message.includes('auto-increment'))).toBe(true);
    expect(result.lastValidSchema.tables.users.columns.id.autoIncrement).toBe(true);
  });
  it.each(['local', 'incoming', 'self'])('rejects changes involving %s foreign keys', target => {
    const create = "Schema::create('users',function($t){$t->integer('key');}); Schema::create('posts',function($t){$t->integer('user_key');$t->foreign('user_key')->references('key')->on('users');});";
    const source = target === 'self' ? "Schema::create('users',function($t){$t->integer('key');$t->integer('parent');$t->foreign('parent')->references('key')->on('users');});" : create;
    const result = analyzeProject([{ ...file(1,''), source: `<?php return new class extends Migration { function up(){${source}} };` }, { ...file(2,''), source: php(`$t->bigInteger('${target === 'local' ? 'user_key' : 'key'}')->change();`, 'table', target === 'local' ? 'posts' : 'users') }]);
    expect(result.complete).toBe(false);
    expect(result.diagnostics.some(d => d.message.includes('foreign keys'))).toBe(true);
  });
  it('allows an explicit foreign key drop before replacement', () => {
    const before = analyzeProject([file(1,"$t->integer('key');$t->integer('parent');$t->foreign('parent')->references('key')->on('users');",'create')]).finalSchema!;
    const result = analyzeProject([file(2,"$t->dropForeign(['parent']);$t->bigInteger('key')->change();")], {initialSchema: before});
    expect(result.complete).toBe(true);
    expect(result.finalSchema!.tables.users.foreignKeys).toEqual({});
  });
  it('does not alias replacement operations, snapshots or diff payloads', () => {
    const result = analyzeProject([file(2,"$t->enum('name',['a','b'])->change();")], {initialSchema: initial()});
    expect(result.complete).toBe(true);
    const op = result.migrations[0].analysis.operations[0];
    if ('column' in op && typeof op.column === 'object') op.column.allowedValues![0]='mutated';
    result.migrations[0].schemaAfter!.tables.users.columns.name.allowedValues![0]='snapshot';
    expect(result.finalSchema!.tables.users.columns.name.allowedValues).toEqual(['a','b']);
    expect(result.migrations[0].diff!.changes).toMatchObject([{kind:'columnChanged',after:{allowedValues:['a','b']}}]);
  });
  it('uses special identifiers as ordinary replacement names', () => {
    const result = analyzeProject([file(1,"$t->string('__proto__');$t->string('constructor');",'create'),file(2,"$t->text('__proto__')->change();$t->text('constructor')->change();")]);
    expect(result.complete).toBe(true);
    expect(Object.keys(result.finalSchema!.tables.users.columns)).toEqual(['__proto__','constructor']);
    expect(result.finalSchema!.tables.users.columns.__proto__.type).toBe('text');
  });
  it.each(['autoIncrement', 'primary'] as const)('rejects unsupported %s metadata in public replay operations', property => {
    const before = initial();
    const original = structuredClone(before);
    const operation: AtomicOperation = {kind:'changeColumn',table:'users',column:{name:'name',type:'integer',nullable:false,[property]:true},source:{file:'manual',line:1,column:0}};
    expect(() => applyOperations(before, [operation])).toThrow('unsupported');
    expect(before).toEqual(original);
  });
  it('produces no diff when the full definition is restated', () => {
    const result = analyzeProject([file(2,"$t->string('name',25)->nullable()->default('old')->comment('old')->change();")], {initialSchema:initial()});
    expect(result.complete).toBe(true);
    expect(result.migrations[0].diff).toEqual({changes:[]});
  });
  it('permits separate index commands without recreating an existing index', () => {
    const result = analyzeProject([file(2,"$t->dropUnique(['name']);$t->string('name',50)->change();$t->index('name','renamed_index');")], {initialSchema:initial()});
    expect(result.complete).toBe(true);
    expect(Object.keys(result.finalSchema!.tables.users.indexes)).toEqual(['renamed_index']);
  });
  it('matches independently authored cross-file success and failure goldens', () => {
    const root = new URL('./fixtures/change-column/', import.meta.url);
    const read = (name:string) => readFileSync(new URL(name,root),'utf8');
    const load = (name:string) => ({filename:name,source:read(name)});
    const first='2026_07_01_000000_create_users.php', second='2026_07_02_000000_change_users.php', third='2026_07_03_000000_reset_users.php', bad='2026_07_02_000000_missing.php';
    const project=(names:string[])=>analyzeProject(names.map(load).reverse());
    const projectView=(r:ReturnType<typeof analyzeProject>)=>({complete:r.complete,appliedCount:r.appliedCount,finalSchema:r.finalSchema,lastValidSchema:r.lastValidSchema,steps:r.migrations.map(m=>({status:m.status,before:m.schemaBefore,after:m.schemaAfter,diff:m.diff})),diagnosticCodes:r.diagnostics.map(d=>d.code)});
    expect(projectView(project([first,second,third]))).toEqual(JSON.parse(read('success.golden.json')));
    expect(projectView(project([first,bad,third]))).toEqual(JSON.parse(read('blocked.golden.json')));
  });
});
