import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeMigration, analyzeProject, applyOperations, diffSchemas, emptySchema, type MigrationFile, type SchemaState } from '../src/index.js';
const wrap = (body: string) => `<?php return new class extends Migration { function up() { ${body} } function down() { Schema::drop('ignored'); } };`;
const create = (name: string, body = '$t->id();') => `Schema::create('${name}',function($t){${body}});`;
const analyze = (body: string) => analyzeMigration(wrap(body));
const replay = (body: string, initial = emptySchema()) => {
  const result = analyze(body);
  expect(result.diagnostics).toEqual([]);
  return applyOperations(initial,result.operations);
};
const related = () => replay(create('users')+create('posts',"$t->id(); $t->foreignId('user_id')->constrained();"));
const read = (name: string) => readFileSync(new URL(`./fixtures/table-lifecycle/${name}`,import.meta.url),'utf8');
const names = ['2026_04_01_000000_create_tables.php','2026_04_02_000000_rename_tables.php','2026_04_03_000000_drop_articles.php','2026_04_04_000000_drop_members.php'];
const fixture = (filename: string): MigrationFile => ({filename,source:read(filename)});

describe('table lifecycle normalization', () => {
  it('normalizes direct rename/drop/dropIfExists operations without reading down()', () => {
    expect(analyze("Schema::rename('users','members'); Schema::drop('posts'); Schema::dropIfExists('legacy');").operations).toMatchObject([
      {kind:'renameTable',table:'users',to:'members'}, {kind:'dropTable',table:'posts',ifExists:false}, {kind:'dropTable',table:'legacy',ifExists:true},
    ]);
    expect(analyze('').operations).toEqual([]);
  });
  it('preserves exact statement source and handles imports', () => {
    const result=analyzeMigration("<?php\nuse Illuminate\\Support\\Facades\\Schema as S;\nreturn new class extends Migration { function up() {\n S::rename('users','members');\n \\Illuminate\\Support\\Facades\\Schema::dropIfExists('missing');\n} };",'project/migrate.php');
    expect(result.complete).toBe(true);
    expect(result.operations.map(op=>op.source)).toEqual([{file:'project/migrate.php',line:4,column:1},{file:'project/migrate.php',line:5,column:1}]);
  });
  it.each([
    "Schema::rename('users');", "Schema::rename('users','members',true);", "Schema::rename('users',null);",
    "Schema::rename($table,'members');", "Schema::rename('users','');", "Schema::drop();",
    "Schema::drop(['users']);", "Schema::drop('users',true);", "Schema::dropIfExists(null);",
    "Schema::dropIfExists(table:'users');", "Schema::rename('users', env('TABLE'));",
  ])('rejects invalid or dynamic calls without a partial operation: %s', body => {
    const result=analyze(body);
    expect(result.complete).toBe(false);
    expect(result.operations).toEqual([]);
    expect(result.diagnostics[0].code).toBe('UNSUPPORTED_SCHEMA');
  });
  it.each(["Schema::hasTable('users');","Schema::dropAllTables();","Schema::disableForeignKeyConstraints();","if(true){Schema::drop('users');}","Schema::connection('x')->rename('users','members');"])('retains explicit exclusions: %s', body => {
    const result=analyze(body);
    expect(result.complete).toBe(false);
    expect(result.operations).toEqual([]);
  });
});

describe('immutable table lifecycle replay', () => {
  it('renames table metadata and all incoming references without renaming constraints', () => {
    const initial=related(), original=structuredClone(initial);
    const after=replay("Schema::rename('users','members'); Schema::rename('posts','articles');",initial);
    expect(initial).toEqual(original);
    expect(Object.keys(after.tables).sort()).toEqual(['articles','members']);
    expect(after.tables.members.name).toBe('members');
    expect(after.tables.articles.name).toBe('articles');
    expect(after.tables.articles.indexes.posts_id_primary.columns).toEqual(['id']);
    expect(after.tables.articles.foreignKeys.posts_user_id_foreign).toMatchObject({name:'posts_user_id_foreign',referencedTable:'members'});
    const dropped=replay("Schema::table('articles',function($t){$t->dropForeign('posts_user_id_foreign');});",after);
    expect(dropped.tables.articles.foreignKeys).toEqual({});
    expect(()=>replay("Schema::table('articles',function($t){$t->dropForeign(['user_id']);});",after)).toThrow('Unknown foreign key');
  });
  it('updates self references and retains the self constraint name', () => {
    const initial=replay(create('nodes',"$t->id(); $t->foreignId('parent_id')->nullable()->constrained('nodes');"));
    const after=replay("Schema::rename('nodes','tree');",initial);
    expect(after.tables.tree.foreignKeys.nodes_parent_id_foreign.referencedTable).toBe('tree');
    expect(initial.tables.nodes.foreignKeys.nodes_parent_id_foreign.referencedTable).toBe('nodes');
  });
  it.each(["Schema::rename('missing','new');","Schema::drop('missing');"])('fails for an unknown table: %s', body => expect(()=>replay(body)).toThrow('Unknown table'));
  it.each(["Schema::rename('users','posts');","Schema::rename('users','users');"])('rejects an occupied rename target: %s', body => expect(()=>replay(body,related())).toThrow('Table already exists'));
  it('dropIfExists on an absent table succeeds as a detached no-op', () => {
    const initial=related(), after=replay("Schema::dropIfExists('legacy');",initial);
    expect(after).toEqual(initial);
    expect(after).not.toBe(initial);
    after.tables.users.columns.id.nullable=true;
    expect(initial.tables.users.columns.id.nullable).toBe(false);
  });
  it.each(['drop','dropIfExists'])('%s does not bypass incoming foreign key protection', method => {
    expect(()=>replay(`Schema::${method}('users');`,related())).toThrow('Drop incoming foreign keys');
  });
  it('drops a child table with its indexes and outgoing keys, allowing the parent drop', () => {
    const initial=related();
    expect(replay("Schema::drop('posts'); Schema::drop('users');",initial)).toEqual(emptySchema());
    expect(initial.tables.posts.foreignKeys.posts_user_id_foreign).toBeDefined();
  });
  it('can drop a parent after explicitly removing the incoming constraint', () => {
    const after=replay("Schema::table('posts',function($t){$t->dropForeign(['user_id']);}); Schema::drop('users');",related());
    expect(Object.keys(after.tables)).toEqual(['posts']);
    expect(after.tables.posts.columns.user_id).toBeDefined();
  });
  it('removes self references with their owning table', () => {
    const initial=replay(create('nodes',"$t->id(); $t->foreignId('parent_id')->nullable()->constrained('nodes');"));
    expect(replay("Schema::drop('nodes');",initial)).toEqual(emptySchema());
  });
  it('checks incoming keys after rename and rolls back preceding operations on failure', () => {
    const initial=related(), original=structuredClone(initial);
    expect(()=>replay("Schema::rename('users','members'); Schema::dropIfExists('members');",initial)).toThrow('Drop incoming foreign keys');
    expect(initial).toEqual(original);
  });
  it('renaming to prototype-like identifiers preserves references without modifying prototypes', () => {
    const after=replay("Schema::rename('users','__proto__'); Schema::rename('posts','constructor');",related());
    expect(Object.keys(after.tables).sort()).toEqual(['__proto__','constructor']);
    expect(after.tables['constructor'].foreignKeys.posts_user_id_foreign.referencedTable).toBe('__proto__');
    expect(replay("Schema::drop('constructor'); Schema::drop('__proto__');",after)).toEqual(emptySchema());
  });
  it('supports drop/recreate of a name without retaining old columns or indexes', () => {
    const after=replay("Schema::drop('users');"+create('users',"$t->string('name');"),replay(create('users')));
    expect(after.tables.users.columns.id).toBeUndefined();
    expect(after.tables.users.indexes).toEqual({});
    expect(after.tables.users.columns.name).toBeDefined();
  });
});

