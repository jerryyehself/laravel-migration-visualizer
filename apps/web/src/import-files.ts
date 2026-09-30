import type { MigrationFile } from '@lmv/migration-core';

// Browser IO boundary. Filename validity and ordering still belong to core.
export interface ImportFile {
  name: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function readMigrationFiles(files: readonly ImportFile[]): Promise<MigrationFile[]> {
  if (files.length === 0) throw new Error('請至少選擇一份 PHP migration。');
  const invalid = files.find(file => !file.name.endsWith('.php'));
  if (invalid) throw new Error(`只接受 .php 檔案：${invalid.name}`);
  // Reject the whole batch if one file is unreadable; never silently import a subset.
  return Promise.all(files.map(async file => {
    try {
      const source = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      return { filename: file.name, source };
    } catch {
      throw new Error(`無法讀取 ${file.name}，請確認檔案可讀取且使用 UTF-8 編碼。`);
    }
  }));
}
