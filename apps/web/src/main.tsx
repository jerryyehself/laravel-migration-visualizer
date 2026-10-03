import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ProjectWorkbench } from './components/ProjectWorkbench';
import { SingleWorkbench } from './components/SingleWorkbench';
import './style.css';

function App() {
  const [mode, setMode] = useState<'project' | 'single'>('project');
  return <main>
    <p className="eyebrow">MILESTONE 17 / SYNCHRONIZED ERD</p>
    <h1>Laravel Migration Visualizer</h1>
    <p>PHP → AtomicOperation → SchemaState → SchemaDiff</p>
    <p>靜態分析工作台。僅讀取 up()，不執行 PHP，也不連接資料庫。</p>
    <nav className="mode-switch" aria-label="工作台模式">
      <button type="button" aria-pressed={mode === 'project'} onClick={() => setMode('project')}>多檔專案</button>
      <button type="button" aria-pressed={mode === 'single'} onClick={() => setMode('single')}>單檔練習</button>
    </nav>
    <p className="muted">切換模式時會重置離開的工作台輸入與結果。</p>
    {mode === 'project' ? <ProjectWorkbench /> : <SingleWorkbench />}
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
