import { readdirSync,readFileSync } from 'node:fs';
import { describe,expect,it } from 'vitest';
import { analyzeProject,type MigrationFile } from '../src/index.js';
const root=new URL('./fixtures/commerce/',import.meta.url);
const files=()=>readdirSync(root).filter(n=>n.endsWith('.php')).map(filename=>({filename,source:readFileSync(new URL(filename,root),'utf8')}));
describe('v1 authored commerce acceptance',()=>{
  it('replays twelve reversed migrations into the independently authored schema',()=>{
    const r=analyzeProject(files().reverse());expect(r.complete).toBe(true);expect(r.appliedCount).toBe(12);expect(r.diagnostics).toEqual([]);
    expect(r.finalSchema).toEqual(JSON.parse(readFileSync(new URL('final.golden.json',root),'utf8')));
    for(let i=1;i<r.migrations.length;i++)expect(r.migrations[i].schemaBefore).toEqual(r.migrations[i-1].schemaAfter);
  });
  it('retains all earlier state when migration ten fails after removing a morph pair',()=>{
    const input=files();input[9].source=input[9].source.replace("$t->dropMorphs('attachable');","$t->dropMorphs('attachable'); $t->dropColumn('missing');");
    const r=analyzeProject(input);expect(r.appliedCount).toBe(9);expect(r.finalSchema).toBeNull();expect(r.migrations.slice(9).map(m=>m.status)).toEqual(['failed','blocked','blocked']);
    expect(r.lastValidSchema).toEqual(r.migrations[8].schemaAfter);expect(r.migrations[9].schemaBefore).toEqual(r.lastValidSchema);expect(r.migrations[9].schemaAfter).toBeNull();expect(r.migrations[9].diff).toBeNull();
    expect(r.lastValidSchema.tables.attachments.columns.attachable_id).toBeDefined();expect(r.lastValidSchema.tables.attachments.columns.owner_id.type).toBe('uuid');
    expect(r.diagnostics.map(d=>d.code)).toEqual(['SCHEMA_REPLAY_ERROR','SCHEMA_BLOCKED','SCHEMA_BLOCKED']);expect(r.diagnostics[0]).toMatchObject({operationIndex:3});
    for(const m of r.migrations.slice(10)){expect(m.schemaBefore).toBeNull();expect(m.schemaAfter).toBeNull();expect(m.diff).toBeNull();expect(m.analysis.complete).toBe(true);}
  });
  it('does not replay an incomplete file or contaminate input files',()=>{
    const input=files();input[9].source=input[9].source.replace("$t->dropMorphs('attachable');","$t->dropMorphs('attachable'); $t->unknownApi();");const original=structuredClone(input);
    const r=analyzeProject(input);expect(r.appliedCount).toBe(9);expect(r.lastValidSchema.tables.attachments.columns.attachable_id).toBeDefined();expect(input).toEqual(original);expect(r.diagnostics[0].phase).toBe('analysis');
  });
  it('keeps final schema, snapshots and foreign-key diff payloads independent',()=>{
    const r=analyzeProject(files());r.migrations[3].schemaAfter!.tables.order_items.foreignKeys.order_items_order_id_foreign.columns[0]='mutated';
    expect(r.finalSchema!.tables.order_items.foreignKeys.order_items_order_id_foreign.columns).toEqual(['order_id']);
    expect(r.migrations[3].diff!.changes[0]).toMatchObject({after:{foreignKeys:{order_items_order_id_foreign:{columns:['order_id']}}}});
  });
  it.each([250,1000])('keeps every ordered snapshot in a %i-file synthetic project',count=>{
    const input:MigrationFile[]=Array.from({length:count},(_,i)=>({filename:`2026_10_04_${String(i).padStart(6,'0')}_scale.php`,source:`<?php return new class extends Migration { function up() { Schema::create('t${i}',function($t){$t->string('value');}); } };`}));
    const r=analyzeProject(input.reverse());expect(r.complete).toBe(true);expect(r.appliedCount).toBe(count);expect(Object.keys(r.finalSchema!.tables)).toHaveLength(count);expect(Object.keys(r.migrations[0].schemaAfter!.tables)).toHaveLength(1);expect(r.diagnostics).toEqual([]);
  },30000);
});
