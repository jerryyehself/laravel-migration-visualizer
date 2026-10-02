import { useState } from 'react';
import { analyzeProject, type MigrationFile, type ProjectAnalysis } from '@lmv/migration-core';
import createSource from '../../../../packages/migration-core/tests/fixtures/project/2026_01_01_000000_create_users.php?raw';
import updateSource from '../../../../packages/migration-core/tests/fixtures/project/2026_01_02_000000_update_users.php?raw';
import reviseSource from '../../../../packages/migration-core/tests/fixtures/project/2026_01_03_000000_revise_users.php?raw';
import unsupportedSource from '../../../../packages/migration-core/tests/fixtures/project/2026_01_02_000000_unsupported.php?raw';
import indexedCreate from '../../../../packages/migration-core/tests/fixtures/indexes/2026_02_01_000000_create_accounts.php?raw';
import indexedUpdate from '../../../../packages/migration-core/tests/fixtures/indexes/2026_02_02_000000_update_accounts.php?raw';
import indexedPrimary from '../../../../packages/migration-core/tests/fixtures/indexes/2026_02_03_000000_primary_accounts.php?raw';
import foreignUsers from '../../../../packages/migration-core/tests/fixtures/foreign-keys/2026_03_01_000000_create_users.php?raw';
import foreignPosts from '../../../../packages/migration-core/tests/fixtures/foreign-keys/2026_03_02_000000_create_posts.php?raw';
import foreignRevise from '../../../../packages/migration-core/tests/fixtures/foreign-keys/2026_03_03_000000_revise_keys.php?raw';
import foreignRemove from '../../../../packages/migration-core/tests/fixtures/foreign-keys/2026_03_04_000000_remove_key.php?raw';
import foreignInvalid from '../../../../packages/migration-core/tests/fixtures/foreign-keys/2026_03_03_000000_invalid_drop.php?raw';
import lifecycleCreate from '../../../../packages/migration-core/tests/fixtures/table-lifecycle/2026_04_01_000000_create_tables.php?raw';
import lifecycleRename from '../../../../packages/migration-core/tests/fixtures/table-lifecycle/2026_04_02_000000_rename_tables.php?raw';
import lifecycleDrop from '../../../../packages/migration-core/tests/fixtures/table-lifecycle/2026_04_03_000000_drop_articles.php?raw';
import lifecycleFinish from '../../../../packages/migration-core/tests/fixtures/table-lifecycle/2026_04_04_000000_drop_members.php?raw';
import lifecycleInvalid from '../../../../packages/migration-core/tests/fixtures/table-lifecycle/2026_04_03_000000_invalid_drop.php?raw';
import { readMigrationFiles } from '../import-files';
import { ProjectResults } from './ProjectResults';

function sampleFiles(failing = false): MigrationFile[] {
  // Deliberately unordered: only core decides execution order.
  return [
    { filename: '2026_01_03_000000_revise_users.php', source: reviseSource },
    { filename: '2026_01_01_000000_create_users.php', source: createSource },
    failing
      ? { filename: '2026_01_02_000000_unsupported.php', source: unsupportedSource }
      : { filename: '2026_01_02_000000_update_users.php', source: updateSource },
  ];
}

function foreignFiles(failing = false): MigrationFile[] {
  return [
    { filename:'2026_03_04_000000_remove_key.php', source:foreignRemove },
    { filename:'2026_03_01_000000_create_users.php', source:foreignUsers },
    failing ? { filename:'2026_03_03_000000_invalid_drop.php', source:foreignInvalid }
      : { filename:'2026_03_03_000000_revise_keys.php', source:foreignRevise },
    { filename:'2026_03_02_000000_create_posts.php', source:foreignPosts },
  ];
}

function lifecycleFiles(failing = false): MigrationFile[] {
  return [
    { filename:'2026_04_04_000000_drop_members.php', source:lifecycleFinish },
    { filename:'2026_04_01_000000_create_tables.php', source:lifecycleCreate },
    failing ? { filename:'2026_04_03_000000_invalid_drop.php', source:lifecycleInvalid }
      : { filename:'2026_04_03_000000_drop_articles.php', source:lifecycleDrop },
    { filename:'2026_04_02_000000_rename_tables.php', source:lifecycleRename },
  ];
}

