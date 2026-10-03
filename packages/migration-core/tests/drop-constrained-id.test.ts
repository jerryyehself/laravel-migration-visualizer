import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeMigration, analyzeProject } from '../src/index.js';
const php = (body: string, table = 'posts', method = 'table') => `<?php return new class extends Migration { function up() { Schema::${method}('${table}', function($t) { ${body} }); } };`;
const file = (day: number, body: string, table = 'posts', method = 'table') => ({ filename:`2026_10_0${day}_000000_example.php`,source:php(body,table,method) });
const setup = (extra = '', name?: string) => analyzeProject([
  file(1,"$t->id();",'users','create'),
  file(2,"$t->string('keep'); $t->foreignId('user_id')->constrained('users','id'" + (name ? `,'${name}'` : '') + '); ' + extra,'posts','create'),
]).finalSchema!;
const drop = file(3,"$t->dropConstrainedForeignId('user_id');");
describe('dropConstrainedForeignId', () => {
  it('expands foreign-key removal before column removal with common source', () => {
    const result = analyzeMigration(drop.source,'helper.php');
    expect(result.complete).toBe(true);
    expect(result.operations).toMatchObject([{ kind:'dropForeignKey',table:'posts',name:'posts_user_id_foreign' },{ kind:'dropColumn',table:'posts',column:'user_id' }]);
    expect(result.operations[0].source).toEqual(result.operations[1].source);
    expect(result.operations[0].source).toMatchObject({file:'helper.php',line:1});
  });
  it('uses the existing Laravel naming convention', () => {
    const result = analyzeMigration(php("$t->dropConstrainedForeignId('User-ID');",'Blog.Posts'));
    expect(result.operations[0]).toMatchObject({ name:'blog_posts_user_id_foreign' });
    expect(result.operations[1]).toMatchObject({ column:'User-ID',table:'Blog.Posts' });
  });
  it.each(['',"''",'null','false','42',"['user_id']",'$column',"'user_id','custom'"])('rejects unsupported argument %s without partial operations', args => {
    const result = analyzeMigration(php(`$t->dropConstrainedForeignId(${args});`));
    expect(result.complete).toBe(false);
    expect(result.operations).toEqual([]);
    expect(result.diagnostics.map(d => d.code)).toEqual(['UNSUPPORTED_BLUEPRINT']);
  });
  it.each(["$t->dropConstrainedForeignId('user_id')->comment('x');", "$t->foreignId('user_id')->dropConstrainedForeignId('user_id');", "$t->dropConstrainedForeignId('user_id')->change();", "$t->dropConstrainedForeignIdFor(User::class);"])('rejects unsupported chain or model helper %s', body => {
    const result = analyzeMigration(php(body));
    expect(result.complete).toBe(false);
    expect(result.operations).toEqual([]);
  });
  it('removes only the conventional key and column, preserving parent and unrelated data', () => {
    const initial = setup(), original = structuredClone(initial);
    const result = analyzeProject([drop],{ initialSchema:initial });
    expect(result.complete).toBe(true);
    expect(result.finalSchema!.tables.posts).toEqual({ name:'posts',columns:{ keep:{name:'keep',type:'string',length:255,nullable:false} },indexes:{},foreignKeys:{} });
    expect(result.finalSchema!.tables.users).toEqual(initial.tables.users);
    expect(initial).toEqual(original);
    expect(result.migrations[0].diff!.changes.map(c => c.kind)).toEqual(['columnRemoved','foreignKeyRemoved']);
    result.migrations[0].schemaBefore!.tables.posts.foreignKeys.posts_user_id_foreign.columns[0] = 'mutated';
    expect(initial.tables.posts.foreignKeys.posts_user_id_foreign.columns).toEqual(['user_id']);
    expect(result.migrations[0].diff!.changes[1]).toMatchObject({ before:{columns:['user_id']} });
    result.migrations[0].schemaAfter!.tables.posts.columns.keep.type = 'snapshot';
    expect(result.finalSchema!.tables.posts.columns.keep.type).toBe('string');
  });
  it.each(['index','unique','primary'])('rolls back the removed foreign key if an existing %s blocks the column', type => {
    const initial = setup(`$t->${type}('user_id','guard');`), original=structuredClone(initial);
    const result = analyzeProject([drop],{ initialSchema:initial });
    expect(result.complete).toBe(false);
    expect(result.lastValidSchema).toEqual(original);
    expect(initial).toEqual(original);
    expect(result.diagnostics[0]).toMatchObject({code:'SCHEMA_REPLAY_ERROR',operationIndex:1,source:{file:drop.filename}});
    expect(result.diagnostics[0].message).toContain('indexes');
    expect(result.migrations[0].schemaAfter).toBeNull();
  });
  it('permits explicitly dropping an index before the helper', () => {
    const result=analyzeProject([file(3,"$t->dropIndex('guard'); $t->dropConstrainedForeignId('user_id');")],{initialSchema:setup("$t->index('user_id','guard');")});
    expect(result.complete).toBe(true);
    expect(Object.keys(result.finalSchema!.tables.posts.columns)).toEqual(['keep']);
  });
  it('does not search for a custom foreign-key name', () => {
    const initial=setup('','custom');
    const result=analyzeProject([drop],{initialSchema:initial});
    expect(result.complete).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({operationIndex:0});
    expect(result.diagnostics[0].message).toContain('Unknown foreign key');
    expect(result.lastValidSchema).toEqual(initial);
    const explicit=analyzeProject([file(3,"$t->dropForeign('custom'); $t->dropColumn('user_id');")],{initialSchema:initial});
    expect(explicit.complete).toBe(true);
  });
  it('rejects a column with no foreign key rather than silently deleting it', () => {
    const initial=analyzeProject([file(1,"$t->foreignId('user_id');",'posts','create')]).finalSchema!;
    const result=analyzeProject([drop],{initialSchema:initial});
    expect(result.complete).toBe(false);
    expect(result.lastValidSchema).toEqual(initial);
    expect(result.diagnostics[0]).toMatchObject({operationIndex:0});
  });
  it('preserves all keys when another outgoing foreign key protects the same column', () => {
    const initial=setup("$t->foreign('user_id','other')->references('id')->on('users');");
    const result=analyzeProject([drop],{initialSchema:initial});
    expect(result.complete).toBe(false);
    expect(result.lastValidSchema).toEqual(initial);
    expect(result.diagnostics[0]).toMatchObject({operationIndex:1});
  });
  it('preserves the outgoing key when an incoming foreign key protects the column', () => {
    const initial=analyzeProject([file(3,"$t->foreignId('owner_id'); $t->foreign('owner_id')->references('user_id')->on('posts');",'comments','create')],{initialSchema:setup()}).finalSchema!;
    const result=analyzeProject([file(4,"$t->dropConstrainedForeignId('user_id');")],{initialSchema:initial});
    expect(result.complete).toBe(false);
    expect(result.lastValidSchema).toEqual(initial);
    expect(result.diagnostics[0]).toMatchObject({operationIndex:1});
  });
  it('handles prototype-like column names', () => {
    const initial=analyzeProject([file(1,"$t->integer('constructor'); $t->foreign('constructor')->references('constructor')->on('posts');",'posts','create')]).finalSchema!;
    const result=analyzeProject([file(2,"$t->dropConstrainedForeignId('constructor');")],{initialSchema:initial});
    expect(result.complete).toBe(true);
    expect(result.finalSchema!.tables.posts.columns).toEqual({});
    expect(Object.hasOwn(initial.tables.posts.columns,'constructor')).toBe(true);
  });
  it('matches independently authored cross-file success and blocked goldens', () => {
    const root=new URL('./fixtures/drop-constrained-id/',import.meta.url);
    const read=(name:string)=>readFileSync(new URL(name,root),'utf8');
    const run=(middle:string)=>analyzeProject(['2026_10_04_000000_add_later.php',middle,'2026_10_02_000000_create_posts.php','2026_10_01_000000_create_users.php'].map(filename=>({filename,source:read(filename)})));
    const view=(r:ReturnType<typeof analyzeProject>)=>({complete:r.complete,appliedCount:r.appliedCount,finalSchema:r.finalSchema,lastValidSchema:r.lastValidSchema,steps:r.migrations.map(m=>({status:m.status,before:m.schemaBefore,after:m.schemaAfter,diff:m.diff})),diagnosticCodes:r.diagnostics.map(d=>d.code)});
    expect(view(run('2026_10_03_000000_drop_owner.php'))).toEqual(JSON.parse(read('success.golden.json')));
    expect(view(run('2026_10_03_000000_bad_owner.php'))).toEqual(JSON.parse(read('blocked.golden.json')));
  });
});
