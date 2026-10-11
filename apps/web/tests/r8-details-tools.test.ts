import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { analyzeProject } from '../../../packages/migration-core/src/index.js';
import { WorkspaceDetails } from '../src/components/WorkspaceDetails';
import { ProjectResults } from '../src/components/ProjectResults';
import { OperationSources, OperationSourcePanel } from '../src/components/OperationSources';
import { workspaceReading } from '../src/workspace-reading';
const files=[{filename:'2026_10_11_000001_a.php',source:"<?php return new class extends Migration{function up(){Schema::create('users',function($t){$t->string('name');});}};"},{filename:'2026_10_11_000002_b.php',source:"<?php return new class extends Migration{function up(){Schema::table('users',function($t){$t->string('nickname');});}};"}];
const result=analyzeProject(files);
describe('R8.5 discoverable details and advanced boundaries',()=>{
 it('lists complete sources exactly once in comparison, after both own-side structures',()=>{
  const r=workspaceReading(result,{kind:'migration',index:1,side:'diff'});
  const html=renderToStaticMarkup(createElement(WorkspaceDetails,{choice:r.choice,selection:{table:'users',column:'nickname'},request:0,analysis:result,step:r.step,currentIndex:1,onSource:()=>{}}));
  expect(html.match(/class="operation-source-list"/g)).toHaveLength(1);
  expect(html).toContain('此側沒有欄位 nickname');expect(html).toContain('nickname · string');
  expect(html.indexOf('外鍵 ·')).toBeLessThan(html.indexOf('完整分析順序'));
 });
 it('retains a source lookup for a name missing in the current known schema',()=>{
  const r=workspaceReading(result,{kind:'initial'});
  const html=renderToStaticMarkup(createElement(WorkspaceDetails,{choice:r.choice,selection:{table:'users',column:'nickname'},request:0,analysis:result,step:null,currentIndex:-1,onSource:()=>{}}));
  expect(html).toContain('此快照沒有資料表 users');expect(html).toContain('操作來源 users.nickname');expect(html).toContain('目前時點之後的來源');
 });
 it('marks future sources separately from static applied status without filtering order',()=>{
  const html=renderToStaticMarkup(createElement(OperationSources,{result,query:{table:'users'},currentIndex:0,onSource:()=>{}}));
  expect(html).toContain('第 1 份 · 靜態已套用');expect(html).toContain('第 2 份 · 靜態已套用 · 目前時點之後的來源（未表示已套用）');
  expect(html.indexOf(files[0].filename)).toBeLessThan(html.indexOf(files[1].filename));
 });
 it('preserves failed and blocked analysis status even when sources are later than the current time',()=>{
  const r=analyzeProject([files[0],{filename:files[1].filename,source:"<?php return new class extends Migration{function up(){Schema::table('users',function($t){$t->dropColumn('missing');});}};"},{filename:'2026_10_11_000003_c.php',source:files[1].source}]);
  const html=renderToStaticMarkup(createElement(OperationSources,{result:r,query:{table:'users'},currentIndex:0,onSource:()=>{}}));
  expect(html).toContain('失敗：未套用');expect(html).toContain('前序阻擋：未套用');expect(html.match(/目前時點之後的來源/g)).toHaveLength(2);
 });
 it('keeps advanced closed, both exports and full DTO available, with explicit final table time',()=>{
  const html=renderToStaticMarkup(createElement(ProjectResults,{result,files,selected:0,onSelect:()=>{},onEdit:()=>{}}));
  expect(html).toContain('<details class="advanced-analysis"><summary>進階分析');
  expect(html).toContain('下載完整分析 JSON');expect(html).toContain('下載最終 Schema JSON');expect(html).toContain('完整 ProjectAnalysis JSON');
  expect(html).toContain('<details><summary>專案最終 Schema · 全部成功套用後');
  expect(html.match(/class="all-diagnostics"/g)).toHaveLength(1);
 });
 it('keeps incomplete status primary and prefix explicitly separate from disabled final export',()=>{
  const failed=analyzeProject([...files,{filename:'2026_10_11_000003_c.php',source:"<?php return new class extends Migration{function up(){Schema::drop('missing');}};"}]);
  const html=renderToStaticMarkup(createElement(ProjectResults,{result:failed,files,selected:0,onSelect:()=>{},onEdit:()=>{}}));
  expect(html.indexOf('專案分析未完成')).toBeLessThan(html.indexOf('advanced-analysis'));
  expect(html).toContain('最後可信 Schema · 僅成功前綴，非最終');expect(html).toContain('disabled="">下載最終 Schema JSON');
 });
 it('does not guess a source file when filenames are ambiguous',()=>{
  const hit={migrationIndex:0,operationIndex:0,filename:files[0].filename,status:'applied' as const,operation:result.migrations[0].analysis.operations[0],source:{file:files[0].filename,line:1,column:1}};
  const html=renderToStaticMarkup(createElement(OperationSourcePanel,{hit,files:[files[0],files[0]],onBack:()=>{}}));
  expect(html).toContain('來源檔案未知');expect(html).not.toContain('結構操作 PHP 片段');
 });
});
