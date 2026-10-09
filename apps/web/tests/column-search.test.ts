import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SchemaGraph } from '../src/components/SchemaGraph';
import { describe, expect, it } from 'vitest';
import { matchingColumns } from '../src/graph-focus';
import type { SchemaState } from '@lmv/migration-core';
const table = (name: string, names: string[]) => ({ name, indexes: {}, foreignKeys: {}, columns: Object.fromEntries(names.map(name => [name, { name, type: 'string' as const, nullable: false }])) });
const schema: SchemaState = { tables: { Users: table('Users', ['id', 'Email', 'a[b]']), posts: table('posts', ['id', 'user_id']) } };
describe('current snapshot column search', () => {
  it('matches trimmed case-insensitive literal column names in original order', () => {
    expect(matchingColumns(schema, ' ID ')).toEqual([{ table: 'Users', column: 'id' }, { table: 'posts', column: 'id' }, { table: 'posts', column: 'user_id' }]);
    expect(matchingColumns(schema, '[b]')).toEqual([{ table: 'Users', column: 'a[b]' }]);
    expect(matchingColumns(schema, 'users')).toEqual([]);
  });
  it('shows no results for blank queries, unknown or known empty snapshots', () => {
    expect(matchingColumns(schema, '  ')).toEqual([]);
    expect(matchingColumns(null, 'id')).toEqual([]);
    expect(matchingColumns({ tables: {} }, 'id')).toEqual([]);
    expect(matchingColumns(schema, 'missing')).toEqual([]);
  });
  it('reads only the supplied snapshot without mutating it or retaining removed columns', () => {
    const original = JSON.stringify(schema);
    matchingColumns(schema, 'id');
    const after: SchemaState = { tables: { posts: table('posts', ['title']) } };
    expect(matchingColumns(after, 'id')).toEqual([]);
    expect(JSON.stringify(schema)).toBe(original);
  });
  it('keeps hostile and duplicate names as separate literal identities', () => {
    const tables = Object.create(null); tables.__proto__ = table('__proto__', ['constructor']); tables.other = table('other', ['constructor']);
    expect(matchingColumns({ tables }, 'constructor')).toEqual([{ table: '__proto__', column: 'constructor' }, { table: 'other', column: 'constructor' }]);
  });
});

it('renders the initial known-empty graph with an unselected inspector and a blank-query hint', () => {
  const html = renderToStaticMarkup(createElement(SchemaGraph, { schema: { tables: {} } }));
  expect(html).toContain('搜尋目前快照欄位');
  expect(html).toContain('輸入欄位名稱開始搜尋');
  expect(html).toContain('已知的空白 schema');
  expect(html).toContain('請先聚焦資料表');
  expect(html).not.toContain('查看欄位');
});
