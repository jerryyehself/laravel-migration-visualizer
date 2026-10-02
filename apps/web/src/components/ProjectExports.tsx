import { useState } from 'react';
import type { ProjectAnalysis } from '@lmv/migration-core';
import { downloadJson, prepareProjectExport, type ExportKind } from '../export-results';

export function ProjectExports({ result }: { result: ProjectAnalysis }) {
  const [error, setError] = useState<string | null>(null);
  function exportResult(kind: ExportKind) {
    setError(null);
    try { downloadJson(prepareProjectExport(result, kind)); }
    catch (cause) { setError(`無法啟動下載：${cause instanceof Error ? cause.message : String(cause)}`); }
  }
  const hasFinalSchema = result.complete && result.finalSchema !== null;
  return <div className="export-panel">
    <div className="toolbar">
      <button type="button" className="secondary" onClick={() => exportResult('analysis')}>下載完整分析 JSON</button>
      <button type="button" className="secondary" disabled={!hasFinalSchema} onClick={() => exportResult('finalSchema')}>下載最終 Schema JSON</button>
    </div>
    <p className="muted">完整分析包含排序、逐檔操作、快照、diff 與診斷；不包含 PHP 原始碼。下載在本機瀏覽器處理。</p>
    {!hasFinalSchema && <p className="unavailable">分析未完成，最終 Schema 下載不可用。完整分析中的 lastValidSchema 僅代表成功前綴。</p>}
    {error && <p role="alert" className="diagnostic">{error}</p>}
  </div>;
}