export function ProjectWorkbench() {
  const [files, setFiles] = useState<MigrationFile[]>(sampleFiles);
  const [selectedInput, setSelectedInput] = useState(0);
  const [selectedResult, setSelectedResult] = useState(0);
  const [result, setResult] = useState<ProjectAnalysis | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeFile = files[selectedInput];

  function replaceFiles(next: MigrationFile[]) {
    setFiles(next); setSelectedInput(0); setResult(null); setError(null);
  }
  function updateFile(patch: Partial<MigrationFile>) {
    setFiles(current => current.map((file, index) => index === selectedInput ? { ...file, ...patch } : file));
    setResult(null); setError(null);
  }
  async function importFiles(chosen: File[]) {
    setReading(true); setError(null); setResult(null);
    try { replaceFiles(await readMigrationFiles(chosen)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '匯入失敗。'); }
    finally { setReading(false); }
  }
  function analyze() {
    setError(null); setResult(null); setSelectedResult(0);
    try { setResult(analyzeProject(files)); }
    catch (cause) { setError(`分析發生非預期錯誤：${cause instanceof Error ? cause.message : String(cause)}`); }
  }

  return <>
    <p>選取多份 UTF-8 PHP migration，由 core 依檔名排序並從空白 schema 逐份分析。檔案在此瀏覽器中讀取，不會上傳至伺服器。</p>
    <fieldset disabled={reading} className="input-panel">
      <legend>Migration 專案輸入</legend>
      <div className="toolbar">
        <div><label htmlFor="migration-files">匯入 PHP 檔案（取代目前清單）</label>
          <input id="migration-files" type="file" multiple accept=".php" onChange={event => {
            const chosen = Array.from(event.target.files ?? []);
            event.target.value = '';
            if (chosen.length > 0) void importFiles(chosen);
          }} /></div>
        <button type="button" className="secondary" onClick={() => replaceFiles(sampleFiles())}>載入成功範例</button>
        <button type="button" className="secondary" onClick={() => replaceFiles(sampleFiles(true))}>載入失敗範例</button>
        <button type="button" className="secondary" onClick={() => replaceFiles([
          { filename: '2026_02_03_000000_primary_accounts.php', source: indexedPrimary },
          { filename: '2026_02_01_000000_create_accounts.php', source: indexedCreate },
          { filename: '2026_02_02_000000_update_accounts.php', source: indexedUpdate },
        ])}>載入索引範例</button>
        <button type="button" className="secondary" onClick={() => replaceFiles(foreignFiles())}>載入外鍵範例</button>
        <button type="button" className="secondary" onClick={() => replaceFiles(foreignFiles(true))}>載入外鍵失敗範例</button>
        <button type="button" className="secondary" onClick={() => replaceFiles(lifecycleFiles())}>載入資料表生命週期範例</button>
        <button type="button" className="secondary" onClick={() => replaceFiles(lifecycleFiles(true))}>載入刪表失敗範例</button>
      </div>
      <p className="muted">檔名格式：YYYY_MM_DD_HHMMSS_description.php。匯入順序不影響分析順序；重複名稱由 core 診斷。</p>
      <div className="project-layout">
        <nav className="migration-list" aria-label="待分析檔案（輸入順序）">
          <h3>輸入清單 · {files.length} 份</h3>
          {files.map((file, index) => <button className="migration-item" type="button" key={index}
            aria-pressed={selectedInput === index} onClick={() => setSelectedInput(index)}>{file.filename || '（未命名）'}</button>)}
          {files.length === 0 && <p className="muted">請匯入檔案或載入範例。</p>}
        </nav>
        {activeFile && <div>
          <label htmlFor="migration-filename">檔名</label>
          <input id="migration-filename" type="text" spellCheck={false} value={activeFile.filename} onChange={event => updateFile({ filename: event.target.value })} />
          <label htmlFor="project-source">PHP 原始碼（僅修改此工作台副本）</label>
          <textarea id="project-source" spellCheck={false} value={activeFile.source} onChange={event => updateFile({ source: event.target.value })} />
          <button type="button" className="secondary" onClick={() => replaceFiles(files.filter((_, index) => index !== selectedInput))}>移除此檔</button>
        </div>}
      </div>
      <button type="button" disabled={files.length === 0} onClick={analyze}>分析專案</button>
    </fieldset>
    {reading && <p role="status">讀取檔案中…</p>}
    {error && <p role="alert" className="diagnostic">{error} 原始檔案不會被修改。</p>}
    {!result && !reading && <p className="muted">目前尚無分析結果。修改檔名或內容後，請重新分析專案。</p>}
    {result && <ProjectResults result={result} selected={selectedResult} onSelect={setSelectedResult} />}
  </>;
}
