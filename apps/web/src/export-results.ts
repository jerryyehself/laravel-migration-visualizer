import type { ProjectAnalysis } from '@lmv/migration-core';

export interface JsonDownload { filename: string; contents: string; mimeType: 'application/json;charset=utf-8' }
export type ExportKind = 'analysis' | 'finalSchema';

// Serialize the public core contract without replaying, filtering or filling unknown snapshots.
export function prepareProjectExport(result: ProjectAnalysis, kind: ExportKind): JsonDownload {
  if (kind === 'finalSchema' && (!result.complete || result.finalSchema === null)) {
    throw new Error('分析未完成，沒有可信的最終 Schema；請下載完整分析結果查看診斷與成功前綴。');
  }
  return {
    filename: kind === 'analysis' ? 'migration-project-analysis.json' : 'migration-final-schema.json',
    contents: JSON.stringify(kind === 'analysis' ? result : result.finalSchema, null, 2) + '\n',
    mimeType: 'application/json;charset=utf-8',
  };
}

// Browser IO lives in the web caller; core never handles Blob, DOM or object URLs.
export function downloadJson(download: JsonDownload): void {
  const url = URL.createObjectURL(new Blob([download.contents], { type: download.mimeType }));
  const link = document.createElement('a');
  try {
    link.href = url;
    link.download = download.filename;
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    // Allow the browser to consume the URL before releasing its backing Blob.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
