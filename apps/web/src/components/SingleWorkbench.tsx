import { useState } from 'react';
import { analyzeMigration, applyOperations, emptySchema, type AnalysisResult } from '@lmv/migration-core';
import fixture from '../../../../packages/migration-core/tests/fixtures/001_create_users.php?raw';

function AnalysisView({ result }: { result: AnalysisResult }) {
  let stateText = '分析不完整：以下 operations 僅供檢視，不推算完整 schema。';
  if (result.complete) {
    try { stateText = JSON.stringify(applyOperations(emptySchema(), result.operations), null, 2); }
    catch (error) { stateText = `無法套用至空白 schema：${(error as Error).message}`; }
  }
  return <section aria-live="polite">
    <h2>{result.complete ? '語法分析完成' : '需要檢視'} · {result.operations.length} 個操作</h2>
    {result.diagnostics.map((item, index) => <p className="diagnostic" key={index}>{item.source.file}:{item.source.line} — {item.message}</p>)}
    <div className="results"><article><h3>AtomicOperation JSON</h3><pre>{JSON.stringify(result.operations, null, 2)}</pre></article><article><h3>SchemaState</h3><pre>{stateText}</pre></article></div>
  </section>;
}

export function SingleWorkbench() {
  const [source, setSource] = useState(fixture);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  return <>
    <p>從空白 schema 開始。單獨分析 Schema::table 可能因缺少前序 migration 而無法套用；可切換到多檔專案。</p>
    <form onSubmit={event => { event.preventDefault(); setResult(analyzeMigration(source, 'input.php')); }}>
      <label htmlFor="source">Migration PHP</label>
      <textarea id="source" spellCheck={false} value={source} onChange={event => { setSource(event.target.value); setResult(null); }} />
      <button type="submit">分析 Migration</button>
    </form>
    {result && <AnalysisView result={result} />}
  </>;
}
