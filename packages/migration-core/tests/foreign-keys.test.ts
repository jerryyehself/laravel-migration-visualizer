import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeMigration, analyzeProject, applyOperations, diffSchemas, emptySchema, type ForeignKey, type MigrationFile } from '../src/index.js';
const wrap = (body: string) => `<?php return new class extends Migration { function up() { ${body} } };`;
const table = (name: string, body: string, create = true) => `Schema::${create ? 'create' : 'table'}('${name}', function($t) { ${body} });`;
const analyze = (body: string) => analyzeMigration(wrap(table('posts',body)));
const replay = (body: string) => {
  const result = analyzeMigration(wrap(table('users',"$t->id();")+table('posts',body)));
  expect(result.diagnostics).toEqual([]);
  return applyOperations(emptySchema(),result.operations);
};
const change = (body: string) => analyzeMigration(wrap(body)).operations;
const key: ForeignKey = {name:'posts_user_id_foreign',columns:['user_id'],referencedTable:'users',referencedColumns:['id']};
const read = (name: string) => readFileSync(new URL(`./fixtures/foreign-keys/${name}`, import.meta.url),'utf8');
const names = ['2026_03_01_000000_create_users.php','2026_03_02_000000_create_posts.php','2026_03_03_000000_revise_keys.php','2026_03_04_000000_remove_key.php'];
const fixture = (filename: string): MigrationFile => ({filename,source:read(filename)});

describe('foreign key normalization', () => {
  it('supports explicit foreign/references/on in either modifier order with a normalized name', () => {
    for (const chain of ["references('id')->on('users')","on('users')->references(['id'])"]) {
      const result = analyze(`$t->foreign('user_id')->${chain};`);
      expect(result.complete).toBe(true);
      expect(result.operations.at(-1)).toMatchObject({kind:'addForeignKey',table:'posts',foreignKey:key});
    }
    expect(analyze("$t->foreign('user_id',null)->references('id')->on('users');").operations.at(-1)).toMatchObject({foreignKey:key});
  });
  it('supports ordered composite columns and custom constraint names', () => {
    expect(analyze("$t->foreign(['tenant','user'],'custom')->references(array('tenant','id'))->on('users');").operations.at(-1)).toMatchObject({foreignKey:{name:'custom',columns:['tenant','user'],referencedColumns:['tenant','id']}});
  });
  it('foreignId without constrained creates only an unsigned big integer column', () => {
    const result = analyze("$t->foreignId('user_id')->nullable();");
    expect(result.complete).toBe(true);
    expect(result.operations).toHaveLength(2);
    expect(result.operations[1]).toMatchObject({column:{type:'bigInteger',unsigned:true,autoIncrement:false,nullable:true}});
  });
  it('supports conventional constrained, explicit table/column/name and null defaults', () => {
    for (const call of ['constrained()','constrained(null,null,null)',"constrained('users')"]) {
      const result=analyze(`$t->foreignId('user_id')->${call};`);
      expect(result.complete).toBe(true);
      expect(result.operations.at(-1)).toMatchObject({foreignKey:key});
    }
    const result=analyze("$t->foreignId('owner_id')->nullable()->constrained('people','key','owner_fk')->cascadeOnDelete();");
    expect(result.operations.slice(1)).toMatchObject([{kind:'addColumn',column:{nullable:true}},{kind:'addForeignKey',foreignKey:{name:'owner_fk',referencedTable:'people',referencedColumns:['key'],onDelete:'cascade'}}]);
    expect(result.operations[1].source).toEqual(result.operations[2].source);
  });
  it.each(['user','post','account','team','role','product','order','comment'])('uses documented %s_id inference', noun => {
    expect(analyze(`$t->foreignId('${noun}_id')->constrained();`).operations.at(-1)).toMatchObject({foreignKey:{referencedTable:`${noun}s`}});
  });
  it.each(['cascade','restrict','set null','no action'])('normalizes explicit delete/update %s actions', action => {
    const result=analyze(`$t->foreign('user_id')->references('id')->on('users')->onDelete('${action}')->onUpdate('${action}');`);
    expect(result.complete).toBe(true);
    expect(result.operations.at(-1)).toMatchObject({foreignKey:{onDelete:action,onUpdate:action}});
  });
  it.each([['cascade','cascade'],['restrict','restrict'],['null','set null'],['noAction','no action']])('normalizes %s action shortcuts', (method,action) => {
    expect(analyze(`$t->foreignId('user_id')->constrained()->${method}OnDelete()->${method}OnUpdate();`).operations.at(-1)).toMatchObject({foreignKey:{onDelete:action,onUpdate:action}});
  });
  it('drops by constraint name or ordered convention array', () => {
    expect(analyze("$t->dropForeign('custom'); $t->dropForeign(['tenant','user']);").operations.slice(1)).toMatchObject([{kind:'dropForeignKey',name:'custom'},{kind:'dropForeignKey',name:'posts_tenant_user_foreign'}]);
  });
  it.each([
    "$t->foreign('user_id');", "$t->foreign('user_id')->references('id');",
    "$t->foreign([])->references('id')->on('users');", "$t->foreign(['a','a'])->references(['id','id'])->on('users');",
    "$t->foreign(['a','b'])->references('id')->on('users');", "$t->foreign('a')->references($column)->on('users');",
    "$t->foreign('a')->references('id')->on($target);", "$t->foreign('a')->references('id')->on('users')->onDelete(null);",
    "$t->foreign('a')->references('id')->on('users')->onUpdate('set default');",
    "$t->foreign('a')->references('id')->on('users')->cascadeOnDelete(true);",
    "$t->foreign('a')->references('id')->on('users')->cascadeOnDelete()->restrictOnDelete();",
    "$t->foreign('a')->references('id')->references('key')->on('users');",
    "$t->foreign('a')->references('id')->on('users')->deferrable();",
    "$t->foreignId('person_id')->constrained();", "$t->foreignId('owner_id')->constrained();",
    "$t->foreignId('user_id')->constrained(null,'key');", "$t->foreignId('user_id')->constrained()->nullable();",
    "$t->foreignId('user_id')->constrained()->constrained();", "$t->foreignId('user_id')->unique()->constrained();",
    "$t->foreignId('user_id')->constrained('users')->change();", "$t->dropForeign();", "$t->dropForeign(null);",
    "$t->dropForeign(['a',...$columns]);", "$t->dropForeign('name')->cascadeOnDelete();",
  ])('rejects unsupported chains atomically: %s', body => {
    const result=analyze(body);
    expect(result.complete).toBe(false);
    expect(result.operations).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe('UNSUPPORTED_BLUEPRINT');
  });
});

