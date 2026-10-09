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
