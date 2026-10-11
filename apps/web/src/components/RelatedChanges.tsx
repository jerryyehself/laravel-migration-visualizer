import { useEffect,useState,useId,useRef } from 'react';
import type { ProjectAnalysis, TableState } from '@lmv/migration-core';
import { relatedChanges,type Evidence } from '../related-changes';
import { operationLabel } from '../migration-reading';
import { summarizeChanges,displayValue } from '../change-summary';
import type { StructureQuery,SourceNavigation } from '../operation-sources';
const labels:Record<Evidence,string>={structure:'結構差異',index:'索引上下文',relation:'關係上下文（不代表引用表被修改）','table-context':'表級操作上下文（不斷言欄位被修改）',syntax:'精確名稱語法'};
const status={applied:'靜態已套用',failed:'失敗：未套用',blocked:'前序阻擋：未套用'};
const availability={available:'存在','object-absent':'不存在','snapshot-unknown':'快照未知'};
export function RelatedChanges({result,query,onQuery,onStep,onSource}:{result:ProjectAnalysis;query?:StructureQuery;onQuery:(query:StructureQuery)=>void;onStep:(index:number,side:'before'|'after'|'diff',query:StructureQuery)=>void;onSource:SourceNavigation}){
 const panel=useRef<HTMLElement>(null);
 useEffect(()=>{if(query){panel.current?.focus({preventScroll:true});panel.current?.scrollIntoView({block:'start'});}},[query]);
 const id=useId();const [table,setTable]=useState(query?.table??'');const [column,setColumn]=useState(query?.column??'');
 useEffect(()=>{setTable(query?.table??'');setColumn(query?.column??'');},[query?.table,query?.column]);
 const reading=query?relatedChanges(result,query):null;
 return <section ref={panel} tabIndex={-1} className="related-changes" aria-label="名稱相關步驟"><h3>相關變更 · 精確名稱</h3><p>名稱相關步驟，不追蹤物件身分。查詢不改完整 migration 順序、schema 或匯出。</p>
 <form onSubmit={e=>{e.preventDefault();if(table.length)onQuery({table,...(column.length?{column}:{})});}}>
 <label htmlFor={`${id}-table`}>精確資料表名稱</label><input id={`${id}-table`} value={table} onChange={e=>setTable(e.target.value)} required/>
 <label htmlFor={`${id}-column`}>精確欄位名稱（留空查整表）</label><input id={`${id}-column`} value={column} onChange={e=>setColumn(e.target.value)}/><button type="submit" disabled={!table.length}>查詢名稱相關步驟</button></form>
 {!reading?<p>可直接查已刪除名稱；最終快照未知仍能查語法與既有證據。</p>:<><p role="status">查詢：{query!.table}{query!.column===undefined?'':'.'+query!.column} · 最終：{availability[reading.final]}</p>
 {reading.state==='ordering'?<p className="unavailable">檔名排序未開始；不能以沒有相關證據當成沒有變化。</p>:reading.state==='empty'?<p>已知零份 migration，沒有步驟可列。</p>:null}
 {!reading.complete&&<p className="unavailable">專案未完成，未知區段沒有相關證據不等於沒有變化；不補成功前綴為最終狀態。</p>}
 {reading.steps.length===0&&reading.state==='analyzed'&&<p>沒有此精確名稱的相關證據；不表示其他名稱或未知區段沒有變化。</p>}
 <ol>{reading.steps.map(row=><li key={row.index} data-migration-index={row.index}><h4>第 {row.index+1} 份 · {row.filename}</h4><p>{status[row.status]} · Before {availability[row.before]} · After {availability[row.after]}</p>
 {row.changes===null?<p className="unavailable">diff 未知；下列語法未套用。</p>:row.changes.length===0?<p>此精確名稱沒有淨結構差異；語法操作不等於結構變化。</p>:row.changes.map(({change,evidence},i)=>{
 const item=summarizeChanges({changes:[change]})![0].changes[0];
 return <div key={i}><p>{labels[evidence]} · <code>{change.kind}</code> · 所屬表 {change.table} · {item.name}</p>{item.category==='table'&&<details><summary>涉及名稱的整表已知內容</summary><p>保留原 table 差異，不新增 column 差異。</p>{(['before','after'] as const).map(side=>{const table=item[side] as TableState|undefined;return table&&<div key={side}><p>{side==='before'?'Before':'After'} 欄位：{Object.values(table.columns).map(c=>`${c.name} (${c.type})`).join(' · ')}</p>{Object.values(table.indexes).map(index=><p key={index.name}>索引上下文 · {index.name} · {index.type} · {index.columns.join(' → ')}</p>)}{Object.values(table.foreignKeys).map(fk=><p key={fk.name}>關係上下文 · {table.name} ({fk.columns.join(' → ')}) → {fk.referencedTable} ({fk.referencedColumns.join(' → ')}) · onDelete {fk.onDelete??'未指定'} · onUpdate {fk.onUpdate??'未指定'}</p>)}</div>;})}</details>}<dl className="summary-attributes">{item.attributes.map(a=><div key={a.key}><dt>{a.label}</dt><dd>{a.before&&`Before ${displayValue(a.before)}`}{a.before&&a.after?' → ':''}{a.after&&`After ${displayValue(a.after)}`}</dd></div>)}</dl></div>;
 })}
 <p>已識別語法 · {row.operations.length}</p><ul>{row.operations.map(hit=><li key={hit.operationIndex}><span>{labels[hit.evidence]} · {operationLabel(hit.operation)}</span>{' '}<button type="button" className="secondary" disabled={hit.source===null} onClick={e=>onSource(hit,e.currentTarget)}>查看相關 PHP · {hit.source?`第 ${hit.source.line} 行`:'位置未知'}</button>
 {hit.operation.kind==='renameColumn'&&<button type="button" className="secondary" onClick={()=>{if(hit.operation.kind==='renameColumn')onQuery({table:hit.operation.table,column:hit.operation.to});}}>查詢改名新名稱 {hit.operation.to}</button>}
 {hit.operation.kind==='renameTable'&&<button type="button" className="secondary" onClick={()=>{if(hit.operation.kind==='renameTable')onQuery({table:hit.operation.to,...(query!.column===undefined?{}:{column:query!.column})});}}>查詢改名新表 {hit.operation.to}</button>}
 </li>)}</ul>
 <div className="toolbar"><button type="button" disabled={!row.comparable} onClick={()=>onStep(row.index,'diff',query!)}>查看此步比較</button><button type="button" className="secondary" disabled={!row.beforeKnown} onClick={()=>onStep(row.index,'before',query!)}>查看套用前</button><button type="button" className="secondary" onClick={()=>onStep(row.index,'after',query!)}>查看此步診斷／語法</button></div>
 </li>)}</ol></>}
 </section>;
}
