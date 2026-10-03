import type { MigrationFile } from '@lmv/migration-core';

// Browser IO boundary. Filename validity and ordering still belong to core.
export interface ImportFile {
  name: string;
  webkitRelativePath?: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function readMigrationFiles(files: readonly ImportFile[]): Promise<MigrationFile[]> {
  if (files.length === 0) throw new Error('請至少選擇一份 PHP migration。');
  const invalid = files.find(file => !file.name.endsWith('.php'));
  if (invalid) throw new Error(`只接受 .php 檔案：${invalid.name}`);
  const filename = (file: ImportFile) => file.webkitRelativePath || file.name;
  // Reject the whole batch if one file is unreadable; never silently import a subset.
  return Promise.all(files.map(async file => {
    try {
      const source = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      return { filename: filename(file), source };
    } catch {
      throw new Error(`無法讀取 ${filename(file)}，請確認檔案可讀取且使用 UTF-8 編碼。`);
    }
  }));
}

export interface FolderImport { files: MigrationFile[]; ignoredFiles: string[] }

export async function readMigrationFolder(entries: readonly ImportFile[]): Promise<FolderImport> {
  const php = entries.filter(file => file.name.endsWith('.php'));
  if (php.length === 0) throw new Error('選取的資料夾沒有 .php migration；目前清單保持不變。');
  const ignoredFiles = entries.filter(file => !file.name.endsWith('.php')).map(file => file.webkitRelativePath || file.name);
  // The browser supplies descendants; core still decides ordering and duplicate basenames.
  return { files: await readMigrationFiles(php), ignoredFiles };
}