describe('foreign key replay and structural diff', () => {
  it('checks composite and self references without creating an implicit DB index', () => {
    const result=analyzeMigration(wrap(table('users',"$t->id(); $t->string('tenant');")+table('posts',"$t->id(); $t->string('tenant'); $t->foreignId('user_id'); $t->foreign(['tenant','user_id'])->references(['tenant','id'])->on('users'); $t->foreignId('parent_id')->nullable()->constrained('posts');")));
    const state=applyOperations(emptySchema(),result.operations);
    expect(Object.keys(state.tables.posts.foreignKeys)).toHaveLength(2);
    expect(Object.keys(state.tables.posts.indexes)).toEqual(['posts_id_primary']);
  });
  it.each([
    ["$t->foreign('missing')->references('id')->on('users');",'Unknown foreign key column'],
    ["$t->foreignId('user_id')->constrained('missing');",'Unknown referenced table'],
    ["$t->foreignId('user_id')->constrained('users','missing');",'Unknown referenced column'],
    ["$t->foreignId('user_id')->constrained(); $t->foreign('user_id')->references('id')->on('users');",'already exists'],
    ["$t->foreignId('user_id')->constrained()->nullOnDelete();",'SET NULL requires'],
    ["$t->foreignId('user_id')->constrained()->nullOnUpdate();",'SET NULL requires'],
    ["$t->dropForeign('missing');",'Unknown foreign key'],
  ])('rejects invalid replay: %s', (body,message) => expect(() => replay(body)).toThrow(message));
  it('allows SET NULL for nullable source columns', () => {
    expect(replay("$t->foreignId('user_id')->nullable()->constrained()->nullOnDelete()->nullOnUpdate();").tables.posts.foreignKeys.posts_user_id_foreign).toMatchObject({onDelete:'set null',onUpdate:'set null'});
  });
  it('updates both sides of self references on rename', () => {
    const state=replay("$t->id(); $t->foreign('id')->references('id')->on('posts'); $t->renameColumn('id','key');");
    expect(state.tables.posts.foreignKeys.posts_id_foreign).toMatchObject({columns:['key'],referencedColumns:['key']});
  });
  it('updates incoming and outgoing references on rename, preserving identity and inputs', () => {
    const before=replay("$t->foreignId('user_id')->constrained();");
    const after=applyOperations(before,change(table('users',"$t->renameColumn('id','user_key');",false)+table('posts',"$t->renameColumn('user_id','author_id');",false)));
    expect(after.tables.posts.foreignKeys.posts_user_id_foreign).toMatchObject({columns:['author_id'],referencedColumns:['user_key']});
    expect(before.tables.posts.foreignKeys.posts_user_id_foreign).toEqual(key);
    expect(diffSchemas(before,after).changes.filter(c=>c.kind.startsWith('foreignKey'))).toEqual([{kind:'foreignKeyChanged',table:'posts',foreignKey:key.name,before:key,after:after.tables.posts.foreignKeys[key.name]}]);
    expect(()=>applyOperations(after,change(table('posts',"$t->dropForeign(['author_id']);",false)))).toThrow('Unknown foreign key');
  });
  it.each([['users','id'],['posts','user_id']])('blocks dropping referenced %s.%s', (name,column) => {
    const before=replay("$t->foreignId('user_id')->constrained();");
    expect(()=>applyOperations(before,change(table(name,`$t->dropColumn('${column}');`,false)))).toThrow('Drop foreign keys');
  });
  it('allows source and target drops after removing the constraint and target index', () => {
    const before=replay("$t->foreignId('user_id')->constrained();");
    const after=applyOperations(before,change(table('posts',"$t->dropForeign(['user_id']); $t->dropColumn('user_id');",false)+table('users',"$t->dropPrimary(); $t->dropColumn('id');",false)));
    expect(after.tables.posts.foreignKeys).toEqual({});
    expect(after.tables.users.columns).toEqual({});
  });
  it('diffs action and ordered reference changes and returns detached payloads', () => {
    const before=replay("$t->foreignId('user_id')->constrained();");
    const after=structuredClone(before);
    after.tables.posts.foreignKeys[key.name].onDelete='cascade';
    const diff=diffSchemas(before,after);
    const item=diff.changes[0];
    expect(item.kind).toBe('foreignKeyChanged');
    if(item.kind!=='foreignKeyChanged') throw new Error('Expected foreign key change');
    item.before.columns.push('other'); item.after.referencedColumns.push('other');
    expect(before.tables.posts.foreignKeys[key.name]).toEqual(key);
    expect(after.tables.posts.foreignKeys[key.name].referencedColumns).toEqual(['id']);
    const reordered=structuredClone(before);
    reordered.tables.posts.foreignKeys[key.name]={...key,columns:['b','a'],referencedColumns:['id','tenant']};
    expect(diffSchemas(before,reordered).changes[0].kind).toBe('foreignKeyChanged');
  });
  it('diffs removals/additions rather than inferring constraint rename', () => {
    const before=replay("$t->foreignId('user_id')->constrained();");
    const after=applyOperations(before,change(table('posts',"$t->dropForeign(['user_id']); $t->foreign('user_id','renamed')->references('id')->on('users');",false)));
    expect(diffSchemas(before,after).changes.map(c=>c.kind)).toEqual(['foreignKeyRemoved','foreignKeyAdded']);
    const noKeys=applyOperations(before,change(table('posts',"$t->dropForeign(['user_id']);",false)));
    const same=applyOperations(noKeys,change(table('posts',"$t->foreign('user_id')->references('id')->on('users'); $t->dropForeign(['user_id']);",false)));
    expect(diffSchemas(noKeys,same).changes).toEqual([]);
  });
  it('detects composite pairing order changes with equal-length column arrays', () => {
    const result=analyzeMigration(wrap(table('users',"$t->id(); $t->string('tenant');")+table('posts',"$t->string('tenant'); $t->foreignId('user_id'); $t->foreign(['tenant','user_id'])->references(['tenant','id'])->on('users');")));
    expect(result.complete).toBe(true);
    const before=applyOperations(emptySchema(),result.operations);
    const after=structuredClone(before);
    after.tables.posts.foreignKeys.posts_tenant_user_id_foreign.referencedColumns.reverse();
    expect(diffSchemas(before,after).changes).toEqual([{kind:'foreignKeyChanged',table:'posts',foreignKey:'posts_tenant_user_id_foreign',before:before.tables.posts.foreignKeys.posts_tenant_user_id_foreign,after:after.tables.posts.foreignKeys.posts_tenant_user_id_foreign}]);
    const reordered=structuredClone(before);
    reordered.tables.posts.foreignKeys.posts_tenant_user_id_foreign.columns.reverse();
    expect(diffSchemas(before,reordered).changes[0].kind).toBe('foreignKeyChanged');
  });
  it('handles prototype-like table/column/constraint identifiers', () => {
    const result=analyzeMigration(wrap(table('__proto__',"$t->string('constructor');")+table('posts',"$t->string('__proto__'); $t->foreign('__proto__','constructor')->references('constructor')->on('__proto__');")));
    const state=applyOperations(emptySchema(),result.operations);
    expect(Object.keys(state.tables.posts.foreignKeys)).toEqual(['constructor']);
    expect(state.tables.posts.foreignKeys.constructor).toMatchObject({referencedTable:'__proto__'});
    expect(diffSchemas(state,structuredClone(state)).changes).toEqual([]);
  });
});

