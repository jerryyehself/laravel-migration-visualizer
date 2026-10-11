import type { ReactNode } from 'react';
import type { MigrationSnapshot, ProjectAnalysis } from '@lmv/migration-core';
import { migrationReading, operationLabel, type Availability } from '../migration-reading';
import type { SourceNavigation, StructureQuery } from '../operation-sources';
import { ChangeSummary } from './ChangeSummary';
const statuses = { applied:'靜態已套用', failed:'失敗：未套用', blocked:'前序阻擋：未套用' };
const availability:Record<Availability,string> = { available:'查看明細', 'snapshot-unknown':'快照未知', 'object-absent':'此側不存在' };
export function MigrationReading({ step, index, diagnostics, onSource, onObject, analysis }: { step:MigrationSnapshot; analysis?:ProjectAnalysis; index:number; diagnostics:ReactNode; onSource:SourceNavigation; onObject:(side:'before'|'after',query:StructureQuery)=>void }) {
  const reading = migrationReading(step,index);
  return <section className="migration-reading" aria-label="單次變更閱讀">
    <h3>單次變更摘要</h3>
    <p>{statuses[reading.status]} · Before {reading.beforeKnown ? '已知' : '未知'} · After {reading.afterKnown ? '已知' : '未知'}</p>
    <h4>診斷 · {reading.diagnostics.length}</h4>{diagnostics}
    <ChangeSummary step={step} analysis={analysis} onSource={onSource} onObject={onObject}/>
    <h4>已識別 PHP 操作 · {reading.operations.length}</h4>
    <p className="muted">操作是語法證據；失敗或阻擋時沒有套用。rename 的明確操作與下方結構移除／新增分開閱讀。</p>
    <ol>{reading.operations.map(hit => <li key={hit.operationIndex}>
      <code>{operationLabel(hit.operation)}</code>{' '}
      <button type="button" className="secondary" disabled={hit.source === null} onClick={event=>onSource(hit,event.currentTarget)}>查看操作 PHP · {hit.source && hit.source.line > 0 ? `第 ${hit.source.line} 行` : '位置未知'}</button>
    </li>)}</ol>
    <h4>涉及物件與各側明細</h4>
    <p className="muted">名稱依操作及結構差異列出，不推定跨 rename 身分。索引、外鍵導向所屬表；明細跳轉會重設該圖位置。</p>
    <ul>{reading.objects.map(object=><li key={JSON.stringify([object.table,object.column])}>
      <strong>{object.table}{object.column === undefined ? '' : '.'+object.column}</strong> · {object.evidence === 'structural' ? '結構差異證據' : '語法涉及'}{' '}
      {(['before','after'] as const).map(side=><button type="button" className="secondary" key={side} disabled={object[side] !== 'available'} onClick={()=>onObject(side,object)}>{side === 'before' ? 'Before' : 'After'} · {availability[object[side]]}</button>)}
    </li>)}</ul>
    {reading.objects.length === 0 && <p>沒有直接涉及的物件。</p>}
  </section>;
}
