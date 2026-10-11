import { useEffect, useRef, type ReactNode } from 'react';
import type { MigrationSnapshot } from '@lmv/migration-core';
import type { SchemaSnapshotChoice } from '../schema-snapshots';
import type { StructureQuery, SourceNavigation } from '../operation-sources';
import type { ProjectAnalysis } from '@lmv/migration-core';
import { OperationSources } from './OperationSources';
import { TableDetails } from './TableDetails';
export function WorkspaceDetails({choice, selection, request, analysis, step, onSource, onRelated, sourceQuery, sourceRequest, currentIndex, onSources, children}: {
  choice:SchemaSnapshotChoice; selection?:StructureQuery; request:number; analysis:ProjectAnalysis;
  onSources?:(query:StructureQuery)=>void; sourceQuery?:StructureQuery; sourceRequest?:number; currentIndex?:number; step:MigrationSnapshot|null; onSource:SourceNavigation; onRelated?:(query:StructureQuery)=>void; children?:ReactNode;
}) {
  const panel=useRef<HTMLElement>(null);
  function jump(selector:string) {
    const target=panel.current?.querySelector<HTMLElement>(selector);
    if(target){target.closest("details")?.setAttribute("open","");target.focus({preventScroll:true});target.scrollIntoView({block:"start"});}
  }
  const sourceHeading=useRef<HTMLElement>(null);
  useEffect(()=>{if(sourceRequest){sourceHeading.current?.focus({preventScroll:true});sourceHeading.current?.scrollIntoView({block:'center'});}},[sourceRequest]);
  const sides = choice.comparison ? [
    {label:'套用前',schema:choice.comparison.schemaBefore},
    {label:'套用後',schema:choice.comparison.schemaAfter},
  ] : [{label:choice.label,schema:choice.schema}];
  return <aside ref={panel} className="workspace-details" aria-label="目前表明細與來源">
    <h2>結構明細 · 目前表：{selection?.table ?? '尚未選取'}</h2>
    <nav aria-label="明細、相關變更與來源入口" className="toolbar">
      <button type="button" className="secondary" onClick={()=>jump('.structure-details')}>結構明細</button>
      <button type="button" className="secondary" onClick={()=>jump('.related-changes')}>相關變更</button>
      <button type="button" className="secondary" onClick={()=>jump('.workspace-sources > summary')}>PHP 來源</button>
    </nav>
    {selection && onRelated && <button type="button" className="secondary" onClick={()=>onRelated(selection)}>查看此名稱相關步驟 {selection.table}{selection.column===undefined?'':'.'+selection.column}</button>}
    {selection?.column !== undefined && <p>目前欄位名稱：{selection.column}（literal，缺少也保留）</p>}
    <section className="structure-details" tabIndex={-1} aria-label="目前閱讀側別結構明細">
    {sides.map(side => <section key={side.label} aria-label={`${side.label}資料表明細`}>
      <h3>{side.label}</h3>
      {side.schema === null ? <p className="unavailable">此側快照未知，無法確認{selection ? `資料表 ${selection.table}` : '表結構'}；不補畫成功前綴。</p> :
        <TableDetails schema={side.schema} selected={selection?.table} selectedColumn={selection?.column} selectionRequest={request} openOnSelection={selection !== undefined} />}
    </section>)}
    {selection && step && <section aria-label="目前表的本次結構變更">
      <h3>本次變更 · {step.filename}</h3>
      {step.diff === null ? <p className="unavailable">diff 未知；語法操作不代表已套用。</p> :
        step.diff.changes.filter(change=>change.table===selection.table).length === 0 ? <p>此表沒有本次結構差異；不推定跨 rename 身分。</p> :
        <ul>{step.diff.changes.filter(change=>change.table===selection.table).map((change,i)=><li key={i}><code>{change.kind}</code>{'column' in change ? ` · ${change.column}` : ''}</li>)}</ul>}
    </section>}
    </section>
    {children}
    <details className="workspace-sources" key={sourceRequest} open={sourceRequest ? true : undefined}>
      <summary ref={sourceHeading}>PHP 來源 · 完整分析順序</summary>
      {selection && onSources && <div className="toolbar"><button type="button" className="secondary" onClick={()=>onSources({table:selection.table})}>查看資料表名稱來源 {selection.table}</button>{selection.column!==undefined && <button type="button" className="secondary" onClick={()=>onSources(selection)}>查看欄位名稱來源 {selection.table}.{selection.column}</button>}</div>}
      <p>依 literal 名稱查詢；完整分析來源包含後續步驟，不代表目前時點已套用。</p>
      {(sourceQuery ?? selection) ? <OperationSources result={analysis} query={(sourceQuery ?? selection)!} onSource={onSource} currentIndex={currentIndex}/> : <p>選取表／欄位或從變更摘要開啟名稱來源。</p>}
    </details>
  </aside>;
}
