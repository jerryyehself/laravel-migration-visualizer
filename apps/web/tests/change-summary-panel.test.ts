import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { analyzeProject } from '../../../packages/migration-core/src/index.js';
import { ChangeSummary } from '../src/components/ChangeSummary';
const file=(n:number,body:string)=>({filename:`2026_10_11_00000${n}_case.php`,source:`<?php return new class extends Migration {function up(){${body}}};`});
const render=(r:ReturnType<typeof analyzeProject>,i:number)=>renderToStaticMarkup(createElement(ChangeSummary,{step:r.migrations[i],analysis:r,onSource:()=>{},onObject:()=>{}}));
describe('change summary side and source contracts',()=>{
 it('uses real column definitions without requiring JSON',()=>{
  const r=analyzeProject([file(1,"Schema::create('products',function($t){$t->decimal('price',8,2);});"),file(2,"Schema::table('products',function($t){$t->decimal('price',10,2)->nullable()->default(0)->change();});")]);
  const html=render(r,1);expect(html).toContain('decimal(8,2)');expect(html).toContain('decimal(10,2)');expect(html).toContain('Before 未指定');expect(html).toContain('After 0');expect(html).toContain('Before false');expect(html).toContain('After true');expect(html).not.toContain('JSON');expect(html).toContain('不將差異猜成一對一來源');
 });
 it('keeps rename removed/added distinct from same-name drop/add net change',()=>{
  const r=analyzeProject([file(1,"Schema::create('t',function($t){$t->string('a');});"),file(2,"Schema::table('t',function($t){$t->renameColumn('a','b');});"),file(3,"Schema::table('t',function($t){$t->dropColumn('b');$t->string('b',200);});")]);
  const rename=render(r,1);expect(rename).toContain('columnRemoved');expect(rename).toContain('columnAdded');expect(rename).not.toContain('columnChanged');expect(render(r,2)).toContain('columnChanged');
  expect(rename).toContain('Before · a · 查看明細');expect(rename).not.toContain('After · a · 查看明細');expect(rename).toContain('After · b · 查看明細');
 });
 it('shows owning-table foreign-key context and each real side',()=>{
  const r=analyzeProject([file(1,"Schema::create('users',function($t){$t->unsignedBigInteger('id');});Schema::create('posts',function($t){$t->unsignedBigInteger('user_id');$t->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();});"),file(2,"Schema::table('posts',function($t){$t->dropForeign('posts_user_id_foreign');});")]);
  const html=render(r,1);expect(html).toContain('修改表 posts');expect(html).not.toContain('修改表 users');expect(html).toContain('引用表不代表被修改');expect(html).toContain('Before · 引用欄位 users.id · 查看明細');expect(html).not.toContain('After · 引用欄位');expect(html).toContain('cascade');
 });
 it('retains whole-table known contents and escapes names',()=>{
  const r=analyzeProject([file(1,"Schema::create('<t>',function($t){$t->string('<a>');$t->index('<a>');});")]);
  const html=render(r,0);expect(html).toContain('整表新增的已知內容');expect(html).toContain('並非額外的 core 差異');expect(html).toContain('&lt;a&gt;');expect(html).not.toContain('<a>');
 });
});
