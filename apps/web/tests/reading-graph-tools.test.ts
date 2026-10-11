import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe,it,expect } from 'vitest';
import type { SchemaState } from '@lmv/migration-core';
import { ReadingGraphTools } from '../src/components/ReadingGraphTools';
import { geometryLayout,initialGraphView } from '../src/comparison-layout';
const schema:SchemaState={tables:{users:{name:'users',columns:{nickname:{name:'nickname',type:'string',nullable:false}},indexes:{},foreignKeys:{}}}};
const render=(s:SchemaState|null,selection?:{table:string;column?:string})=>renderToStaticMarkup(createElement(ReadingGraphTools,{schema:s,side:'Before · 套用前',comparison:true,searchSide:'before',onSearchSide:()=>{},tableQuery:'users',onTableQuery:()=>{},columnQuery:'nickname',onColumnQuery:()=>{},selection,layout:geometryLayout([schema]),view:initialGraphView(geometryLayout([schema])),onViewChange:()=>{},onLocate:()=>{},onReset:()=>{},visible:s!==null}));
describe('workspace side search',()=>{
 it('shows one tool set, own-side results and independent selection literal',()=>{const html=render(schema,{table:'users',column:'nickname'});expect(html.match(/aria-label="放大 ERD"/g)).toHaveLength(1);expect(html).toContain('Before · 套用前');expect(html).toContain('查看欄位 users.nickname');expect(html).toContain('目前目標：users.nickname');});
 it('preserves query in disabled unknown search and never substitutes results',()=>{const html=render(null,{table:'users',column:'nickname'});expect(html).toContain('value="nickname"');expect(html).toContain('fieldset disabled');expect(html).not.toContain('查看欄位 users.nickname');expect(html).toContain('快照未知');});
 it('distinguishes missing column from known-empty and unknown schema',()=>{const missing=render(schema,{table:'users',column:'missing'});expect(missing).toContain('目前目標：users.missing · 此側不存在');expect(missing).toContain('disabled="">定位目前物件');const empty=render({tables:{}});expect(empty).toContain('已知空白 schema');expect(empty).not.toContain('fieldset disabled');});
});