describe('structural table lifecycle diff', () => {
  it('represents table rename as removed/added plus external reference change', () => {
    const before=related(), after=replay("Schema::rename('users','members');",before);
    const changes=diffSchemas(before,after).changes;
    expect(changes.map(c=>c.kind)).toEqual(['tableAdded','foreignKeyChanged','tableRemoved']);
    expect(changes[1]).toMatchObject({table:'posts',before:{referencedTable:'users'},after:{referencedTable:'members'}});
    expect(changes.filter(c=>c.kind==='columnAdded'||c.kind==='columnRemoved')).toEqual([]);
  });
  it('includes a whole removed table and detached nested keys', () => {
    const before=related(), after=replay("Schema::drop('posts');",before);
    const change=diffSchemas(before,after).changes[0];
    expect(change).toEqual({kind:'tableRemoved',table:'posts',before:before.tables.posts});
    if(change.kind!=='tableRemoved') throw new Error('Expected table removal');
    change.before.foreignKeys.posts_user_id_foreign.columns.push('other');
    expect(before.tables.posts.foreignKeys.posts_user_id_foreign.columns).toEqual(['user_id']);
  });
  it('compares net structure for rename-away/back and temporary tables', () => {
    const before=related();
    const after=replay("Schema::rename('users','members'); Schema::rename('members','users');"+create('scratch')+"Schema::drop('scratch');",before);
    expect(diffSchemas(before,after).changes).toEqual([]);
  });
});

// Independently specified table identity / relationship snapshots; old project goldens cover full JSON.
function summary(files: MigrationFile[]) {
  const result=analyzeProject(files);
  const snapshot=(state: SchemaState|null) => state===null ? null : Object.fromEntries(Object.entries(state.tables).map(([name,t])=>[name,{name:t.name,columns:Object.keys(t.columns).sort(),indexes:Object.keys(t.indexes).sort(),foreignKeys:t.foreignKeys}]));
  return {complete:result.complete,appliedCount:result.appliedCount,
    diagnostics:result.diagnostics.map(d=>({code:d.code,phase:d.phase,file:d.source.file,...(d.operationIndex!==undefined?{operationIndex:d.operationIndex}:{})})),
    migrations:result.migrations.map(m=>({filename:m.filename,status:m.status,before:snapshot(m.schemaBefore),after:snapshot(m.schemaAfter),changes:m.diff===null?null:m.diff.changes.map(c=>({kind:c.kind,table:c.table,...('foreignKey' in c?{foreignKey:c.foreignKey}:{})}))})),
    final:snapshot(result.finalSchema),lastValid:snapshot(result.lastValidSchema)};
}
describe('table lifecycle project goldens', () => {
  it('matches ordered create/rename/drop snapshots through an empty final schema', () => {
    expect(summary(names.map(fixture).reverse())).toEqual(JSON.parse(read('success.golden.json')));
  });
  it('rolls back a rename before a referenced drop and blocks subsequent replay', () => {
    const files=[fixture(names[3]),fixture('2026_04_03_000000_invalid_drop.php'),fixture(names[1]),fixture(names[0])];
    expect(summary(files)).toEqual(JSON.parse(read('blocked.golden.json')));
    const result=analyzeProject(files);
    expect(result.diagnostics[0]).toMatchObject({operationIndex:1,source:result.migrations[2].analysis.operations[1].source});
    expect(result.lastValidSchema.tables.articles).toBeDefined();
    expect(result.lastValidSchema.tables.entries).toBeUndefined();
    expect(result.migrations[3].analysis.complete).toBe(true);
  });
});
