import type { SchemaState } from '@lmv/migration-core';
export interface Point { x: number; y: number }
export interface GraphNode extends Point {
  name: string; height: number;
  columns: { name: string; type: string; nullable: boolean; primary: boolean; foreign: boolean }[];
}
export interface GraphEdge { id: string; from: string; to: string; label: string }
export const NODE_WIDTH = 300;
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

// Presentation projection only. Never infer relationships from column names.
export function schemaGraph(schema: SchemaState) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let unresolved = 0;
  let rowY = 30;
  const tables = Object.entries(schema.tables).sort(([a], [b]) => compare(a, b));
  for (let i = 0; i < tables.length; i += 2) {
    const row = tables.slice(i, i + 2).map(([name, table], offset) => {
      const foreign = new Set(Object.values(table.foreignKeys).flatMap(key => key.columns));
      const columns = Object.values(table.columns).map(column => ({ name: column.name, type: column.type, nullable: column.nullable, primary: column.primary === true, foreign: foreign.has(column.name) }));
      return { name, columns, x: 30 + offset * 510, y: rowY, height: 56 + Math.max(1, columns.length) * 25 };
    });
    nodes.push(...row); rowY += Math.max(...row.map(node => node.height)) + 100;
  }
  const names = new Set(nodes.map(node => node.name));
  for (const [name, table] of tables) {
    for (const [keyName, key] of Object.entries(table.foreignKeys).sort(([a], [b]) => compare(a, b))) {
      if (!names.has(key.referencedTable)) { unresolved++; continue; }
      edges.push({ id: JSON.stringify([name, keyName]), from: name, to: key.referencedTable,
        label: `${keyName}: (${key.columns.join(', ')}) → (${key.referencedColumns.join(', ')})` });
    }
  }
  return { nodes, edges, unresolved, width: tables.length > 1 ? 1020 : 550, height: Math.max(180, rowY) };
}
export function clampZoom(value: number) { return Math.max(0.15, Math.min(2.5, value)); }
export function graphFit(width: number, height: number) { return clampZoom(Math.min(1, 1160 / width, 520 / height)); }
export function edgePath(from: Point, to: Point, self: boolean) {
  const x1 = from.x + NODE_WIDTH, y1 = from.y + 28, x2 = to.x, y2 = to.y + 28;
  if (self) return `M ${x1} ${y1} C ${x1 + 90} ${y1 - 70}, ${x1 + 90} ${y1 + 90}, ${x1} ${y1 + 40}`;
  const bend = Math.max(60, Math.abs(x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
}
