import type { SchemaChange, SchemaDiff } from '@lmv/migration-core';
export type Value = {present:false} | {present:true;value:unknown};
export type Attribute = {key:string;label:string;before?:Value;after?:Value};
export type SummaryChange = {kind:SchemaChange['kind']; table:string; name:string; category:'table'|'column'|'index'|'foreignKey'; before?:object; after?:object; attributes:Attribute[]};
const fields:Record<string,string>={name:'名稱',type:'型別',nullable:'允許 NULL',unsigned:'無號',autoIncrement:'自增',primary:'欄位 primary metadata',length:'長度',precision:'精度',scale:'小數位數',allowedValues:'允許值（依序）',default:'預設值',useCurrent:'目前時間',useCurrentOnUpdate:'更新時目前時間',comment:'註解',columns:'所屬欄位（依序）',referencedTable:'引用資料表',referencedColumns:'引用欄位（依序）',onDelete:'刪除動作',onUpdate:'更新動作'};
function own(object:object,key:string):Value {return Object.hasOwn(object,key)?{present:true,value:(object as Record<string,unknown>)[key]}:{present:false};}
function equal(a:Value,b:Value):boolean {
 if(a.present!==b.present)return false;if(!a.present||!b.present)return true;
 const av=a.value,bv=b.value;
 return Array.isArray(av)&&Array.isArray(bv)?av.length===bv.length&&av.every((v,i)=>v===bv[i]):av===bv;
}
export function displayValue(value:Value):string {
 if(!value.present)return '未指定';if(value.value===null)return 'NULL';
 if(Array.isArray(value.value))return value.value.map(v=>JSON.stringify(v)).join(' → ');
 return typeof value.value==='string'?JSON.stringify(value.value):String(value.value);
}
function definition(object:object):string {
 const c=object as Record<string,unknown>;
 const dimensions=['length','precision','scale'].filter(key=>Object.hasOwn(c,key)).map(key=>String(c[key]));
 return String(c.type)+(dimensions.length?`(${dimensions.join(',')})`:'');
}
export function attributes(before:object|undefined,after:object|undefined,category:SummaryChange['category']):Attribute[] {
 const keys=category==='column'?['name','type','nullable','unsigned','autoIncrement','primary','length','precision','scale','allowedValues','default','useCurrent','useCurrentOnUpdate','comment']:category==='index'?['name','type','columns']:category==='foreignKey'?['name','columns','referencedTable','referencedColumns','onDelete','onUpdate']:['name'];
 const rows:Attribute[]=[];
 if(category==='column'&&before&&after&&definition(before)!==definition(after))rows.push({key:'definition',label:'欄位定義',before:{present:true,value:definition(before)},after:{present:true,value:definition(after)}});
 for(const key of keys){const b=before?own(before,key):undefined,a=after?own(after,key):undefined;
  if(b&&a&&equal(b,a))continue;
  if(!b&&a&&!a.present||!a&&b&&!b.present)continue;
  rows.push({key,label:fields[key],...(b?{before:b}:{}),...(a?{after:a}:{})});
 }
 return rows;
}
export function summarizeChanges(diff:SchemaDiff|null):{table:string;changes:SummaryChange[]}[]|null {
 if(diff===null)return null;
 const groups=new Map<string,{table:string;changes:SummaryChange[]}>();
 for(const change of diff.changes){
  const category='column' in change?'column':'index' in change?'index':'foreignKey' in change?'foreignKey':'table';
  const name='column' in change?change.column:'index' in change?change.index:'foreignKey' in change?change.foreignKey:change.table;
  const before='before' in change?change.before:undefined,after='after' in change?change.after:undefined;
  if(!groups.has(change.table))groups.set(change.table,{table:change.table,changes:[]});
  groups.get(change.table)!.changes.push({kind:change.kind,table:change.table,name,category,before,after,attributes:attributes(before,after,category)});
 }
 return [...groups.values()];
}
