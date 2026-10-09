import { describe, expect, it } from 'vitest';
import { analyzeProject } from '../../../packages/migration-core/src/index.js';
import { migrationReading, objectAvailability, operationLabel } from '../src/migration-reading';
const file=(order:number,body:string)=>({filename:`2026_10_09_${String(order).padStart(6,'0')}_read.php`,source:`<?php return new class extends Migration {function up(){${body}}};`});
describe('single migration reading contract',()=>{
  it('distinguishes known no-op from failed and blocked unknown diffs',()=>{
    const r=analyzeProject([file(1,"Schema::dropIfExists('missing');"),file(2,"Schema::drop('missing');"),file(3,"Schema::dropIfExists('later');")]);
    expect(migrationReading(r.migrations[0],0).changes).toEqual([]);
    expect(migrationReading(r.migrations[1],1)).toMatchObject({status:'failed',beforeKnown:true,afterKnown:false,changes:null});
    expect(migrationReading(r.migrations[2],2)).toMatchObject({status:'blocked',beforeKnown:false,afterKnown:false,changes:null});
    expect(migrationReading(r.migrations[2],2).operations[0].status).toBe('blocked');
  });
  it('keeps explicit rename evidence separate from removed/added structural changes',()=>{
    const r=analyzeProject([file(1,"Schema::create('t',function($t){$t->string('a');});"),file(2,"Schema::table('t',function($t){$t->renameColumn('a','b');});")]);
    const reading=migrationReading(r.migrations[1],1);
    expect(operationLabel(reading.operations[0].operation)).toBe('renameColumn · t.a → b');
    expect(reading.changes?.map(c=>c.kind)).toEqual(['columnRemoved','columnAdded']);
    expect(reading.objects.find(o=>o.column==='a')).toMatchObject({before:'available',after:'object-absent'});
    expect(reading.objects.find(o=>o.column==='b')).toMatchObject({before:'object-absent',after:'available'});
  });
  it('supports each side of table rename without inventing identity',()=>{
    const r=analyzeProject([file(1,"Schema::create('a',function($t){});"),file(2,"Schema::rename('a','b');")]);
    const reading=migrationReading(r.migrations[1],1);
    expect(reading.objects).toContainEqual({table:'a',evidence:'structural',before:'available',after:'object-absent'});
    expect(reading.objects).toContainEqual({table:'b',evidence:'structural',before:'object-absent',after:'available'});
  });
  it('keeps syntactic mentions distinct when an atomic file fails',()=>{
    const r=analyzeProject([file(1,"Schema::create('t',function($t){$t->string('a');});"),file(2,"Schema::table('t',function($t){$t->string('b');$t->dropColumn('missing');});")]);
    const reading=migrationReading(r.migrations[1],1);
    expect(reading.objects.every(o=>o.evidence==='syntax' && o.after==='snapshot-unknown')).toBe(true);
    expect(reading.objects.find(o=>o.column==='b')?.before).toBe('object-absent');
    expect(reading.operations.every(op=>op.status==='failed')).toBe(true);
  });
  it('preserves literal prototype names and excludes inherited properties',()=>{
    expect(objectAvailability({tables:{}},{table:'constructor'})).toBe('object-absent');
    const tables=Object.create(null);tables.__proto__={name:'__proto__',columns:{},indexes:{},foreignKeys:{}};
    expect(objectAvailability({tables},{table:'__proto__',column:'constructor'})).toBe('object-absent');
    expect(objectAvailability(null,{table:'anything'})).toBe('snapshot-unknown');
  });
  it('returns stable migration/operation positions and leaves snapshots untouched',()=>{
    const r=analyzeProject([file(1,"Schema::create('t',function($t){$t->integer('a');});")]);const original=JSON.stringify(r);
    const reading=migrationReading(r.migrations[0],0);
    expect(reading.operations.map(op=>[op.migrationIndex,op.operationIndex])).toEqual([[0,0],[0,1]]);
    expect(JSON.stringify(r)).toBe(original);
  });
});
