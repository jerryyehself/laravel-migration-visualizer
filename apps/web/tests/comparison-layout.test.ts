import { describe, expect, it } from 'vitest';
import type { SchemaState } from '../../../packages/migration-core/src/index.js';
import { comparisonLayout, initialGraphView } from '../src/comparison-layout';
const table = (name: string, count = 1) => ({ name, columns: Object.fromEntries(Array.from({length:count},(_,i) => [`c${i}`,{name:`c${i}`,type:'string',nullable:false}])), indexes:{}, foreignKeys:{} });
describe('shared comparison layout', () => {
  it('reserves union slots so additions and removals do not shift common tables', () => {
    const before: SchemaState = {tables:{users:table('users'), old:table('old')}};
    const after: SchemaState = {tables:{users:table('users'), accounts:table('accounts')}};
    const layout = comparisonLayout(before, after);
    expect([...layout.positions.keys()]).toEqual(['accounts','old','users']);
    expect(layout.positions.get('users')).toEqual({x:30,y:211});
    expect(layout.positions.size).toBe(3);
    expect(before.tables.accounts).toBeUndefined(); expect(after.tables.old).toBeUndefined();
  });
  it('uses the taller version of a table to avoid row overlap on either side', () => {
    const before: SchemaState = {tables:{a:table('a',1),b:table('b'),c:table('c')}};
    const after: SchemaState = {tables:{a:table('a',20),b:table('b'),c:table('c')}};
    const layout = comparisonLayout(before,after);
    expect(layout.positions.get('c')!.y).toBe(30 + 56 + 20 * 25 + 100);
    expect(initialGraphView(layout).zoom).toBeLessThan(1);
  });
  it('handles empty sides and special table names without prototype collisions', () => {
    const tables = Object.create(null); tables.__proto__ = table('__proto__'); tables.constructor = table('constructor');
    expect([...comparisonLayout({tables:{}},{tables}).positions.keys()]).toEqual(['__proto__','constructor']);
    expect(comparisonLayout({tables:{}},{tables:{}}).positions.size).toBe(0);
  });
  it('is deterministic regardless of input map order and leaves snapshots unchanged', () => {
    const before: SchemaState = {tables:{b:table('b'),a:table('a')}};
    const original = JSON.stringify(before);
    expect([...comparisonLayout(before,{tables:{}}).positions]).toEqual([...comparisonLayout({tables:{}},before).positions]);
    const layout = comparisonLayout(before,before); layout.positions.get('a')!.x = 999;
    expect(JSON.stringify(before)).toBe(original);
  });
  it('reset creates fresh empty overrides and fits the shared bounds', () => {
    const layout = comparisonLayout({tables:{a:table('a')}},{tables:{}});
    const first = initialGraphView(layout); first.positions.set('a',{x:999,y:999}); first.pan.x=999;
    const reset = initialGraphView(layout);
    expect(reset.pan).toEqual({x:20,y:20}); expect(reset.positions.size).toBe(0); expect(reset.zoom).toBe(1);
    expect(layout.positions.get('a')).toEqual({x:30,y:30});
  });
});
