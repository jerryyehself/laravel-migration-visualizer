import { useId, useState } from 'react';
import type { ProjectAnalysis } from '@lmv/migration-core';
import { schemaSnapshotChoices } from '../schema-snapshots';
import { SchemaGraph } from './SchemaGraph';
import { SchemaComparison } from './SchemaComparison';

export function SchemaSnapshots({ result }: { result: ProjectAnalysis }) {
  const id = useId();
  const [selected, setSelected] = useState('final');
  const choices = schemaSnapshotChoices(result);
  const active = choices.find(choice => choice.id === selected) ?? choices[0];
  return <section aria-label="Schema 快照檢視">
    <label htmlFor={id}>選擇 ERD 快照</label>
    <select id={id} value={active.id} onChange={event => setSelected(event.target.value)}>
      {choices.map(choice => <option key={choice.id} value={choice.id}>{choice.label}{choice.schema === null ? '（未知）' : ''}</option>)}
    </select>
    <p className="muted">快照依 core 分析順序列出，不受下方搜尋或狀態篩選影響。切換快照會重設圖形位置與縮放；不執行 migration。</p>
    {active.schema === null ? <section aria-label={`${active.label} ERD`}>
      <h2>{active.label} ERD</h2><p className="unavailable" role="status">{active.unavailable}不繪製推測的 ERD。</p>
    </section> : active.comparison ? <SchemaComparison key={active.id} step={active.comparison} /> : <SchemaGraph key={active.id} schema={active.schema} title={`${active.label} ERD`} />}
  </section>;
}
