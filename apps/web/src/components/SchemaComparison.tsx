import type { MigrationSnapshot } from '@lmv/migration-core';
import { SchemaGraph } from './SchemaGraph';
export function SchemaComparison({ step }: { step: MigrationSnapshot }) {
  if (step.schemaBefore === null || step.schemaAfter === null || step.diff === null) return <p className="unavailable">快照或 diff 未知，無法比較。</p>;
  return <section aria-label="ERD 結構比較">
    <h2>{step.filename} · 結構比較</h2>
    <p>＋ 新增（綠）、− 移除（紅）、～ 變更（橙）。移除項目在前圖，新增項目在後圖；表的「含變更」包含欄位、索引或外鍵變化。不推測 rename。</p>
    <p>兩張圖可各自移動與縮放，布局未同步。索引詳情與完整屬性請查看下方變更明細。</p>
    <p role="status">{step.diff.changes.length} 個結構變化{step.diff.changes.length === 0 ? '；沒有結構變化。' : '。'}</p>
    <SchemaGraph schema={step.schemaBefore} title="套用前 ERD · 移除與變更" diff={step.diff} side="before" />
    <SchemaGraph schema={step.schemaAfter} title="套用後 ERD · 新增與變更" diff={step.diff} side="after" />
    <details><summary>ERD 變更明細（包含索引與完整前後屬性）</summary>
      <ul>{step.diff.changes.map((change, index) => <li key={index}><strong>{change.kind} · {change.table}{'column' in change ? `.${change.column}` : 'index' in change ? ` / ${change.index}` : 'foreignKey' in change ? ` / ${change.foreignKey}` : ''}</strong><pre>{JSON.stringify(change, null, 2)}</pre></li>)}</ul>
    </details>
  </section>;
}
