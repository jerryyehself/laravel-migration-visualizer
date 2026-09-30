import { describe, expect, it } from 'vitest';
import { readMigrationFiles, type ImportFile } from '../src/import-files';

function input(name: string, text: string): ImportFile {
  return { name, arrayBuffer: async () => new TextEncoder().encode(text).buffer as ArrayBuffer };
}

describe('browser migration import boundary', () => {
  it('reads UTF-8 text without sorting, renaming or dropping duplicate files', async () => {
    const files = [input('2026_01_02_000000_update.php', '<?php // 中文'), input('2026_01_01_000000_create.php', '<?php'), input('2026_01_01_000000_create.php', 'duplicate')];
    expect(await readMigrationFiles(files)).toEqual([
      { filename: files[0].name, source: '<?php // 中文' },
      { filename: files[1].name, source: '<?php' },
      { filename: files[2].name, source: 'duplicate' },
    ]);
  });
  it('rejects the batch if any file is not PHP, even if the picker allowed it', async () => {
    await expect(readMigrationFiles([input('valid.php', '<?php'), input('notes.txt', 'notes')])).rejects.toThrow('notes.txt');
  });
  it('does not return a partial batch on IO failure', async () => {
    const unreadable: ImportFile = { name: 'broken.php', arrayBuffer: async () => { throw new Error('read failed'); } };
    await expect(readMigrationFiles([input('valid.php', '<?php'), unreadable])).rejects.toThrow('broken.php');
  });
  it('rejects invalid UTF-8 instead of analyzing replacement characters', async () => {
    const malformed: ImportFile = { name: 'encoding.php', arrayBuffer: async () => new Uint8Array([0xc3, 0x28]).buffer };
    await expect(readMigrationFiles([malformed])).rejects.toThrow('UTF-8');
  });
  it('rejects an empty batch', async () => {
    await expect(readMigrationFiles([])).rejects.toThrow('至少選擇');
  });
});
