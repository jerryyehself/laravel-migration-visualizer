import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { analyzeProject } from '../../../packages/migration-core/src/index.js';
import { WorkspaceDetails } from '../src/components/WorkspaceDetails';
import { workspaceReading } from '../src/workspace-reading';
const file=(n:number,body:string)=>({filename:`2026_10_10_00000${n}_view.php`,source:`<?php return new class extends Migration {function up(){${body}}};`});
const analysis=analyzeProject([file(1,"Schema::create('old',function($t){$t->string('name');});"),file(2,"Schema::rename('old','new');"),file(3,"Schema::drop('missing');")]);
const render=(index:number,side:'before'|'after'|'diff',table?:string)=>{
 const r=workspaceReading(analysis,{kind:'migration',index,side});
 return renderToStaticMarkup(createElement(WorkspaceDetails,{choice:r.choice,selection:table===undefined?undefined:{table},request:0,analysis,step:r.step,onSource:()=>{}}));
};
describe('fixed workspace details',()=>{
 it('shows a persistent selection prompt without inventing a table',()=>{
  const html=render(0,'after');expect(html).toContain('目前表：尚未選取');expect(html).toContain('請先聚焦資料表');
 });
 it('keeps a literal renamed table absent on the other side',()=>{
  expect(render(1,'after','old')).toContain('此快照沒有資料表 old');
  expect(render(1,'before','new')).toContain('此快照沒有資料表 new');
  expect(render(1,'after','old')).not.toContain('查看 new 的欄位');
 });
 it('renders comparison details from separate real sides',()=>{
  const html=render(1,'diff','old');expect(html).toContain('套用前資料表明細');expect(html).toContain('套用後資料表明細');
  expect(html).toContain('查看 old 的欄位');expect(html).toContain('此快照沒有資料表 old');
 });
 it('distinguishes unknown from missing in a known empty side',()=>{
  expect(render(0,'before','old')).toContain('此快照沒有資料表 old');
  expect(render(2,'after','new')).toContain('此側快照未知');expect(render(2,'after','new')).toContain('diff 未知');
  expect(render(2,'after','new')).not.toContain('此表沒有本次結構差異');
 });
 it('escapes table names and does not infer prototype tables',()=>{
  expect(render(1,'after','<script>')).toContain('&lt;script&gt;');expect(render(1,'after','constructor')).toContain('此快照沒有資料表 constructor');
 });
});
