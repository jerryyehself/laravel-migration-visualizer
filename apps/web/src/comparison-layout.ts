import type { SchemaState } from '@lmv/migration-core';
import { schemaGraph, graphFit, type Point } from './schema-graph';
export interface GraphLayout { positions: Map<string, Point>; width: number; height: number }
export interface GraphView { zoom: number; pan: Point; positions: Map<string, Point> }
export function initialGraphView(layout: { width: number; height: number }): GraphView {
  return { zoom: graphFit(layout.width, layout.height), pan: { x: 20, y: 20 }, positions: new Map() };
}
// Union only names and visual heights, never columns, foreign keys or schema data.
export function comparisonLayout(before: SchemaState, after: SchemaState): GraphLayout {
  const heights = new Map<string, number>();
  for (const schema of [before, after]) for (const node of schemaGraph(schema).nodes)
    heights.set(node.name, Math.max(heights.get(node.name) ?? 0, node.height));
  const names = [...heights.keys()].sort((a,b) => a < b ? -1 : a > b ? 1 : 0);
  const positions = new Map<string, Point>();
  let y = 30;
  for (let i = 0; i < names.length; i += 2) {
    const row = names.slice(i, i + 2);
    row.forEach((name, column) => positions.set(name, { x: 30 + column * 510, y }));
    y += Math.max(...row.map(name => heights.get(name)!)) + 100;
  }
  return { positions, width: names.length > 1 ? 1020 : 550, height: Math.max(180, y) };
}
