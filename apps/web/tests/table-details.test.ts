import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TableDetails } from '../src/components/TableDetails';
import type { SchemaState } from '../../../packages/migration-core/src/index.js';
const table = (name: string) => ({name,columns:{},indexes:{},foreignKeys:{}});
const render = (schema: SchemaState, selected?: string) => renderToStaticMarkup(createElement(TableDetails,{schema,selected}));
describe('table inspector rendering contract', () => {
  it('distinguishes no selection from a table missing on the current snapshot', () => {
    expect(render({tables:{}})).toContain('請先聚焦資料表');
    expect(render({tables:{}},'posts')).toContain('此快照沒有資料表 posts');
    expect(render({tables:{}},'posts')).not.toContain('查看 posts 的欄位');
  });
  it('does not treat inherited identifiers as actual tables', () => {
    expect(render({tables:{}},'constructor')).toContain('此快照沒有資料表 constructor');
    const tables = Object.create(null); tables.__proto__=table('__proto__');
    expect(render({tables},'__proto__')).toContain('查看 __proto__ 的欄位');
  });
  it('preserves false, zero, explicit null and allowed values without filling omitted defaults', () => {
    const schema: SchemaState = {tables:{t:{...table('t'),columns:{
      flag:{name:'flag',type:'boolean',nullable:false,default:false},
      num:{name:'num',type:'integer',nullable:false,default:0},
      kind:{name:'kind',type:'enum',nullable:true,default:null,allowedValues:['a','b']},
      plain:{name:'plain',type:'string',nullable:false},
    }}}};
    const html=render(schema,'t');
    expect(html).toContain('<dt>default</dt><dd><code>false</code>');
    expect(html).toContain('<dt>default</dt><dd><code>0</code>');
    expect(html).toContain('<dt>default</dt><dd><code>null</code>');
    expect(html).toContain('allowedValues'); expect(html.match(/<dt>default<\/dt>/g)).toHaveLength(3);
  });
  it('retains index and composite foreign-key order and explicit referential actions', () => {
    const schema: SchemaState={tables:{t:{...table('t'),indexes:{u:{name:'u',type:'unique',columns:['tenant','user']}},foreignKeys:{fk:{name:'fk',columns:['tenant','user'],referencedTable:'users',referencedColumns:['tenant','id'],onDelete:'cascade'}}}}};
    const html=render(schema,'t');
    expect(html).toContain('unique'); expect(html).toContain('tenant → user'); expect(html).toContain('users（tenant → id）');
    expect(html).toContain('ON DELETE：cascade · ON UPDATE：未指定');
  });
  it('escapes long names and comments and leaves source schema unchanged', () => {
    const name='table_'+'x'.repeat(100); const schema: SchemaState={tables:{[name]:{...table(name),columns:{c:{name:'<script>',type:'string',nullable:false,comment:'<img src=x>'}}}}};
    const original=JSON.stringify(schema); const html=render(schema,name);
    expect(html).toContain(name); expect(html).toContain('&lt;script&gt;'); expect(html).not.toContain('<img src=x>');
    expect(JSON.stringify(schema)).toBe(original);
  });
  it('shows an existing empty table as known empty sections', () => {
    const html=render({tables:{empty:table('empty')}},'empty');
    expect(html).toContain('沒有欄位'); expect(html).toContain('沒有索引'); expect(html).toContain('沒有外鍵');
    expect(html).not.toContain('此快照沒有資料表');
  });
});

describe('searched column details', () => {
  it('opens the inspector and marks only the selected current column', () => {
    const schema: SchemaState = { tables: { users: { ...table('users'), columns: { id: { name: 'id', type: 'integer', nullable: false }, email: { name: 'email', type: 'string', nullable: false } } } } };
    const html = renderToStaticMarkup(createElement(TableDetails, { schema, selected: 'users', selectedColumn: 'email' }));
    expect(html).toContain('open=""');
    expect(html.match(/data-selected="true"/g)).toHaveLength(1);
    expect(html).toContain('搜尋選取欄位：email');
  });
  it('does not open or mark a column missing from this snapshot', () => {
    const html = renderToStaticMarkup(createElement(TableDetails, { schema: { tables: { users: table('users') } }, selected: 'users', selectedColumn: 'constructor' }));
    expect(html).not.toContain('open=""');
    expect(html).not.toContain('data-selected="true"');
  });
});
