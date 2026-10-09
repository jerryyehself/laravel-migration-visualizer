import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { analyzeProject, type MigrationSnapshot } from '../../../packages/migration-core/src/index.js';
import { MigrationReading } from '../src/components/MigrationReading';
const file=(n:number,body:string)=>({filename:`2026_10_09_00000${n}_case.php`,source:`<?php return new class extends Migration {function up(){${body}}};`});
const render=(step:MigrationSnapshot)=>renderToStaticMarkup(createElement(MigrationReading,{step,index:0,diagnostics:createElement('p',null,'診斷 slot'),onSource:()=>{},onObject:()=>{}}));
describe('migration reading presentation',()=>{
  it('distinguishes no-op, failed and blocked without fake empty diffs',()=>{
    const r=analyzeProject([file(1,"Schema::dropIfExists('missing');"),file(2,"Schema::drop('missing');"),file(3,"Schema::drop('later');")]);
    expect(render(r.migrations[0])).toContain('已知快照：沒有結構變化');
    expect(render(r.migrations[1])).toContain('Before 已知 · After 未知');
    expect(render(r.migrations[1])).toContain('不代表沒有變更');
    expect(render(r.migrations[2])).toContain('Before 未知 · After 未知');
    expect(render(r.migrations[2])).not.toContain('已知快照：沒有結構變化');
  });
  it('shows rename and structural changes with unavailable-side reasons',()=>{
    const r=analyzeProject([file(1,"Schema::create('t',function($t){$t->string('a');});"),file(2,"Schema::table('t',function($t){$t->renameColumn('a','b');});")]);
    const html=render(r.migrations[1]);
    expect(html).toContain('renameColumn · t.a → b');expect(html).toContain('columnRemoved');expect(html).toContain('columnAdded');
    expect(html).toContain('disabled="">After · 此側不存在');expect(html).toContain('disabled="">Before · 此側不存在');expect(html).toContain('診斷 slot');
  });
  it('escapes names and disables missing PHP location',()=>{
    const r=analyzeProject([file(1,"Schema::create('<img>',function($t){});")]);
    r.migrations[0].analysis.operations[0].source=undefined;
    const html=render(r.migrations[0]);expect(html).toContain('&lt;img&gt;');expect(html).not.toContain('<img>');expect(html).toContain('disabled="">查看操作 PHP · 位置未知');
  });
});
