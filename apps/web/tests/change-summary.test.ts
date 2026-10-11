import { describe, expect, it } from 'vitest';
import { summarizeChanges, displayValue } from '../src/change-summary';
import type { Column, SchemaDiff } from '@lmv/migration-core';
const column:Column={name:'price',type:'decimal',precision:8,scale:2,nullable:false};
describe('web change summary',()=>{
 it('shows only actual property changes, preserving absence and zero',()=>{
  const diff:SchemaDiff={changes:[{kind:'columnChanged',table:'products',column:'price',before:column,after:{...column,precision:10,nullable:true,default:0}}]};
  const saved=JSON.stringify(diff); const rows=summarizeChanges(diff)![0].changes[0].attributes;
  expect(rows.map(r=>[r.key,displayValue(r.before!),displayValue(r.after!)])).toEqual([
   ['definition','"decimal(8,2)"','"decimal(10,2)"'],['nullable','false','true'],['precision','8','10'],['default','未指定','0']]);
  expect(JSON.stringify(diff)).toBe(saved);
 });
 it('distinguishes own-property absence, null, false, zero and empty string',()=>{
  for(const value of [null,false,0,'']) {
   const row=summarizeChanges({changes:[{kind:'columnChanged',table:'t',column:'price',before:column,after:{...column,default:value}}]})![0].changes[0].attributes.find(r=>r.key==='default')!;
   expect(row.before).toEqual({present:false}); expect(row.after).toEqual({present:true,value});
  }
  expect(displayValue({present:true,value:null})).toBe('NULL');
  expect(displayValue({present:true,value:''})).toBe('""');
 });
 it('retains ordered arrays and groups by owning table, including special names',()=>{
  const groups=summarizeChanges({changes:[{kind:'indexChanged',table:'__proto__',index:'i',before:{name:'i',type:'index',columns:['a','b']},after:{name:'i',type:'index',columns:['b','a']}},{kind:'foreignKeyAdded',table:'posts',foreignKey:'fk',after:{name:'fk',columns:['b','a'],referencedTable:'users',referencedColumns:['y','x'],onDelete:'cascade'}}]})!;
  expect(groups.map(g=>g.table)).toEqual(['__proto__','posts']);
  expect(groups[0].changes[0].attributes[0].before!.value).toEqual(['a','b']);
  expect(groups[1].changes[0].after).toMatchObject({referencedTable:'users',referencedColumns:['y','x']});
 });
 it('keeps whole-table changes as single records and unknown separate from empty',()=>{
  expect(summarizeChanges(null)).toBeNull();expect(summarizeChanges({changes:[]})).toEqual([]);
  const table={name:'t',columns:{price:column},indexes:{},foreignKeys:{}};
  const groups=summarizeChanges({changes:[{kind:'tableRemoved',table:'t',before:table}]})!;
  expect(groups[0].changes).toHaveLength(1);expect(groups[0].changes[0].before).toBe(table);
 });
});

describe('ordered metadata and optional actions',()=>{
 it('treats allowedValues order as a real property change',()=>{
  const before={...column,type:'enum' as const,allowedValues:['small','large']};
  const row=summarizeChanges({changes:[{kind:'columnChanged',table:'t',column:'price',before,after:{...before,allowedValues:['large','small']}}]})![0].changes[0].attributes;
  expect(row.map(r=>r.key)).toEqual(['allowedValues']);expect(displayValue(row[0].after!)).toBe('"large" → "small"');
 });
 it('preserves foreign-key ordered fields, referenced order and absent actions',()=>{
  const before={name:'fk',columns:['a','b'],referencedTable:'users',referencedColumns:['x','y']};
  const after={...before,columns:['b','a'],referencedColumns:['y','x'],onDelete:'cascade' as const,onUpdate:'restrict' as const};
  const rows=summarizeChanges({changes:[{kind:'foreignKeyChanged',table:'posts',foreignKey:'fk',before,after}]})![0].changes[0].attributes;
  expect(rows.map(r=>r.key)).toEqual(['columns','referencedColumns','onDelete','onUpdate']);expect(rows[2].before).toEqual({present:false});expect(rows[2].after).toEqual({present:true,value:'cascade'});
 });
 it('distinguishes explicit false from absent optional flags and explicit null removal',()=>{
  const rows=summarizeChanges({changes:[{kind:'columnChanged',table:'t',column:'price',before:{...column,default:null},after:{...column,unsigned:false}}]})![0].changes[0].attributes;
  expect(rows.map(r=>r.key)).toEqual(['unsigned','default']);expect(rows[0].before).toEqual({present:false});expect(rows[0].after).toEqual({present:true,value:false});expect(rows[1].after).toEqual({present:false});
 });
});
