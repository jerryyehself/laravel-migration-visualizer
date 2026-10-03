import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { analyzeMigration, analyzeProject, diffSchemas } from '../src/index.js';
const root=new URL('./fixtures/laravel-12/',import.meta.url);
const read=(name:string)=>readFileSync(new URL(name,root),'utf8');
const manifest=JSON.parse(read('provenance.json'));
const files=manifest.files.map(({filename}:{filename:string})=>({filename,source:read(filename)}));
const php=(body:string)=>`<?php return new class extends Migration { function up() { Schema::create('events',function($t){${body}}); } };`;
describe('Laravel 12 pinned compatibility baseline',()=>{
  it('preserves pinned upstream files byte-for-byte',()=>{
    expect(manifest.commit).toBe('e90c74ca717e9082d7463a2db50814fe565a3e44');
    for(const file of manifest.files) expect(createHash('sha256').update(readFileSync(new URL(file.filename,root))).digest('hex')).toBe(file.sha256);
  });
  it('matches the independently specified official migration inventory',()=>{
    const result=analyzeProject([...files].reverse());
    expect(result.complete).toBe(true); expect(result.diagnostics).toEqual([]);
    const schema=result.finalSchema!;
    expect({appliedCount:result.appliedCount,tables:Object.fromEntries(Object.entries(schema.tables).map(([name,t])=>[name,Object.keys(t.columns)])),indexCounts:Object.fromEntries(Object.entries(schema.tables).map(([name,t])=>[name,Object.keys(t.indexes).length])),foreignKeyCount:Object.values(schema.tables).reduce((sum,t)=>sum+Object.keys(t.foreignKeys).length,0)}).toEqual(JSON.parse(read('inventory.golden.json')));
    expect(schema.tables.failed_jobs.columns.failed_at).toMatchObject({type:'timestamp',useCurrent:true});
    expect(schema.tables.failed_jobs.columns.failed_at).not.toHaveProperty('default');
    expect(result.migrations.map(s=>Object.keys(s.schemaAfter!.tables).length)).toEqual([3,5,8]);
  });
  it.each(['timestamp','timestampTz'])('normalizes %s useCurrent as metadata, without a clock value',(type)=>{
    const result=analyzeMigration(php(`$t->${type}('at')->useCurrent()->nullable();`));
    expect(result.complete).toBe(true);
    expect(result.operations.find(o=>o.kind==='addColumn')).toMatchObject({column:{type,nullable:true,useCurrent:true}});
  });
  it.each(["$t->timestamp('at')->default(null)->useCurrent();","$t->timestamp('at')->useCurrent()->default('now');","$t->timestamp('at')->useCurrent(false);","$t->string('at')->useCurrent();"])('diagnoses unsupported or conflicting chain atomically: %s',(body)=>{
    const result=analyzeMigration(php(body)); expect(result.complete).toBe(false);
    expect(result.diagnostics[0].code).toBe('UNSUPPORTED_BLUEPRINT');
    expect(result.operations.some(o=>o.kind==='addColumn')).toBe(false);
  });
  it('keeps parameterized useCurrentOnUpdate unsupported and final state unknown',()=>{
    const source=php("$t->timestamp('at')->useCurrentOnUpdate(false);");
    const result=analyzeProject([{filename:'2026_01_01_000000_events.php',source}]);
    expect(result.complete).toBe(false); expect(result.finalSchema).toBeNull();
    expect(result.migrations[0].schemaAfter).toBeNull();
  });
  it('preserves new metadata through immutable replay, clone and structural diff',()=>{
    const result=analyzeProject([{filename:'2026_01_01_000000_events.php',source:php("$t->timestamp('at')->useCurrent();")}]);
    const before=result.finalSchema!; const after=structuredClone(before); delete after.tables.events.columns.at.useCurrent;
    expect(diffSchemas(before,after).changes).toMatchObject([{kind:'columnChanged',before:{useCurrent:true}}]);
    expect(before.tables.events.columns.at.useCurrent).toBe(true);
  });
});
