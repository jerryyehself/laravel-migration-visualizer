import { MigrationReading } from './MigrationReading';
import { OperationSourcePanel } from './OperationSources';
import type { OperationSource, SourceNavigation, StructureQuery } from '../operation-sources';
import { useState, useRef } from 'react';
import { diagnosticTarget } from '../diagnostic-location';
import { DiagnosticSource } from './DiagnosticSource';
import { filterMigrationResults, visibleSelection, type ResultStatusFilter } from '../filter-results';
import { ProjectExports } from './ProjectExports';
import { SchemaSnapshots } from './SchemaSnapshots';
import type { MigrationFile, ProjectAnalysis, ProjectDiagnostic, SchemaState } from '@lmv/migration-core';

const phaseLabels: Record<ProjectDiagnostic['phase'], string> = {
  ordering: '檔名排序', analysis: 'PHP 分析', replay: 'Schema 套用', dependency: '前序失敗',
};
const statusLabels = { applied: '已套用', failed: '失敗', blocked: '已阻擋' };

export function Diagnostics({ items, onLocate, canLocate }: { items: readonly ProjectDiagnostic[]; onLocate?: (item: ProjectDiagnostic) => void; canLocate?: (item: ProjectDiagnostic) => boolean }) {
  if (items.length === 0) return <p className="muted">沒有診斷。</p>;
  return <ul className="diagnostics">{items.map((item, index) => <li className="diagnostic" key={index}>
    <strong>{phaseLabels[item.phase]} · {item.code}</strong>
    <span>{item.source.file}:{item.source.line}（column {item.source.column}）</span>
    <span>{item.message}</span>
    {onLocate && <button type="button" className="secondary" disabled={!canLocate?.(item)} onClick={() => onLocate(item)}>定位原始碼 · {item.source.file}:{item.source.line}</button>}
    {onLocate && !canLocate?.(item) && <span>無法唯一對應輸入檔案，請先修正重複檔名或重新匯入。</span>}
  </li>)}</ul>;
}

function SchemaView({ title, schema, unavailable }: { title: string; schema: SchemaState | null; unavailable: string }) {
  return <article><h3>{title}</h3>{schema === null ? <p className="unavailable">{unavailable}</p> : <>
    {Object.entries(schema.tables).length === 0 && <p className="muted">已知的空白 schema（沒有資料表）。</p>}
    {Object.entries(schema.tables).map(([name, table]) => <div key={name} className="table-wrap">
      <table><caption>{name}</caption><thead><tr><th>欄位</th><th>型別</th><th>屬性</th></tr></thead>
        <tbody>{Object.entries(table.columns).map(([columnName, column]) => <tr key={columnName}>
          <td>{columnName}</td><td>{column.type}</td>
          <td><code>{JSON.stringify(Object.fromEntries(Object.entries(column).filter(([key]) => key !== 'type' && key !== 'name')))}</code></td>
        </tr>)}</tbody></table>
      <table className="index-table"><caption>{name} 的索引</caption>
        <thead><tr><th>名稱</th><th>種類</th><th>欄位（依順序）</th></tr></thead>
        <tbody>{Object.values(table.indexes).map(index => <tr key={index.name}>
          <td>{index.name}</td><td>{index.type}</td><td>{index.columns.join(' → ')}</td>
        </tr>)}</tbody>
      </table>
      {Object.keys(table.indexes).length === 0 && <p className="muted">沒有索引。</p>}
      <table className="index-table"><caption>{name} 的外鍵</caption>
        <thead><tr><th>名稱</th><th>本表欄位</th><th>引用目標</th><th>ON DELETE</th><th>ON UPDATE</th></tr></thead>
        <tbody>{Object.values(table.foreignKeys).map(key => <tr key={key.name}>
          <td>{key.name}</td><td>{key.columns.join(' → ')}</td>
          <td>{key.referencedTable}（{key.referencedColumns.join(' → ')}）</td>
          <td>{key.onDelete ?? '未指定'}</td><td>{key.onUpdate ?? '未指定'}</td>
        </tr>)}</tbody>
      </table>
      {Object.keys(table.foreignKeys).length === 0 && <p className="muted">沒有外鍵。</p>}
    </div>)}
    <details><summary>SchemaState JSON</summary><pre>{JSON.stringify(schema, null, 2)}</pre></details>
  </>}</article>;
}

