import type { ReactNode } from 'react';
import type { MigrationSnapshot } from '@lmv/migration-core';
import type { SchemaSnapshotChoice } from '../schema-snapshots';
import type { StructureQuery, SourceNavigation } from '../operation-sources';
import type { ProjectAnalysis } from '@lmv/migration-core';
import { TableDetails } from './TableDetails';
export function WorkspaceDetails({choice, selection, request, analysis, step, onSource, children}: {
  choice:SchemaSnapshotChoice; selection?:StructureQuery; request:number; analysis:ProjectAnalysis;
  step:MigrationSnapshot|null; onSource:SourceNavigation; children?:ReactNode;
}) {
  const sides = choice.comparison ? [
    {label:'套用前',schema:choice.comparison.schemaBefore},
    {label:'套用後',schema:choice.comparison.schemaAfter},
  ] : [{label:choice.label,schema:choice.schema}];
  return <aside className="workspace-details" aria-label="目前表明細與來源">
    <h2>目前表：{selection?.table ?? '尚未選取'}</h2>
    {sides.map(side => <section key={side.label} aria-label={`${side.label}資料表明細`}>
      <h3>{side.label}</h3>
      {side.schema === null ? <p className="unavailable">此側快照未知，無法確認{selection ? `資料表 ${selection.table}` : '表結構'}；不補畫成功前綴。</p> :
        <TableDetails schema={side.schema} selected={selection?.table} selectedColumn={selection?.column} selectionRequest={request} openOnSelection={selection !== undefined} analysis={analysis} onSource={onSource} />}
    </section>)}
    {selection && step && <section aria-label="目前表的本次結構變更">
      <h3>本次變更 · {step.filename}</h3>
      {step.diff === null ? <p className="unavailable">diff 未知；語法操作不代表已套用。</p> :
        step.diff.changes.filter(change=>change.table===selection.table).length === 0 ? <p>此表沒有本次結構差異；不推定跨 rename 身分。</p> :
        <ul>{step.diff.changes.filter(change=>change.table===selection.table).map((change,i)=><li key={i}><code>{change.kind}</code>{'column' in change ? ` · ${change.column}` : ''}</li>)}</ul>}
    </section>}
    {children}
  </aside>;
}
