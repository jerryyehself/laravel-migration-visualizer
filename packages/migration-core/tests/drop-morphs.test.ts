import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeMigration, analyzeProject } from '../src/index.js';
const php=(body:string,method='table',table='tags')=>`<?php return new class extends Migration { function up() { Schema::${method}('${table}', function($t) { ${body} }); } };`;
const file=(day:number,body:string,method='table',table='tags')=>({filename:`2026_10_0${day}_000000_tags.php`,source:php(body,method,table)});
const setup=(helper='numericMorphs',extra='',index='')=>analyzeProject([file(1,`$t->string('keep'); $t->${helper}('taggable'${index?`, '${index}'`:''}); ${extra}`,'create')]).finalSchema!;
describe('dropMorphs',()=>{
  it('drops the ordered compound index before type and id with a common source',()=>{
    const r=analyzeMigration(php("$t->dropMorphs('taggable');"),'drop.php');expect(r.complete).toBe(true);
    expect(r.operations).toMatchObject([{kind:'dropIndex',table:'tags',name:'tags_taggable_type_taggable_id_index',indexType:'index'},{kind:'dropColumn',table:'tags',column:'taggable_type'},{kind:'dropColumn',table:'tags',column:'taggable_id'}]);
    expect(r.operations.every(o=>JSON.stringify(o.source)===JSON.stringify(r.operations[0].source))).toBe(true);
  });
  it.each(['numericMorphs','nullableNumericMorphs','uuidMorphs','nullableUuidMorphs'])('removes a %s pair without changing unrelated data',helper=>{
    const initial=setup(helper),original=structuredClone(initial),r=analyzeProject([file(2,"$t->dropMorphs('taggable');")],{initialSchema:initial});
    expect(r.complete).toBe(true);expect(r.finalSchema!.tables.tags).toEqual({name:'tags',columns:{keep:{name:'keep',type:'string',length:255,nullable:false}},indexes:{},foreignKeys:{}});expect(initial).toEqual(original);
    expect(r.migrations[0].diff!.changes.map(c=>c.kind)).toEqual(['columnRemoved','columnRemoved','indexRemoved']);
    r.migrations[0].schemaBefore!.tables.tags.indexes.tags_taggable_type_taggable_id_index.columns[0]='mutated';
    expect(initial.tables.tags.indexes.tags_taggable_type_taggable_id_index.columns).toEqual(['taggable_type','taggable_id']);
    expect(r.migrations[0].diff!.changes[2]).toMatchObject({before:{columns:['taggable_type','taggable_id']}});
  });
  it.each(["'taggable'","'taggable',null","'taggable','0'"])('uses the convention for %s',args=>{
    expect(analyzeProject([file(2,`$t->dropMorphs(${args});`)],{initialSchema:setup()}).complete).toBe(true);
  });
  it('requires the explicit custom index name and does not search by columns',()=>{
    const initial=setup('uuidMorphs','','custom');
    const bad=analyzeProject([file(2,"$t->dropMorphs('taggable');")],{initialSchema:initial});expect(bad.complete).toBe(false);expect(bad.lastValidSchema).toEqual(initial);expect(bad.diagnostics[0]).toMatchObject({operationIndex:0});
    expect(analyzeProject([file(2,"$t->dropMorphs('taggable','custom');")],{initialSchema:initial}).complete).toBe(true);
  });
  it.each(['',"''",'null',"['taggable']",'$name',"'taggable',false","'taggable',''","'taggable','index','extra'"])('rejects unsupported %s without partial operations',args=>{
    const r=analyzeMigration(php(`$t->dropMorphs(${args});`));expect(r.complete).toBe(false);expect(r.operations).toEqual([]);
  });
  it.each(["$t->dropMorphs('taggable')->nullable();","$t->dropMorphs('taggable')->change();"])('rejects chained syntax %s',body=>{
    const r=analyzeMigration(php(body));expect(r.complete).toBe(false);expect(r.operations).toEqual([]);
  });
  it.each(['index','unique','primary'])('rolls back the first index and type removal when id has another %s',type=>{
    const initial=setup('numericMorphs',`$t->${type}('taggable_id','guard');`),r=analyzeProject([file(2,"$t->dropMorphs('taggable');"),file(3,"$t->string('later');")],{initialSchema:initial});
    expect(r.migrations.map(m=>m.status)).toEqual(['failed','blocked']);expect(r.lastValidSchema).toEqual(initial);expect(r.finalSchema).toBeNull();
    expect(r.diagnostics[0]).toMatchObject({operationIndex:2});expect(r.migrations[0].schemaAfter).toBeNull();expect(r.migrations[1].schemaBefore).toBeNull();
  });
  it('allows an explicit additional index drop before the helper',()=>{
    const initial=setup('numericMorphs',"$t->index('taggable_id','guard');");
    const r=analyzeProject([file(2,"$t->dropIndex('guard'); $t->dropMorphs('taggable');")],{initialSchema:initial});expect(r.complete).toBe(true);
  });
  it.each(['outgoing','incoming'])('keeps an %s foreign key and the whole pair when removal fails',direction=>{
    let initial=setup('numericMorphs',direction==='outgoing'?"$t->foreign('taggable_id')->references('taggable_id')->on('tags');":'');
    if(direction==='incoming')initial=analyzeProject([file(2,"$t->unsignedBigInteger('ref'); $t->foreign('ref')->references('taggable_id')->on('tags');",'create','refs')],{initialSchema:initial}).finalSchema!;
    const r=analyzeProject([file(3,"$t->dropMorphs('taggable');")],{initialSchema:initial});expect(r.complete).toBe(false);expect(r.lastValidSchema).toEqual(initial);expect(r.diagnostics[0]).toMatchObject({operationIndex:2});
  });
  it('rolls back index/type removal when the second column is missing',()=>{
    const initial=analyzeProject([file(1,"$t->string('taggable_type'); $t->index('taggable_type','custom');",'create')]).finalSchema!;
    const r=analyzeProject([file(2,"$t->dropMorphs('taggable','custom');")],{initialSchema:initial});expect(r.complete).toBe(false);expect(r.lastValidSchema).toEqual(initial);expect(r.diagnostics[0]).toMatchObject({operationIndex:2});
  });
  it('supports special names without prototype collisions',()=>{
    const initial=analyzeProject([file(1,"$t->uuidMorphs('__proto__','constructor');",'create')]).finalSchema!;
    const r=analyzeProject([file(2,"$t->dropMorphs('__proto__','constructor');")],{initialSchema:initial});expect(r.complete).toBe(true);expect(r.finalSchema!.tables.tags.columns).toEqual({});expect(r.finalSchema!.tables.tags.indexes).toEqual({});
  });
  it('matches independent mixed numeric/UUID lifecycle success and blocked goldens',()=>{
    const root=new URL('./fixtures/drop-morphs/',import.meta.url),read=(n:string)=>readFileSync(new URL(n,root),'utf8');
    const run=(middle:string)=>analyzeProject(['2026_10_03_000000_later.php',middle,'2026_10_01_000000_create.php'].map(filename=>({filename,source:read(filename)})));
    const view=(r:ReturnType<typeof analyzeProject>)=>({complete:r.complete,appliedCount:r.appliedCount,steps:r.migrations.map(m=>({status:m.status,before:m.schemaBefore,after:m.schemaAfter,diff:m.diff})),finalSchema:r.finalSchema,lastValidSchema:r.lastValidSchema,diagnosticCodes:r.diagnostics.map(d=>d.code)});
    const success=run('2026_10_02_000000_drop.php'),blocked=run('2026_10_02_000000_bad.php');
    expect(view(success)).toEqual(JSON.parse(read('success.golden.json')));expect(view(blocked)).toEqual(JSON.parse(read('blocked.golden.json')));expect(blocked.diagnostics[0]).toMatchObject({operationIndex:3});
  });
});
