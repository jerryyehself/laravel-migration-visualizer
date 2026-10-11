import { useState } from 'react';
import { ProjectWorkbench } from './components/ProjectWorkbench';
import { SingleWorkbench } from './components/SingleWorkbench';
import { version } from '../package.json';

export function App() {
  const [mode, setMode] = useState<'project' | 'single'>('project');
  return <main>
    <p className="eyebrow">VERSION {version} / STATIC ANALYSIS</p>
    <h1>Laravel Migration Visualizer</h1>
    <p>看專案結構、讀 migration 變更、追查 PHP 來源。</p>
    <p>靜態分析工作台。僅讀取 up()，不執行 PHP，也不連接資料庫。</p>
    <details><summary>使用範圍與限制</summary>
      <p>技術管線：PHP → AtomicOperation → SchemaState → SchemaDiff。</p>
      <p>可分析支援的 Schema／Blueprint 靜態呼叫；動態變數、條件控制、任意 PHP 與 SQL 不會執行。出現不支援操作時，請查看診斷，不能把成功前綴當成最終結果。</p>
      <p>輸入、修改與分析結果只保留在目前頁面；重新整理會清除。大型專案的完整快照可能使用較多記憶體，建議先用少量檔案確認相容性。JSON 下載不包含修改後的 PHP 原始檔。</p>
    </details>
    <nav className="mode-switch" aria-label="工作台工具">
      {mode === 'single' && <button type="button" onClick={() => setMode('project')}>返回多檔閱讀</button>}
      <details><summary>工具</summary>
        <button type="button" aria-pressed={mode === 'single'} onClick={() => setMode('single')}>單檔練習</button>
      </details>
    </nav>
    <p className="muted">工具往返保留此頁的多檔副本與分析；重新整理仍會清除。</p>
    <div hidden={mode !== 'project'}><ProjectWorkbench /></div>
    {mode === 'single' && <SingleWorkbench />}

  </main>;
}
