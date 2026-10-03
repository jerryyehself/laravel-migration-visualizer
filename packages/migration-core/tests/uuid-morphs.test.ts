import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeMigration, analyzeProject } from '../src/index.js';
const php=(body:string,method='table')=>`<?php return new class extends Migration { function up() { Schema::${method}('tags', function($t) { ${body} }); } };`;
const file=(day:number,body:string,method='table')=>({filename:`2026_10_0${day}_000000_tags.php`,source:php(body,method)});
describe('explicit UUID morph helpers',()=>{
  it.each(['uuidMorphs','nullableUuidMorphs'])('expands %s without numeric or DB-specific metadata',method=>{
    const r=analyzeMigration(php(`$t->${method}('taggable');`),'uuid.php');
    expect(r.complete).toBe(true);
    expect(r.operations).toMatchObject([{kind:'addColumn',column:{name:'taggable_type',type:'string',length:255,nullable:method.startsWith('nullable')}},{kind:'addColumn',column:{name:'taggable_id',type:'uuid',nullable:method.startsWith('nullable')}},{kind:'addIndex',index:{name:'tags_taggable_type_taggable_id_index',type:'index',columns:['taggable_type','taggable_id']}}]);
    const id=r.operations[1];if(id.kind==='addColumn')expect(id.column).toEqual({name:'taggable_id',type:'uuid',nullable:method.startsWith('nullable')});
    expect(r.operations.every(o=>JSON.stringify(o.source)===JSON.stringify(r.operations[0].source))).toBe(true);
  });
  it.each(["'taggable'","'taggable',null","'taggable','custom'"])('accepts shared naming semantics for %s',args=>{
    const r=analyzeProject([file(1,`$t->uuidMorphs(${args});`,'create')]);expect(r.complete).toBe(true);
    expect(Object.keys(r.finalSchema!.tables.tags.indexes)).toEqual([args.includes('custom')?'custom':'tags_taggable_type_taggable_id_index']);
  });
  it.each(["$t->uuidMorphs($name);","$t->uuidMorphs('x',null,'after');","$t->nullableUuidMorphs('x')->nullable();","$t->uuidMorphs('x')->change();"])('rejects unsupported syntax %s',body=>{
    const r=analyzeMigration(php(body));expect(r.complete).toBe(false);expect(r.operations).toEqual([]);
  });
  it.each(['numericMorphs','uuidMorphs'])('uses the default index for PHP-falsy string zero in %s',method=>{
    const r=analyzeProject([file(1,`$t->${method}('taggable','0');`,'create')]);expect(r.complete).toBe(true);
    expect(Object.keys(r.finalSchema!.tables.tags.indexes)).toEqual(['tags_taggable_type_taggable_id_index']);
  });
  it('allows numeric and UUID morphs together without foreign keys',()=>{
    const r=analyzeProject([file(1,"$t->numericMorphs('n'); $t->nullableUuidMorphs('u');",'create')]);expect(r.complete).toBe(true);
    expect(r.finalSchema!.tables.tags.columns.n_id).toMatchObject({type:'bigInteger',unsigned:true,nullable:false});
    expect(r.finalSchema!.tables.tags.columns.u_id).toEqual({name:'u_id',type:'uuid',nullable:true});expect(r.finalSchema!.tables.tags.foreignKeys).toEqual({});
  });
  it('rolls back a UUID second-column collision and blocks subsequent snapshots',()=>{
    const r=analyzeProject([file(1,"$t->uuid('taggable_id');",'create'),file(2,"$t->uuidMorphs('taggable');"),file(3,"$t->string('later');")]);
    expect(r.migrations.map(m=>m.status)).toEqual(['applied','failed','blocked']);expect(r.finalSchema).toBeNull();expect(Object.keys(r.lastValidSchema.tables.tags.columns)).toEqual(['taggable_id']);
    expect(r.diagnostics[0]).toMatchObject({operationIndex:1});expect(r.migrations[2].schemaBefore).toBeNull();
  });
  it('isolates UUID snapshots, index arrays and diff payloads',()=>{
    const r=analyzeProject([file(1,"$t->string('keep');",'create'),file(2,"$t->uuidMorphs('__proto__','constructor');")]);expect(r.complete).toBe(true);
    const key:string='constructor';r.migrations[1].schemaAfter!.tables.tags.indexes[key].columns[0]='mutated';r.migrations[1].schemaAfter!.tables.tags.columns.__proto___id.type='mutated';
    expect(r.finalSchema!.tables.tags.columns.__proto___id.type).toBe('uuid');expect(r.finalSchema!.tables.tags.indexes[key].columns).toEqual(['__proto___type','__proto___id']);
    expect(r.migrations[1].diff!.changes.find(c=>c.kind==='columnAdded'&&c.column==='__proto___id')).toMatchObject({after:{type:'uuid'}});
  });
  it('matches independently authored UUID multi-file success/blocked goldens',()=>{
    const root=new URL('./fixtures/uuid-morphs/',import.meta.url),read=(n:string)=>readFileSync(new URL(n,root),'utf8');
    const run=(middle:string)=>analyzeProject(['2026_10_03_000000_later.php',middle,'2026_10_01_000000_create.php'].map(filename=>({filename,source:read(filename)})));
    const view=(r:ReturnType<typeof analyzeProject>)=>({complete:r.complete,appliedCount:r.appliedCount,steps:r.migrations.map(m=>({status:m.status,before:m.schemaBefore,after:m.schemaAfter,diff:m.diff})),finalSchema:r.finalSchema,lastValidSchema:r.lastValidSchema,diagnosticCodes:r.diagnostics.map(d=>d.code)});
    expect(view(run('2026_10_02_000000_add.php'))).toEqual(JSON.parse(read('success.golden.json')));expect(view(run('2026_10_02_000000_bad.php'))).toEqual(JSON.parse(read('blocked.golden.json')));
  });
});
