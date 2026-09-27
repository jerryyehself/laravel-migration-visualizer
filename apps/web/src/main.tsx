import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { analyzeMigration, applyOperations, emptySchema, type AnalysisResult } from '@lmv/migration-core';
import fixture from '../../../packages/migration-core/tests/fixtures/001_create_users.php?raw';
import './style.css';

// Props: the parent gives this component data; it only handles presentation.
function AnalysisView({ result }: { result: AnalysisResult }) {
  let stateText = '分析不完整：以下 operations 僅供檢視，不推算完整 schema。';
  if (result.complete) {
    try { stateText = JSON.stringify(applyOperations(emptySchema(), result.operations), null, 2); }
    catch (error) { stateText = `無法套用至空白 schema：${(error as Error).message}`; }
  }
  return <section aria-live="polite">
    <h2>{result.complete ? '分析完成' : '需要檢視'} · {result.operations.length} 個操作</h2>
    {result.diagnostics.map((item, index) => <p className="diagnostic" key={index}>{item.source.file}:{item.source.line} — {item.message}</p>)}
    <div className="results"><article><h3>AtomicOperation JSON</h3><pre>{JSON.stringify(result.operations, null, 2)}</pre></article><article><h3>SchemaState</h3><pre>{stateText}</pre></article></div>
  </section>;
}
function App() {
  // State remembers UI input and the last submitted analysis. Domain rules live in core.
  const [source, setSource] = useState(fixture);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  return <main>
    <p className="eyebrow">MILESTONE 01 / ANALYSIS CORE</p>
    <h1>Laravel Migration Visualizer</h1>
    <p>PHP → AST → AtomicOperation → SchemaState</p>
    <p>靜態分析工作台。僅讀取 up()，不執行 PHP。Schema::table 需要先前的 schema，這個單檔工作台從空白狀態開始。</p>
    <form onSubmit={event => { event.preventDefault(); setResult(analyzeMigration(source, 'input.php')); }}>
      <label htmlFor="source">Migration PHP</label>
      <textarea id="source" spellCheck={false} value={source} onChange={event => { setSource(event.target.value); setResult(null); }} />
      <button type="submit">分析 Migration</button>
    </form>
    {result && <AnalysisView result={result} />}
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
