import { describe, expect, it } from 'vitest';
import { analyzeProject, type MigrationFile } from '../../../packages/migration-core/src/index.js';
import { filterMigrationResults, visibleSelection } from '../src/filter-results';
import { prepareProjectExport } from '../src/export-results';
const file=(filename: string,body: string): MigrationFile=>({filename,source:`<?php return new class extends Migration { function up() { ${body} } };`});
const project=()=>analyzeProject([
  file('database/migrations/2026_06_03_000000_update_users.php',"Schema::table('users',function($t){$t->rememberToken();});"),
  file('database/migrations/2026_06_01_000000_create_users.php',"Schema::create('users',function($t){$t->id();});"),
  file('database/migrations/2026_06_02_000000_invalid_users.php',"Schema::drop('missing');"),
]);
describe('migration result view filters',()=>{
  it('retains core ordering and original indices when searching filenames or paths',()=>{
    const result=project();
    expect(filterMigrationResults(result.migrations,'users','all').map(m=>m.index)).toEqual([0,1,2]);
    expect(filterMigrationResults(result.migrations,'database/migrations','all').map(m=>m.index)).toEqual([0,1,2]);
    expect(filterMigrationResults(result.migrations,'update_users','all').map(m=>m.index)).toEqual([2]);
  });
  it('ignores search case and trims surrounding whitespace',()=>{
    expect(filterMigrationResults(project().migrations,'  CREATE_USERS  ','all').map(m=>m.index)).toEqual([0]);
  });
  it.each([{status:'applied' as const,index:0},{status:'failed' as const,index:1},{status:'blocked' as const,index:2}])('shows only $status and preserves its core index',({status,index})=>{
    expect(filterMigrationResults(project().migrations,'',status).map(m=>m.index)).toEqual([index]);
  });
  it('combines filename and status, returning no match instead of an unrelated step',()=>{
    const visible=filterMigrationResults(project().migrations,'create','failed');
    expect(visible).toEqual([]);expect(visibleSelection(visible,0)).toBeNull();
  });
  it('keeps a visible selection and falls back to the first visible core index',()=>{
    const migrations=project().migrations;
    expect(visibleSelection(filterMigrationResults(migrations,'','all'),2)).toBe(2);
    expect(visibleSelection(filterMigrationResults(migrations,'','failed'),0)).toBe(1);
    expect(visibleSelection(filterMigrationResults(migrations,'','all'),99)).toBe(0);
  });
  it('does not modify snapshots, hide global diagnostics or reduce the exported report',()=>{
    const result=project(),before=structuredClone(result);
    filterMigrationResults(result.migrations,'invalid','failed');
    expect(result).toEqual(before);expect(result.diagnostics).toHaveLength(2);
    const exported=JSON.parse(prepareProjectExport(result,'analysis').contents);
    expect(exported.migrations).toHaveLength(3);expect(exported).toEqual(before);
    expect(exported.migrations[2].schemaAfter).toBeNull();
  });
  it('handles an empty result and an all-whitespace query',()=>{
    expect(filterMigrationResults([], '', 'all')).toEqual([]);
    expect(visibleSelection([],0)).toBeNull();
    expect(filterMigrationResults(project().migrations,'   ','all')).toHaveLength(3);
  });
});
