import { useEffect, useRef } from 'react';
import type { MigrationFile, ProjectDiagnostic } from '@lmv/migration-core';
import { diagnosticExcerpt } from '../diagnostic-location';

export function DiagnosticSource({ file, diagnostic }: { file: MigrationFile; diagnostic: ProjectDiagnostic }) {
  const panel = useRef<HTMLElement>(null);
  const excerpt = diagnosticExcerpt(file.source, diagnostic);
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
    panel.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [file, diagnostic]);
  return <section ref={panel} tabIndex={-1} className="diagnostic-source" aria-label="診斷原始碼定位">
    <h3>診斷原始碼 · {file.filename}</h3>
    <p>{diagnostic.code} · {diagnostic.message}</p>
    <p>{excerpt.line === null ? '此診斷沒有可定位的 PHP 行；以下顯示檔案開頭。' : `定位第 ${excerpt.line} 行（core column ${diagnostic.source.column}）；包含前後最多三行。`}</p>
    <p className="muted">原始碼唯讀；要修正請回到輸入區修改副本，再重新分析。欄位值沿用 core，不標示字元範圍。</p>
    <pre aria-label="診斷原始碼片段">{excerpt.lines.map(line => <span className={line.number === excerpt.line ? 'source-line highlighted' : 'source-line'} key={line.number}>
      <span className="line-number">{line.number}</span>{line.number === excerpt.line ? '→ ' : '  '}{line.text}{'\n'}
    </span>)}</pre>
  </section>;
}
