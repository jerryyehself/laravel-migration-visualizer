import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ProjectWorkbench } from './components/ProjectWorkbench';
import { SingleWorkbench } from './components/SingleWorkbench';
import './style.css';
import { version } from '../package.json';

function App() {
  const [mode, setMode] = useState<'project' | 'single'>('project');
  return <main>
    <p className="eyebrow">VERSION {version} / STATIC ANALYSIS</p>
    <h1>Laravel Migration Visualizer</h1>
    <p>PHP → AtomicOperation → SchemaState → SchemaDiff</p>
    <p>靜態分析工作台。僅讀取 up()，不執行 PHP，也不連接資料庫。</p>
    <details><summary>使用範圍與限制</summary>
      <p>可分析支援的 Schema／Blueprint 靜態呼叫；動態變數、條件控制、任意 PHP 與 SQL 不會執行。出現不支援操作時，請查看診斷，不能把成功前綴當成最終結果。</p>
      <p>輸入、修改與分析結果只保留在目前頁面；重新整理會清除。大型專案的完整快照可能使用較多記憶體，建議先用少量檔案確認相容性。JSON 下載不包含修改後的 PHP 原始檔。</p>
    </details>
    <nav className="mode-switch" aria-label="工作台模式">
      <button type="button" aria-pressed={mode === 'project'} onClick={() => setMode('project')}>多檔專案</button>
      <button type="button" aria-pressed={mode === 'single'} onClick={() => setMode('single')}>單檔練習</button>
    </nav>
    <p className="muted">切換模式時會重置離開的工作台輸入與結果。</p>
    {mode === 'project' ? <ProjectWorkbench /> : <SingleWorkbench />}
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
