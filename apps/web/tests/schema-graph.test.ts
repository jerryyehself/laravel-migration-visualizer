import { describe, expect, it } from 'vitest';
import { analyzeProject, type SchemaState } from '../../../packages/migration-core/src/index.js';
import { schemaGraph, edgePath, graphFit, clampZoom } from '../src/schema-graph';
const table = (name: string) => ({ name, columns: { id: { name: 'id', type: 'bigInteger', nullable: false, primary: true } }, indexes: {}, foreignKeys: {} });

describe('schema ERD presentation projection', () => {
  it('represents a known empty schema without synthetic tables', () => {
    expect(schemaGraph({ tables: {} })).toMatchObject({ nodes: [], edges: [], unresolved: 0 });
  });
  it('uses deterministic table order and non-overlapping grid rows', () => {
    const schema: SchemaState = { tables: { z: table('z'), b: table('b'), a: table('a') } };
    const graph = schemaGraph(schema);
    expect(graph.nodes.map(n => n.name)).toEqual(['a', 'b', 'z']);
    expect(graph.nodes[1].x).toBeGreaterThan(graph.nodes[0].x + 300);
    expect(graph.nodes[2].y).toBeGreaterThan(graph.nodes[0].y + graph.nodes[0].height);
  });
  it('never infers a foreign key from a column name', () => {
    const posts = table('posts');
    const schema: SchemaState = { tables: { users: table('users'), posts: { ...posts, columns: { ...posts.columns, user_id: { name: 'user_id', type: 'bigInteger', nullable: false } } } } };
    expect(schemaGraph(schema).edges).toEqual([]);
    expect(schemaGraph(schema).nodes[0].columns[1].foreign).toBe(false);
  });
  it('retains explicit composite column order and one edge per constraint', () => {
    const schema: SchemaState = { tables: { users: table('users'), posts: { ...table('posts'), foreignKeys: { composite: { name: 'composite', columns: ['tenant', 'user'], referencedTable: 'users', referencedColumns: ['tenant', 'id'] } } } } };
    expect(schemaGraph(schema).edges).toEqual([{ id: '["posts","composite"]', from: 'posts', to: 'users', label: 'composite: (tenant, user) → (tenant, id)' }]);
  });
  it('supports self references and distinguishes unresolved targets', () => {
    const schema: SchemaState = { tables: { users: { ...table('users'), foreignKeys: {
      self: { name: 'self', columns: ['id'], referencedTable: 'users', referencedColumns: ['id'] },
      missing: { name: 'missing', columns: ['id'], referencedTable: 'missing', referencedColumns: ['id'] },
    } } } };
    const graph = schemaGraph(schema);
    expect(graph.edges).toHaveLength(1); expect(graph.unresolved).toBe(1);
    expect(edgePath(graph.nodes[0], graph.nodes[0], true)).not.toBe(edgePath(graph.nodes[0], graph.nodes[0], false));
  });
  it('preserves special identifiers and does not alias schema data', () => {
    const tables = Object.create(null); tables.__proto__ = table('__proto__'); tables.constructor = table('constructor');
    const schema: SchemaState = { tables }; const before = JSON.stringify(schema);
    const graph = schemaGraph(schema); graph.nodes[0].columns[0].name = 'changed';
    expect(graph.nodes.map(node => node.name)).toEqual(['__proto__', 'constructor']);
    expect(JSON.stringify(schema)).toBe(before);
  });
  it('bounds zoom and fits larger graphs without enlarging small ones', () => {
    expect(clampZoom(0)).toBe(0.15); expect(clampZoom(10)).toBe(2.5);
    expect(graphFit(100, 100)).toBe(1); expect(graphFit(2000, 1000)).toBe(0.52);
  });
  it('recalculates an edge path when its node position changes', () => {
    const before = edgePath({ x: 10, y: 10 }, { x: 500, y: 10 }, false);
    expect(edgePath({ x: 30, y: 10 }, { x: 500, y: 10 }, false)).not.toBe(before);
  });
  it('projects a real replayed schema with authoritative primary and foreign metadata', () => {
    const wrap = (body: string) => `<?php return new class extends Migration { function up() { ${body} } };`;
    const result = analyzeProject([
      { filename: '2026_01_01_000000_users.php', source: wrap("Schema::create('users', function($t){$t->id();});") },
      { filename: '2026_01_02_000000_posts.php', source: wrap("Schema::create('posts', function($t){$t->id();$t->unsignedBigInteger('user_id');$t->foreign('user_id')->references('id')->on('users');});") },
    ]);
    expect(result.complete).toBe(true);
    const graph = schemaGraph(result.finalSchema!);
    expect(graph.edges).toHaveLength(1);
    expect(graph.nodes.find(node => node.name === 'posts')!.columns).toEqual([
      { name: 'id', type: 'bigInteger', nullable: false, primary: true, foreign: false },
      { name: 'user_id', type: 'bigInteger', nullable: false, primary: false, foreign: true },
    ]);
  });
});
