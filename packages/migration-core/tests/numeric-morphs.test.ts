import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeMigration, analyzeProject } from '../src/index.js';
const php=(body:string,method='table')=>`<?php return new class extends Migration { function up() { Schema::${method}('tags', function($t) { ${body} }); } };`;
const file=(day:number,body:string,method='table')=>({filename:`2026_10_0${day}_000000_tags.php`,source:php(body,method)});
describe('explicit numeric morph helpers',()=>{
  it.each(['numericMorphs','nullableNumericMorphs'])('expands %s in column/index order without inventing a foreign key',method=>{
    const r=analyzeMigration(php(`$t->${method}('taggable');`),'morph.php');
    expect(r.complete).toBe(true);
    expect(r.operations).toMatchObject([
      {kind:'addColumn',column:{name:'taggable_type',type:'string',length:255,nullable:method.startsWith('nullable')}},
      {kind:'addColumn',column:{name:'taggable_id',type:'bigInteger',unsigned:true,nullable:method.startsWith('nullable')}},
      {kind:'addIndex',index:{name:'tags_taggable_type_taggable_id_index',type:'index',columns:['taggable_type','taggable_id']}},
    ]);
    expect(r.operations.every(o=>JSON.stringify(o.source)===JSON.stringify(r.operations[0].source))).toBe(true);
  });
  it.each(["'taggable'","'taggable',null","'taggable','custom'"])('supports omitted/null/custom index name %s',args=>{
    const r=analyzeProject([file(1,`$t->numericMorphs(${args});`,'create')]);
    expect(r.complete).toBe(true);
    expect(Object.keys(r.finalSchema!.tables.tags.indexes)).toEqual([args.includes('custom')?'custom':'tags_taggable_type_taggable_id_index']);
    expect(r.finalSchema!.tables.tags.foreignKeys).toEqual({});
  });
  it.each(['',"''",'null',"['taggable']",'$name',"'taggable',false","'taggable',''","'taggable',null,'after'"])('rejects unsupported arguments %s',args=>{
    const r=analyzeMigration(php(`$t->numericMorphs(${args});`));expect(r.complete).toBe(false);expect(r.operations).toEqual([]);
  });
  it.each(["$t->numericMorphs('x')->nullable();","$t->nullableNumericMorphs('x')->index();","$t->numericMorphs('x')->change();","$t->morphs('x');","$t->nullableMorphs('x');"])('rejects modifiers and runtime-dependent helpers %s',body=>{
    const r=analyzeMigration(php(body));expect(r.complete).toBe(false);expect(r.operations).toEqual([]);
  });
  it('rolls back both columns if the generated index name already exists',()=>{
    const initial=analyzeProject([file(1,"$t->string('keep')->index('tags_taggable_type_taggable_id_index');",'create')]).finalSchema!;
    const r=analyzeProject([file(2,"$t->numericMorphs('taggable');"),file(3,"$t->string('later');")],{initialSchema:initial});
    expect(r.migrations.map(m=>m.status)).toEqual(['failed','blocked']);expect(r.lastValidSchema).toEqual(initial);expect(r.finalSchema).toBeNull();
    expect(r.diagnostics[0]).toMatchObject({operationIndex:2});expect(r.migrations[1].schemaBefore).toBeNull();
  });
  it('keeps a second-column collision atomic',()=>{
    const initial=analyzeProject([file(1,"$t->integer('taggable_id');",'create')]).finalSchema!;
    const r=analyzeProject([file(2,"$t->numericMorphs('taggable');")],{initialSchema:initial});
    expect(r.complete).toBe(false);expect(r.lastValidSchema).toEqual(initial);expect(r.diagnostics[0]).toMatchObject({operationIndex:1});
  });
  it('isolates successful snapshots and compound index arrays',()=>{
    const r=analyzeProject([file(1,"$t->string('keep');",'create'),file(2,"$t->numericMorphs('__proto__','constructor');")]);
    expect(r.complete).toBe(true);expect(Object.hasOwn(r.finalSchema!.tables.tags.indexes,'constructor')).toBe(true);
    const indexName:string='constructor';
    r.migrations[1].schemaAfter!.tables.tags.indexes[indexName].columns[0]='mutated';
    expect(r.finalSchema!.tables.tags.indexes[indexName].columns).toEqual(['__proto___type','__proto___id']);
    expect(r.migrations[1].schemaBefore!.tables.tags.columns).toEqual({keep:{name:'keep',type:'string',length:255,nullable:false}});
    expect(r.migrations[1].diff!.changes.find(c=>c.kind==='indexAdded')).toMatchObject({after:{columns:['__proto___type','__proto___id']}});
  });
  it('matches independently authored success/blocked multi-file golden',()=>{
    const root=new URL('./fixtures/numeric-morphs/',import.meta.url),read=(n:string)=>readFileSync(new URL(n,root),'utf8');
    const run=(middle:string)=>analyzeProject(['2026_10_03_000000_later.php',middle,'2026_10_01_000000_create.php'].map(filename=>({filename,source:read(filename)})));
    const view=(r:ReturnType<typeof analyzeProject>)=>({complete:r.complete,appliedCount:r.appliedCount,steps:r.migrations.map(m=>({status:m.status,before:m.schemaBefore,after:m.schemaAfter,diff:m.diff})),finalSchema:r.finalSchema,lastValidSchema:r.lastValidSchema,diagnosticCodes:r.diagnostics.map(d=>d.code)});
    expect(view(run('2026_10_02_000000_add.php'))).toEqual(JSON.parse(read('success.golden.json')));
    expect(view(run('2026_10_02_000000_bad.php'))).toEqual(JSON.parse(read('blocked.golden.json')));
  });
});