// Existing project goldens assert full JSON; this projection isolates relationship lifecycle.
function summary(files: MigrationFile[]) {
  const result=analyzeProject(files);
  const snapshot=(state: typeof result.finalSchema) => state===null ? null : Object.fromEntries(Object.entries(state.tables).map(([name,t])=>[name,{columns:Object.keys(t.columns).sort(),foreignKeys:t.foreignKeys}]));
  return {complete:result.complete,appliedCount:result.appliedCount,
    diagnostics:result.diagnostics.map(d=>({code:d.code,phase:d.phase,file:d.source.file,...(d.operationIndex!==undefined ? {operationIndex:d.operationIndex}: {})})),
    migrations:result.migrations.map(m=>({filename:m.filename,status:m.status,before:snapshot(m.schemaBefore),after:snapshot(m.schemaAfter),foreignKeyChanges:m.diff===null ? null : m.diff.changes.filter(c=>c.kind.startsWith('foreignKey'))})),
    final:snapshot(result.finalSchema),lastValid:snapshot(result.lastValidSchema)};
}
describe('foreign key project goldens', () => {
  it('matches ordered creation, both-side rename, action replacement and removal snapshots', () => {
    const files=names.map(fixture).reverse();
    expect(summary(files)).toEqual(JSON.parse(read('success.golden.json')));
    const result=analyzeProject(files);
    const original=structuredClone(result.migrations[1].schemaAfter);
    result.finalSchema!.tables.users.columns.user_key.nullable=true;
    result.migrations[2].schemaAfter!.tables.posts.foreignKeys.posts_author_fk.columns.push('other');
    expect(result.migrations[1].schemaAfter).toEqual(original);
  });
  it('rolls back cross-table updates in the failing file and blocks later snapshots', () => {
    const files=[fixture(names[3]),fixture('2026_03_03_000000_invalid_drop.php'),fixture(names[1]),fixture(names[0])];
    expect(summary(files)).toEqual(JSON.parse(read('blocked.golden.json')));
    const result=analyzeProject(files);
    expect(result.migrations[2].diagnostics[0].source).toEqual(result.migrations[2].analysis.operations[2].source);
    expect(result.lastValidSchema.tables.users.columns.id).toBeDefined();
    expect(result.lastValidSchema.tables.posts.columns.temp).toBeUndefined();
    expect(result.migrations[3].analysis.complete).toBe(true);
  });
});
