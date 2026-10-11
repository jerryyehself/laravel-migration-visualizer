import type { SourceNavigation, StructureQuery } from '../operation-sources';
import { useMemo, useState } from 'react';
import type { Dispatch,SetStateAction } from 'react';
import { comparisonLayout, initialGraphView, type GraphLayout,type GraphView } from '../comparison-layout';
import type { MigrationSnapshot, ProjectAnalysis } from '@lmv/migration-core';
import { SchemaGraph } from './SchemaGraph';
export function SchemaComparison({ step, analysis, onSource, onSelectionChange, selection, onSelectObject, hideDetails, layout:controlledLayout, view:controlledView, onViewChange, hideControls }: { selection?:StructureQuery; onSelectObject?:(query:StructureQuery | undefined)=>void; hideDetails?:boolean; layout?:GraphLayout; view?:GraphView; onViewChange?:Dispatch<SetStateAction<GraphView>>; hideControls?:boolean; step: MigrationSnapshot; analysis?: ProjectAnalysis; onSource?: SourceNavigation; onSelectionChange?: () => void }) {
  if (step.schemaBefore === null || step.schemaAfter === null || step.diff === null) return <p className="unavailable">快照或 diff 未知，無法比較。</p>;
  return <KnownComparison step={step} before={step.schemaBefore} after={step.schemaAfter} diff={step.diff} analysis={analysis} onSource={onSource} selection={selection} onSelectObject={onSelectObject} hideDetails={hideDetails} onSelectionChange={onSelectionChange} layout={controlledLayout} view={controlledView} onViewChange={onViewChange} hideControls={hideControls} />;
}
function KnownComparison({ step, before, after, diff, analysis, onSource, onSelectionChange, selection, onSelectObject, hideDetails, layout:controlledLayout, view:controlledView, onViewChange, hideControls }: { selection?:StructureQuery; onSelectObject?:(query:StructureQuery | undefined)=>void; hideDetails?:boolean; layout?:GraphLayout; view?:GraphView; onViewChange?:Dispatch<SetStateAction<GraphView>>; hideControls?:boolean; step: MigrationSnapshot; before: NonNullable<MigrationSnapshot['schemaBefore']>; after: NonNullable<MigrationSnapshot['schemaAfter']>; diff: NonNullable<MigrationSnapshot['diff']>; analysis?: ProjectAnalysis; onSource?: SourceNavigation; onSelectionChange?: () => void }) {
  const localLayout = useMemo(() => comparisonLayout(before, after), [before, after]);
  const layout=controlledLayout??localLayout;
  const [localView, setLocalView] = useState(() => { const initial=initialGraphView(layout); return selection ? {...initial,focused:selection.table} : initial; });
  const view=controlledView??localView,setView=onViewChange??setLocalView;
  return <section aria-label="ERD 結構比較">
    <h2>{step.filename} · 結構比較</h2>
    <p>＋ 新增（綠）、− 移除（紅）、～ 變更（橙）。移除項目在前圖，新增項目在後圖；表的「含變更」包含欄位、索引或外鍵變化。不推測 rename。</p>
    <p>共同資料表位置對齊；拖移、平移、縮放與重設會同步兩圖。單側新增／移除的位置在另一圖留空。聚焦資料表也會同步兩圖視野，另一側缺少的表不補畫。索引詳情與完整屬性請查看下方變更明細。</p>
    <p role="status">{diff.changes.length} 個結構變化{diff.changes.length === 0 ? '；沒有結構變化。' : '。'}</p>
    <SchemaGraph schema={before} title="套用前 ERD · 移除與變更" diff={diff} side="before" layout={layout} view={view} onViewChange={setView} analysis={analysis} onSource={onSource} selection={selection} onSelectObject={onSelectObject} hideDetails={hideDetails} onSelectionChange={onSelectionChange} hideControls={hideControls} />
    <SchemaGraph schema={after} title="套用後 ERD · 新增與變更" diff={diff} side="after" layout={layout} view={view} onViewChange={setView} analysis={analysis} onSource={onSource} selection={selection} onSelectObject={onSelectObject} hideDetails={hideDetails} onSelectionChange={onSelectionChange} hideControls={hideControls} />
    <details><summary>ERD 變更明細（包含索引與完整前後屬性）</summary>
      <ul>{diff.changes.map((change, index) => <li key={index}><strong>{change.kind} · {change.table}{'column' in change ? `.${change.column}` : 'index' in change ? ` / ${change.index}` : 'foreignKey' in change ? ` / ${change.foreignKey}` : ''}</strong><pre>{JSON.stringify(change, null, 2)}</pre></li>)}</ul>
    </details>
  </section>;
}
