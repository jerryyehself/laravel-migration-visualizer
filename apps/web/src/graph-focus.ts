import type { GraphView } from './comparison-layout';
import { clampZoom, NODE_WIDTH, type Point } from './schema-graph';
export function matchingTables(names: readonly string[], query: string) {
  const text = query.trim().toLowerCase();
  return names.filter(name => name.toLowerCase().includes(text));
}
export function focusGraphTable(view: GraphView, node: { name: string; height: number }, position: Point): GraphView {
  const zoom = clampZoom(Math.min(1, 480 / node.height));
  return { ...view, focused: node.name, zoom,
    pan: { x: 600 - (position.x + NODE_WIDTH / 2) * zoom, y: 280 - (position.y + node.height / 2) * zoom } };
}
