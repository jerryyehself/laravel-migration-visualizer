import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe,it,expect } from 'vitest';
import { analyzeProject } from '../../../packages/migration-core/src/index.js';
import { RelatedChanges } from '../src/components/RelatedChanges';
const f=(n:number,body:string)=>({filename:`2026_10_11_00000${n}_case.php`,source:`<?php return new class extends Migration {function up(){${body}}};`});
const render=(r:ReturnType<typeof analyzeProject>,table:string,column?:string)=>renderToStaticMarkup(createElement(RelatedChanges,{result:r,query:{table,...(column===undefined?{}:{column})},onQuery:()=>{},onStep:()=>{},onSource:()=>{}}));
describe('related steps presentation',()=>{
 it('keeps failure/blocked distinct and disables impossible comparison',()=>{const r=analyzeProject([f(1,"Schema::drop('users');"),f(2,"Schema::drop('users');")]);const html=render(r,'users');expect(html).toContain('失敗：未套用');expect(html).toContain('前序阻擋：未套用');expect(html).toContain('disabled="">查看此步比較');expect(html).toContain('快照未知');expect(html).toContain('沒有相關證據不等於沒有變化');});
 it('shows deleted-name query and escapes names',()=>{const r=analyzeProject([f(1,"Schema::create('<t>',function($t){$t->string('<c>');});"),f(2,"Schema::drop('<t>');")]);const html=render(r,'<t>','<c>');expect(html).toContain('最終：不存在');expect(html).toContain('tableRemoved');expect(html).toContain('&lt;c&gt;');expect(html).not.toContain('<c>');});
 it('provides separate zero-file, ordering and no-evidence messages',()=>{expect(render(analyzeProject([]),'t')).toContain('已知零份');expect(render(analyzeProject([{filename:'invalid.php',source:'<?php'}]),'t')).toContain('檔名排序未開始');expect(render(analyzeProject([f(1,"Schema::dropIfExists('other');")]),'t')).toContain('沒有此精確名稱的相關證據');});
});
