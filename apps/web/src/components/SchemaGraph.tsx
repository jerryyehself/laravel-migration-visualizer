import { useId, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { SchemaState, SchemaDiff } from '@lmv/migration-core';
import { graphDiffMarks, memberKey, markLabels } from '../graph-diff';
import { schemaGraph, NODE_WIDTH, clampZoom, graphFit, edgePath, type Point } from '../schema-graph';

export function SchemaGraph({ schema, title = '最終 Schema ERD', diff, side = 'after' }: { schema: SchemaState; title?: string; diff?: SchemaDiff; side?: 'before' | 'after' }) {
  const graph = useMemo(() => schemaGraph(schema), [schema]);
  const marks = useMemo(() => graphDiffMarks(diff ?? { changes: [] }, side), [diff, side]);
  const marker = useId().replace(/:/g, '');
  const svg = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(() => graphFit(graph.width, graph.height));
  const [pan, setPan] = useState<Point>({ x: 20, y: 20 });
  const [positions, setPositions] = useState(() => new Map<string, Point>());
  const drag = useRef<{ pointer: number; name: string | null; start: Point; origin: Point } | null>(null);
  const position = (node: { name: string } & Point) => positions.get(node.name) ?? node;
  function point(event: PointerEvent) {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return { x: event.clientX, y: event.clientY };
    const result = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: result.x, y: result.y };
  }
  function start(event: PointerEvent<SVGElement>, name: string | null, origin: Point) {
    if (event.button !== 0 || drag.current) return;
    event.stopPropagation(); event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointer: event.pointerId, name, start: point(event), origin };
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    const next = point(event); const scale = active.name === null ? 1 : zoom;
    const value = { x: active.origin.x + (next.x - active.start.x) / scale, y: active.origin.y + (next.y - active.start.y) / scale };
    if (active.name === null) setPan(value);
    else setPositions(current => new Map(current).set(active.name!, value));
  }
  function reset() { drag.current = null; setPositions(new Map()); setPan({ x: 20, y: 20 }); setZoom(graphFit(graph.width, graph.height)); }
  return <section className="schema-graph" aria-label={title}>
    <h2>{title}</h2>
    <p>{graph.nodes.length} 張資料表 · {graph.edges.length} 個外鍵關係。箭頭從本表指向引用表；不推測關聯基數。</p>
    <p className="muted">拖移資料表可調整位置，拖移空白可平移。聚焦資料表後可用方向鍵移動；PK 為主鍵，FK 為外鍵欄位，? 表示 nullable。</p>
    <div className="toolbar">
      <button type="button" className="secondary" aria-label="縮小 ERD" disabled={zoom <= 0.15} onClick={() => setZoom(current => clampZoom(current / 1.2))}>−</button>
      <span role="status">縮放 {Math.round(zoom * 100)}%</span>
      <button type="button" className="secondary" aria-label="放大 ERD" disabled={zoom >= 2.5} onClick={() => setZoom(current => clampZoom(current * 1.2))}>＋</button>
      <button type="button" className="secondary" onClick={reset}>重設 ERD 位置</button>
    </div>
    {graph.unresolved > 0 && <p className="unavailable">{graph.unresolved} 個外鍵缺少引用表，未繪製連線。</p>}
    {graph.nodes.length === 0 ? <p>已知的空白 schema：沒有資料表可繪製。</p> : <>
      <svg ref={svg} viewBox="0 0 1200 560" className="erd-canvas" role="group" aria-label="ERD 畫布"
        onPointerDown={event => start(event, null, pan)} onPointerMove={move}
        onLostPointerCapture={() => { drag.current = null; }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        <defs><marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="context-stroke" /></marker></defs>
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {graph.edges.map(edge => {
            const from = position(graph.nodes.find(node => node.name === edge.from)!);
            const to = position(graph.nodes.find(node => node.name === edge.to)!);
            const mark = marks.edges.get(edge.id) ?? (marks.tables.get(edge.from) === 'added' || marks.tables.get(edge.from) === 'removed' ? marks.tables.get(edge.from) : undefined);
            return <path key={edge.id} d={edgePath(from, to, edge.from === edge.to)} className={`erd-edge ${mark ?? ''}`} markerEnd={`url(#${marker})`}><title>{mark ? markLabels[mark] + ' · ' : ''}{edge.from} → {edge.to} · {edge.label}</title></path>;
          })}
          {graph.nodes.map(node => {
            const at = position(node);
            const mark = marks.tables.get(node.name);
            return <g key={node.name} transform={`translate(${at.x} ${at.y})`} className={`erd-node ${mark ?? ''}`} role="button" tabIndex={0} aria-label={`移動資料表 ${node.name}`}
              onPointerDown={event => start(event, node.name, at)} onKeyDown={event => {
                const directions: Record<string, Point> = { ArrowLeft: { x: -20, y: 0 }, ArrowRight: { x: 20, y: 0 }, ArrowUp: { x: 0, y: -20 }, ArrowDown: { x: 0, y: 20 } };
                const delta = directions[event.key]; if (!delta) return;
                event.preventDefault(); setPositions(current => new Map(current).set(node.name, { x: at.x + delta.x, y: at.y + delta.y }));
              }}>
              <rect width={NODE_WIDTH} height={node.height} rx="8" fill="white" stroke="#176d62" />
              <rect width={NODE_WIDTH} height="40" rx="8" fill="#e4f3ef" />
              <text x="12" y="26" fontWeight="700">{node.name.length > (mark ? 21 : 32) ? node.name.slice(0, mark ? 18 : 29) + '…' : node.name}<title>{node.name}{mark ? ` · ${mark === 'changed' ? '含變更' : markLabels[mark]}` : ''}</title></text>
              {mark && <text x="210" y="26" className="change-badge">{mark === 'changed' ? '～ 含變更' : mark === 'added' ? '＋ 新增' : '− 移除'}</text>}
              {node.columns.map((column, index) => {
                const columnMark = marks.columns.get(memberKey(node.name, column.name)) ?? (mark === 'added' || mark === 'removed' ? mark : undefined);
                return <text className={columnMark ?? ''} key={column.name} x="12" y={62 + index * 25}>
                {`${columnMark === 'added' ? '＋ ' : columnMark === 'removed' ? '− ' : columnMark === 'changed' ? '～ ' : ''}${column.primary ? 'PK ' : ''}${column.foreign ? 'FK ' : ''}${column.name}${column.nullable ? '?' : ''}: ${column.type}`.slice(0, 38)}
                <title>{columnMark ? markLabels[columnMark] + ' · ' : ''}{column.name}: {column.type}; nullable={String(column.nullable)}; PK={String(column.primary)}; FK={String(column.foreign)}</title>
              </text>; })}
              {node.columns.length === 0 && <text x="12" y="62">沒有欄位</text>}
            </g>;
          })}
        </g>
      </svg>
      <details><summary>外鍵連線明細</summary><ul>{graph.edges.map(edge => <li key={edge.id}>{marks.edges.has(edge.id) ? markLabels[marks.edges.get(edge.id)!] + ' · ' : ''}{edge.from} → {edge.to} · {edge.label}</li>)}</ul></details>
    </>}
  </section>;
}