// Props are data and callbacks from the parent; this component never replays migrations.
export function ProjectResults({ result, files, selected, onSelect, onEdit }: {
  result: ProjectAnalysis; files: readonly MigrationFile[]; selected: number; onSelect: (index: number) => void; onEdit: (item: ProjectDiagnostic) => void;
}) {
  const [snapshotId,setSnapshotId] = useState('final');
  const [focusTarget,setFocusTarget] = useState<{query:StructureQuery;request:number}>();
  const focusRequest = useRef(0);
  const [operationSource, setOperationSource] = useState<OperationSource | null>(null);
  const sourceOrigin = useRef<HTMLElement | null>(null);
  const [sourceReturnNotice,setSourceReturnNotice] = useState<string | null>(null);
  const clearSource = () => { setOperationSource(null); sourceOrigin.current = null; setSourceReturnNotice(null); };
  const openSource: SourceNavigation = (hit,origin) => {
    sourceOrigin.current = origin; setLocated(null); setSourceReturnNotice(null); setQuery(''); setStatus('all'); onSelect(hit.migrationIndex); setOperationSource(hit);
  };
  function returnSource() {
    const origin = sourceOrigin.current; clearSource();
    if (origin?.isConnected) { origin.scrollIntoView({block:'center'}); origin.focus({preventScroll:true}); }
    else setSourceReturnNotice('原結構選取已失效，請重新選擇快照與物件。');
  }
  const [located, setLocated] = useState<ProjectDiagnostic | null>(null);
  const target = located ? diagnosticTarget(files, result, located) : null;
  const canLocate = (item: ProjectDiagnostic) => diagnosticTarget(files, result, item) !== null;
  function locate(item: ProjectDiagnostic) {
    clearSource();
    const next = diagnosticTarget(files, result, item);
    if (!next) return;
    setQuery(''); setStatus('all'); setLocated({ ...item });
    if (next.resultIndex !== null) onSelect(next.resultIndex);
  }
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ResultStatusFilter>('all');
  const visible = filterMigrationResults(result.migrations, query, status);
  const activeIndex = visibleSelection(visible, selected);
  const step = activeIndex === null ? undefined : result.migrations[activeIndex];
  return <section className="project-results">
    <div role="status" className={`summary-card ${result.complete ? 'success' : 'warning'}`}>
      <h2>{result.complete ? '專案分析完成' : '專案分析未完成'}</h2>
      <p>{result.appliedCount} / {result.migrations.length} 份已套用 · {result.diagnostics.length} 筆診斷</p>
      <p>{result.complete ? '以下為支援範圍內的靜態分析結果，不代表實際資料庫執行結果。' : '最終 schema 未知。最後可信 schema 只包含成功前綴，不能當成專案最終狀態。'}</p>
    </div>
    <ProjectExports result={result} />
    <SchemaSnapshots selectedId={snapshotId} onSelectSnapshot={id=>{setSnapshotId(id);setFocusTarget(undefined);}} focusTarget={focusTarget} result={result} onSource={openSource} onSelectionChange={clearSource} />
    {sourceReturnNotice && <p role="status" className="unavailable">{sourceReturnNotice}</p>}
    {operationSource && <OperationSourcePanel hit={operationSource} files={files} onBack={returnSource} />}
    <h3>專案診斷</h3><Diagnostics items={result.diagnostics} onLocate={locate} canLocate={canLocate} />
    {located && target && <DiagnosticSource file={target.file} diagnostic={located} onEdit={onEdit} />}
    <fieldset className="result-filters">
      <legend>篩選分析結果</legend>
      <div className="toolbar">
        <div><label htmlFor="result-query">搜尋 migration 檔名</label>
          <input id="result-query" type="text" value={query} onChange={event => setQuery(event.target.value)} placeholder="例如 create_users 或資料夾路徑" />
        </div>
        <div><label htmlFor="result-status">Migration 狀態</label>
          <select id="result-status" value={status} onChange={event => setStatus(event.target.value as ResultStatusFilter)}>
            <option value="all">全部狀態</option><option value="applied">已套用</option>
            <option value="failed">失敗</option><option value="blocked">已阻擋</option>
          </select>
        </div>
        <button type="button" className="secondary" disabled={query === '' && status === 'all'} onClick={() => { setQuery(''); setStatus('all'); }}>清除篩選</button>
      </div>
      <p className="muted" role="status">顯示 {visible.length} / {result.migrations.length} 份；篩選只影響逐檔檢視，專案摘要、診斷與 JSON 匯出仍包含完整結果。</p>
    </fieldset>
    <div className="project-layout">
      <nav className="migration-list" aria-label="依 core 排序的分析結果">
        <h3>分析順序</h3>
        {visible.map(({migration, index}) => <button type="button" className="migration-item" key={index}
          aria-pressed={activeIndex === index} onClick={() => onSelect(index)}>
          <span>{index + 1}. {migration.filename}</span>
          <span className={`badge ${migration.status}`}>{statusLabels[migration.status]}</span>
        </button>)}
        {visible.length === 0 && <p className="muted">沒有符合條件的 migration。</p>}
      </nav>
      {!step && <p className="muted">請清除或調整篩選條件，以檢視逐檔結果。</p>}
      {step && <div className="step-detail">
        <h2>{step.filename}</h2>
        <p>{statusLabels[step.status]} · {step.analysis.operations.length} 個已識別操作</p>
        <MigrationReading step={step} index={activeIndex!} diagnostics={<Diagnostics items={step.diagnostics} onLocate={locate} canLocate={canLocate} />} onSource={openSource} onObject={(side,query)=>{ clearSource(); setLocated(null); setSnapshotId(`${side}-${activeIndex}`); setFocusTarget({query,request:++focusRequest.current}); }} />
        {step.status !== 'applied' && <p className="unavailable">此檔的 operations 僅供檢視，沒有套用；不顯示推測的 schema 或 diff。</p>}
        <details><summary>完整快照、diff 與 operations</summary><div className="results">
          <SchemaView title="Schema Before" schema={step.schemaBefore} unavailable="前序狀態未知，沒有可信的分析前快照。" />
          <SchemaView title="Schema After" schema={step.schemaAfter} unavailable="未成功套用，沒有可信的分析後快照。" />
        </div>
        <article><h3>SchemaDiff</h3>
          {step.diff === null ? <p className="unavailable">無法比較未知的快照。</p> : <>
            <p>{step.diff.changes.length} 個結構變化；表／欄位 rename 顯示為移除與新增。</p>
            {step.diff.changes.length === 0 ? <p className="muted">沒有結構變化。</p> : <ul className="change-list">
              {step.diff.changes.map((change, index) => <li key={index}><code>{change.kind}</code> · {change.table}{'column' in change ? `.${change.column}` : 'index' in change ? ` / ${change.index}` : 'foreignKey' in change ? ` / ${change.foreignKey}` : ''}</li>)}
            </ul>}
            <details><summary>SchemaDiff JSON</summary><pre>{JSON.stringify(step.diff, null, 2)}</pre></details>
          </>}
        </article>
        <details><summary>AtomicOperation JSON</summary><pre>{JSON.stringify(step.analysis.operations, null, 2)}</pre></details></details>
      </div>}
    </div>
    <SchemaView title={result.complete ? '專案最終 Schema' : '最後可信 Schema（僅成功前綴）'}
      schema={result.complete ? result.finalSchema : result.lastValidSchema} unavailable="最終 schema 未知。" />
    <details><summary>完整 ProjectAnalysis JSON</summary><pre>{JSON.stringify(result, null, 2)}</pre></details>
  </section>;
}
