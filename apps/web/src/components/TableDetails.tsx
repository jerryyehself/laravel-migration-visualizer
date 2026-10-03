import type { SchemaState } from '@lmv/migration-core';

export function TableDetails({ schema, selected }: { schema: SchemaState; selected?: string }) {
  const table = selected !== undefined && Object.hasOwn(schema.tables, selected) ? schema.tables[selected] : null;
  return <section className="table-inspector" aria-label="資料表詳細檢視">
    <h3>資料表詳細檢視</h3>
    {selected === undefined ? <p className="muted">請先聚焦資料表，以查看完整欄位、索引與外鍵。</p> : !table ?
      <p className="unavailable">此快照沒有資料表 {selected}；不補畫或複製另一側的資料。</p> :
      <details key={selected}><summary>查看 {selected} 的欄位、索引與外鍵</summary>
        <p>以下為目前快照的完整資料；未出現的選用屬性表示未指定，不代表資料庫預設值。</p>
        <h4>欄位 · {Object.keys(table.columns).length}</h4>
        {Object.keys(table.columns).length === 0 && <p>沒有欄位。</p>}
        {Object.values(table.columns).map(column => <article key={column.name} className="column-detail">
          <h5>{column.name} · {column.type}</h5>
          <dl>{Object.entries(column).filter(([key]) => key !== 'name' && key !== 'type').map(([key,value]) =>
            <div key={key}><dt>{key}</dt><dd><code>{JSON.stringify(value)}</code></dd></div>)}</dl>
        </article>)}
        <h4>索引 · {Object.keys(table.indexes).length}</h4>
        {Object.keys(table.indexes).length === 0 && <p>沒有索引。</p>}
        <ul>{Object.values(table.indexes).map(index => <li key={index.name}><strong>{index.name}</strong> · {index.type}<p>欄位（依順序）：{index.columns.join(' → ')}</p></li>)}</ul>
        <h4>外鍵 · {Object.keys(table.foreignKeys).length}</h4>
        {Object.keys(table.foreignKeys).length === 0 && <p>沒有外鍵。</p>}
        <ul>{Object.values(table.foreignKeys).map(key => <li key={key.name}><strong>{key.name}</strong>
          <p>本表欄位（依順序）：{key.columns.join(' → ')}</p>
          <p>引用：{key.referencedTable}（{key.referencedColumns.join(' → ')}）</p>
          <p>ON DELETE：{key.onDelete ?? '未指定'} · ON UPDATE：{key.onUpdate ?? '未指定'}</p>
        </li>)}</ul>
      </details>}
  </section>;
}
