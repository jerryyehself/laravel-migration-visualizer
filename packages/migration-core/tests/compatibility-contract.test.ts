import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeMigration } from '../src/index.js';
const cases=JSON.parse(readFileSync(new URL('./fixtures/compatibility/cases.json',import.meta.url),'utf8')) as {id:string;body:string;complete:boolean;operations:object[]}[];
describe('v1 compatibility contract',()=>{
  it.each(cases)('$id retains an explicit supported/unsupported boundary',row=>{
    const source=`<?php return new class extends Migration { function up() { Schema::table('items', function($t) { ${row.body} }); } };`;
    const r=analyzeMigration(source,row.id+'.php');
    expect(r.complete).toBe(row.complete);expect(r.operations).toMatchObject(row.operations);expect(r.operations).toHaveLength(row.operations.length);
    expect(r.diagnostics.map(d=>d.code)).toEqual(row.complete?[]:['UNSUPPORTED_BLUEPRINT']);
    expect(r.operations.every(o=>o.source.file===row.id+'.php')).toBe(true);
  });
});
