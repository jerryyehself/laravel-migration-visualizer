import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { analyzeProject } from '@lmv/migration-core';
import { OperationSources, OperationSourcePanel } from '../src/components/OperationSources';
import { operationSources } from '../src/operation-sources';
const filename='nested/2026_10_09_000001_create.php';
const source="<?php\nreturn new class extends Migration {function up(){Schema::create('t',function($t){$t->string('a');});}};\n// <script>unsafe()</script>";
const files=[{filename,source}];const result=analyzeProject(files);
const hit=operationSources(result,{table:'t',column:'a'})[0];
describe('operation source presentation',()=>{
  it('shows the exact source line, escapes PHP and keeps the return action',()=>{
    const html=renderToStaticMarkup(createElement(OperationSourcePanel,{hit,files,onBack:()=>{}}));
    expect(html).toContain('來源第 2 行');expect(html).toContain('返回原結構選取');
    expect(html).toContain('&lt;script&gt;');expect(html).not.toContain('<script>');
  });
  it('does not use basename matching or ambiguous duplicate files',()=>{
    const render=(inputs:typeof files)=>renderToStaticMarkup(createElement(OperationSourcePanel,{hit,files:inputs,onBack:()=>{}}));
    expect(render([{filename:filename.split('/').at(-1)!,source}])).toContain('來源檔案未知或不唯一');
    expect(render([...files,...files])).toContain('來源檔案未知或不唯一');
  });
  it('shows unknown line without inventing a valid source location',()=>{
    const html=renderToStaticMarkup(createElement(OperationSourcePanel,{hit:{...hit,source:{file:filename,line:999,column:0}},files,onBack:()=>{}}));
    expect(html).toContain('來源行未知');expect(html).not.toContain('來源第 999 行');
  });
  it('distinguishes syntactic failed sources and disables absent locations',()=>{
    const failed=structuredClone(result);failed.migrations[0].status='failed';Object.assign(failed.migrations[0].analysis.operations[1],{source:undefined});
    const html=renderToStaticMarkup(createElement(OperationSources,{result:failed,query:{table:'t',column:'a'},onSource:()=>{}}));
    expect(html).toContain('失敗：未套用');expect(html).toContain('disabled=""');
  });
});
