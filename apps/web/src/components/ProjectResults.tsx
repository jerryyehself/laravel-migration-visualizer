import type { ProjectAnalysis, ProjectDiagnostic, SchemaState } from '@lmv/migration-core';

const phaseLabels: Record<ProjectDiagnostic['phase'], string> = {
  ordering: '檔名排序', analysis: 'PHP 分析', replay: 'Schema 套用', dependency: '前序失敗',
};
const statusLabels = { applied: '已套用', failed: '失敗', blocked: '已阻擋' };

export function Diagnostics({ items }: { items: readonly ProjectDiagnostic[] }) {
  if (items.length === 0) return <p className="muted">沒有診斷。</p>;
  return <ul className="diagnostics">{items.map((item, index) => <li className="diagnostic" key={index}>
    <strong>{phaseLabels[item.phase]} · {item.code}</strong>
    <span>{item.source.file}:{item.source.line}（column {item.source.column}）</span>
    <span>{item.message}</span>
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
export function ProjectResults({ result, selected, onSelect }: {
  result: ProjectAnalysis; selected: number; onSelect: (index: number) => void;
}) {
  const step = result.migrations[selected];
  return <section className="project-results">
    <div role="status" className={`summary-card ${result.complete ? 'success' : 'warning'}`}>
      <h2>{result.complete ? '專案分析完成' : '專案分析未完成'}</h2>
      <p>{result.appliedCount} / {result.migrations.length} 份已套用 · {result.diagnostics.length} 筆診斷</p>
      <p>{result.complete ? '以下為支援範圍內的靜態分析結果，不代表實際資料庫執行結果。' : '最終 schema 未知。最後可信 schema 只包含成功前綴，不能當成專案最終狀態。'}</p>
    </div>
    <h3>專案診斷</h3><Diagnostics items={result.diagnostics} />
    <div className="project-layout">
      <nav className="migration-list" aria-label="依 core 排序的分析結果">
        <h3>分析順序</h3>
        {result.migrations.map((migration, index) => <button type="button" className="migration-item" key={index}
          aria-pressed={selected === index} onClick={() => onSelect(index)}>
          <span>{index + 1}. {migration.filename}</span>
          <span className={`badge ${migration.status}`}>{statusLabels[migration.status]}</span>
        </button>)}
      </nav>
      {step && <div className="step-detail">
        <h2>{step.filename}</h2>
        <p>{statusLabels[step.status]} · {step.analysis.operations.length} 個已識別操作</p>
        <Diagnostics items={step.diagnostics} />
        {step.status !== 'applied' && <p className="unavailable">此檔的 operations 僅供檢視，沒有套用；不顯示推測的 schema 或 diff。</p>}
        <div className="results">
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
        <details><summary>AtomicOperation JSON</summary><pre>{JSON.stringify(step.analysis.operations, null, 2)}</pre></details>
      </div>}
    </div>
    <SchemaView title={result.complete ? '專案最終 Schema' : '最後可信 Schema（僅成功前綴）'}
      schema={result.complete ? result.finalSchema : result.lastValidSchema} unavailable="最終 schema 未知。" />
    <details><summary>完整 ProjectAnalysis JSON</summary><pre>{JSON.stringify(result, null, 2)}</pre></details>
  </section>;
}
