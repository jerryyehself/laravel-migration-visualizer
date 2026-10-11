import type { MigrationSnapshot, ProjectAnalysis, TableState, ForeignKey } from '@lmv/migration-core';
import { summarizeChanges, attributes, displayValue, type Attribute } from '../change-summary';
import { objectAvailability } from '../migration-reading';
import type { SourceNavigation, StructureQuery } from '../operation-sources';
import { OperationSources } from './OperationSources';
const categoryLabels={table:'資料表',column:'欄位',index:'索引',foreignKey:'外鍵'};
function Values({rows}:{rows:Attribute[]}) {return <dl className="summary-attributes">{rows.map(row=><div key={row.key}><dt>{row.label}</dt><dd>{row.before && <span>Before {displayValue(row.before)}</span>}{row.before&&row.after?' → ':''}{row.after&&<span>After {displayValue(row.after)}</span>}</dd></div>)}</dl>;}
export function ChangeSummary({step,analysis,onSource,onObject,onSources}:{step:MigrationSnapshot;analysis?:ProjectAnalysis;onSource:SourceNavigation;onSources?:(query:StructureQuery)=>void;onObject:(side:'before'|'after',query:StructureQuery)=>void}) {
 const groups=summarizeChanges(step.diff);
 const navigate=(side:'before'|'after',query:StructureQuery,label:string)=>{
  const state=objectAvailability(side==='before'?step.schemaBefore:step.schemaAfter,query);
  return <button type="button" className="secondary" disabled={state!=='available'} onClick={()=>onObject(side,query)}>{side==='before'?'Before':'After'} · {label} · {state==='available'?'查看明細':state==='snapshot-unknown'?'快照未知':'此側不存在'}</button>;
 };
 const contents=(table:TableState,side:'before'|'after')=><details><summary>整表{side==='after'?'新增':'移除'}的已知內容</summary><p>下列內容來自該側快照，並非額外的 core 差異記錄。</p>{(['columns','indexes','foreignKeys'] as const).map(collection=><section key={collection}><h6>{collection==='columns'?'欄位':collection==='indexes'?'索引':'外鍵'} · {Object.keys(table[collection]).length}</h6>{Object.values(table[collection]).map(item=><div key={item.name}><code>{item.name}</code><Values rows={attributes(side==='before'?item:undefined,side==='after'?item:undefined,collection==='columns'?'column':collection==='indexes'?'index':'foreignKey')}/>{navigate(side,{table:table.name,...(collection==='columns'?{column:item.name}:{})},item.name)}</div>)}</section>)}</details>;
 return <section className="structural-summary" aria-label="跨表屬性變更摘要"><h4>真實結構差異</h4><p className="muted">依所屬表分組；這是前後快照的淨差異，不推定 rename 身分或資料庫影響。</p>
 {groups===null?<p className="unavailable">快照未知，無法比較；不代表沒有變更。</p>:groups.length===0?<p>已知快照：沒有結構變化。</p>:groups.map(group=><section key={group.table} aria-label={`修改表 ${group.table}`}><h4>所屬表 · {group.table}</h4>{group.changes.map((change,i)=>{
 const query={table:change.table,...(change.category==='column'?{column:change.name}:{})};
 return <article className="summary-change" key={i} aria-label={`${change.kind} ${change.table}.${change.name}`}><h5>{categoryLabels[change.category]} · {change.name} · {change.kind.endsWith('Added')?'新增':change.kind.endsWith('Removed')?'移除':'變更'} <code>{change.kind}</code></h5><Values rows={change.attributes}/>
 {(['before','after'] as const).map(side=>change[side]&&<div key={side}>{navigate(side,query,change.name)}{change.category==='table'&&contents(change[side] as TableState,side)}{change.category==='foreignKey'&&(()=>{const fk=change[side] as ForeignKey;return <div className="reference-context"><p>{side==='before'?'Before':'After'} 關係上下文：{change.table} ({fk.columns.join(' → ')}) → {fk.referencedTable} ({fk.referencedColumns.join(' → ')})；引用表不代表被修改。</p>{navigate(side,{table:fk.referencedTable},`引用表 ${fk.referencedTable}`)}{fk.referencedColumns.map((column,index)=><span key={index}>{navigate(side,{table:fk.referencedTable,column},`引用欄位 ${fk.referencedTable}.${column}`)}</span>)}</div>;})()}</div>)}
 {analysis&&<><p className="muted">依 R4 名稱操作索引列出，不將差異猜成一對一來源。</p>{onSources ? <button type="button" className="secondary" onClick={()=>onSources(query)}>查看涉及此名稱的 PHP 操作</button> : <details><summary>查看涉及此名稱的 PHP 操作</summary><OperationSources result={analysis} query={query} onSource={onSource}/></details>}</>}
 </article>;
 })}</section>)}
 </section>;
}
