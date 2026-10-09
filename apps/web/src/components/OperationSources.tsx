import { useEffect, useRef } from 'react';
import type { MigrationFile, ProjectAnalysis } from '@lmv/migration-core';
import { operationSources, type OperationSource, type StructureQuery, type SourceNavigation } from '../operation-sources';
import { sourceExcerpt } from '../diagnostic-location';
const statusLabels = { applied:'靜態已套用', failed:'失敗：未套用', blocked:'前序阻擋：未套用' };
export function OperationSources({ result, query, onSource }: { result: ProjectAnalysis; query: StructureQuery; onSource: SourceNavigation }) {
  const hits = operationSources(result,query);
  return <section className="operation-source-list" aria-label={`操作來源 ${query.table}${query.column === undefined ? '' : '.'+query.column}`}>
    <h4>{query.column === undefined ? '資料表' : '欄位'}直接涉及的 PHP 操作</h4>
    <p className="muted">依完整分析順序列出名稱直接涉及的操作；不是物件身分或 rename 歷史追蹤，靜態套用不等於資料庫執行。</p>
    {hits.length === 0 ? <p>沒有可直接追溯的操作來源；不補推測。</p> : <ul>{hits.map(hit => <li key={`${hit.migrationIndex}:${hit.operationIndex}`}>
      <span>{statusLabels[hit.status]} · {hit.operation.kind} · {hit.filename}</span>{' '}
      <button type="button" className="secondary" disabled={hit.source === null} onClick={event => onSource(hit,event.currentTarget)}>
        查看 PHP 來源 {hit.filename} · {hit.operation.kind} · {hit.source && hit.source.line > 0 ? `第 ${hit.source.line} 行` : '位置未知'}
      </button>
    </li>)}</ul>}
  </section>;
}
export function OperationSourcePanel({ hit, files, onBack }: { hit: OperationSource; files: readonly MigrationFile[]; onBack: () => void }) {
  const panel = useRef<HTMLElement>(null);
  const matches = files.filter(file => file.filename === hit.source?.file);
  const file = matches.length === 1 ? matches[0] : null;
  const excerpt = file ? sourceExcerpt(file.source,hit.source?.line ?? null) : null;
  useEffect(() => { panel.current?.focus({preventScroll:true}); panel.current?.scrollIntoView({block:'start'}); },[hit]);
  return <section className="diagnostic-source" ref={panel} tabIndex={-1} aria-label="結構操作原始碼">
    <h3>操作原始碼 · {hit.filename}</h3>
    <p>{statusLabels[hit.status]} · {hit.operation.kind}；這是名稱涉及的語法證據，不推定跨 rename 身分。</p>
    <button type="button" onClick={onBack}>返回原結構選取</button>
    {!file || !excerpt ? <p className="unavailable">來源檔案未知或不唯一，無法定位；不以 basename 猜測。</p> : <>
      <p>{excerpt.line === null ? '來源行未知；以下僅顯示檔案開頭。' : `來源第 ${excerpt.line} 行（core column ${hit.source?.column}）`}</p>
      <p className="muted">PHP 唯讀；修改輸入副本後須重新分析，舊來源選取會失效。</p>
      <pre aria-label="結構操作 PHP 片段">{excerpt.lines.map(line => <span className={line.number === excerpt.line ? 'source-line highlighted' : 'source-line'} key={line.number}>
        <span className="line-number">{line.number}</span>{line.number === excerpt.line ? '→ ' : '  '}{line.text}{'\n'}
      </span>)}</pre>
    </>}
  </section>;
}
