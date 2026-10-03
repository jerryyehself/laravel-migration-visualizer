import { describe, expect, it } from 'vitest';
import { analyzeProject } from '../../../packages/migration-core/src/index.js';
import { readMigrationFiles, readMigrationFolder, type ImportFile } from '../src/import-files';
const input=(path: string,source='<?php'): ImportFile=>({name:path.split('/').at(-1)!,webkitRelativePath:path,arrayBuffer:async()=>new TextEncoder().encode(source).buffer as ArrayBuffer});
const wrap=(body: string)=>`<?php return new class extends Migration { function up() { ${body} } };`;
describe('folder import boundary',()=>{
  it('retains nested relative paths and selection order, reporting ignored paths without reading them',async()=>{
    const ignored={...input('migrations/README.txt'),arrayBuffer:async()=>{throw Error('Should not read non-PHP');}};
    expect(await readMigrationFolder([input('migrations/nested/2026_07_02_000000_update.php','<?php // 中文'),ignored,input('migrations/2026_07_01_000000_create.php')])).toEqual({
      files:[{filename:'migrations/nested/2026_07_02_000000_update.php',source:'<?php // 中文'},{filename:'migrations/2026_07_01_000000_create.php',source:'<?php'}],ignoredFiles:['migrations/README.txt'],
    });
  });
  it('leaves duplicate basenames for core diagnostics, even across different subfolders',async()=>{
    const imported=await readMigrationFolder([input('migrations/a/2026_07_01_000000_create.php',wrap('')),input('migrations/b/2026_07_01_000000_create.php',wrap(''))]);
    expect(imported.files).toHaveLength(2);
    const result=analyzeProject(imported.files);expect(result.complete).toBe(false);expect(result.appliedCount).toBe(0);
    expect(result.diagnostics.some(d=>d.phase==='ordering')).toBe(true);
  });
  it('delegates ordering and source paths to core for nested project analysis',async()=>{
    const imported=await readMigrationFolder([
      input('migrations/nested/2026_07_02_000000_update.php',wrap("Schema::table('users',function($t){$t->rememberToken();});")),
      input('migrations/2026_07_01_000000_create.php',wrap("Schema::create('users',function($t){$t->id();});")),
    ]);
    const result=analyzeProject(imported.files);expect(result.complete).toBe(true);
    expect(result.migrations.map(m=>m.filename)).toEqual([imported.files[1].filename,imported.files[0].filename]);
    expect(result.migrations[1].analysis.operations[0].source.file).toBe(imported.files[0].filename);
    expect(result.finalSchema!.tables.users.columns.remember_token.length).toBe(100);
  });
  it('rejects the whole PHP batch on IO failure with the nested path',async()=>{
    const broken={...input('migrations/nested/broken.php'),arrayBuffer:async()=>{throw Error('unreadable');}};
    await expect(readMigrationFolder([input('migrations/valid.php'),broken,input('migrations/note.txt')])).rejects.toThrow('migrations/nested/broken.php');
  });
  it('rejects malformed UTF-8 in a selected PHP file',async()=>{
    const broken={...input('migrations/invalid.php'),arrayBuffer:async()=>new Uint8Array([0xc3,0x28]).buffer};
    await expect(readMigrationFolder([broken])).rejects.toThrow('UTF-8');
  });
  it.each([{entries:[]},{entries:[input('migrations/readme.txt')]},{entries:[input('migrations/UPPER.PHP')]}])('rejects a folder with no lowercase .php files',async ({entries})=>{
    await expect(readMigrationFolder(entries)).rejects.toThrow('沒有 .php');
  });
  it('uses the basename when the browser does not provide a relative path',async()=>{
    const selected=input('2026_07_01_000000_create.php');delete selected.webkitRelativePath;
    expect((await readMigrationFolder([selected])).files[0].filename).toBe(selected.name);
  });
  it('keeps ordinary multi-file selection strict about non-PHP files',async()=>{
    await expect(readMigrationFiles([input('good.php'),input('note.txt')])).rejects.toThrow('只接受');
  });
});
