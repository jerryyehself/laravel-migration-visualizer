import type { SourceNavigation, StructureQuery } from '../operation-sources';
import { useId, useMemo, useRef, useState } from 'react';
import type { PointerEvent, Dispatch, SetStateAction } from 'react';
import type { SchemaState, SchemaDiff, ProjectAnalysis } from '@lmv/migration-core';
import { TableDetails } from './TableDetails';
import { matchingTables, matchingColumns, focusGraphTable } from '../graph-focus';
import { initialGraphView, type GraphLayout, type GraphView } from '../comparison-layout';
import { graphDiffMarks, memberKey, markLabels } from '../graph-diff';
import { schemaGraph, NODE_WIDTH, clampZoom, edgePath, type Point } from '../schema-graph';

export function SchemaGraph({ schema, title = '最終 Schema ERD', diff, side = 'after', layout, view, onViewChange, analysis, onSource, onSelectionChange, initialSelection }: { initialSelection?:StructureQuery; schema: SchemaState; title?: string; diff?: SchemaDiff; side?: 'before' | 'after'; layout?: GraphLayout; view?: GraphView; onViewChange?: Dispatch<SetStateAction<GraphView>>; analysis?: ProjectAnalysis; onSource?: SourceNavigation; onSelectionChange?: () => void }) {
  const graph = useMemo(() => schemaGraph(schema), [schema]);
  const marks = useMemo(() => graphDiffMarks(diff ?? { changes: [] }, side), [diff, side]);
  const marker = useId().replace(/:/g, '');
  const svg = useRef<SVGSVGElement>(null);
  const nodeRefs = useRef(new Map<string, SVGGElement>());
  const [query, setQuery] = useState('');
  const searchId = useId();
  const columnSearchId = useId();
  const [columnQuery, setColumnQuery] = useState('');
  const columnRequest = useRef(initialSelection?.column === undefined ? 0 : 1);
  const [selectedColumn, setSelectedColumn] = useState<{ table: string; column: string; request: number } | undefined>(() => initialSelection?.column !== undefined && Object.hasOwn(schema.tables,initialSelection.table) && Object.hasOwn(schema.tables[initialSelection.table].columns,initialSelection.column) ? {...initialSelection,column:initialSelection.column,request:1} : undefined);
  const columnMatches = useMemo(() => matchingColumns(schema, columnQuery), [schema, columnQuery]);
  const matches = matchingTables(graph.nodes.map(node => node.name), query);
  const bounds = layout ?? graph;
  const [localView, setLocalView] = useState(() => { const initial = initialGraphView(bounds); const node = graph.nodes.find(node=>node.name === initialSelection?.table); return node ? focusGraphTable(initial,node,layout?.positions.get(node.name) ?? node) : initial; });
  const { zoom, pan, positions, focused } = view ?? localView;
  const setView = onViewChange ?? setLocalView;
  const setZoom = (update: (value: number) => number) => setView(current => ({ ...current, zoom: update(current.zoom) }));
  const setPan = (value: Point) => setView(current => ({ ...current, pan: value }));
  const setPositions = (update: (value: Map<string, Point>) => Map<string, Point>) => setView(current => ({ ...current, positions: update(current.positions) }));
  const drag = useRef<{ pointer: number; name: string | null; start: Point; origin: Point } | null>(null);
  const position = (node: { name: string } & Point) => positions.get(node.name) ?? layout?.positions.get(node.name) ?? node;
  function focusTable(name: string) {
    const node = graph.nodes.find(node => node.name === name);
    if (!node) return;
    onSelectionChange?.();
    setSelectedColumn(undefined);
    setView(current => focusGraphTable(current, node, current.positions.get(name) ?? layout?.positions.get(name) ?? node));
    svg.current?.scrollIntoView({ block: 'center' });
    nodeRefs.current.get(name)?.focus({ preventScroll: true });
  }
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
  function reset() { onSelectionChange?.(); drag.current = null; setSelectedColumn(undefined); setView(initialGraphView(bounds)); }
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
    <fieldset className="graph-search">
      <legend>尋找資料表</legend>
      <label htmlFor={searchId}>搜尋 ERD 資料表</label>
      <input id={searchId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="例如 users" />
      <p className="muted" role="status">找到 {matches.length} / {graph.nodes.length} 張表；只篩選聚焦清單，圖形與外鍵仍完整顯示。</p>
      <div className="table-focus-list">{matches.map(name => <button type="button" className="secondary" key={name} aria-pressed={focused === name} onClick={() => focusTable(name)}>聚焦資料表 {name}</button>)}</div>
      {matches.length === 0 && <p className="muted">沒有符合的資料表。</p>}
      <button type="button" className="secondary" disabled={query === ''} onClick={() => setQuery('')}>清除資料表搜尋</button>
    </fieldset>
    <fieldset className="graph-search">
      <legend>尋找欄位</legend>
      <label htmlFor={columnSearchId}>搜尋目前快照欄位</label>
      <input id={columnSearchId} type="search" value={columnQuery} onChange={event => setColumnQuery(event.target.value)} placeholder="例如 user_id" />
      <p className="muted" role="status">{columnQuery.trim() === '' ? '輸入欄位名稱開始搜尋。' : `找到 ${columnMatches.length} 個欄位。`}只搜尋此圖快照；圖形與外鍵仍完整顯示。</p>
      <div className="table-focus-list">{columnMatches.map(match => <button type="button" className="secondary" key={JSON.stringify([match.table, match.column])}
        aria-pressed={focused === match.table && selectedColumn?.table === match.table && selectedColumn.column === match.column}
        onClick={() => { focusTable(match.table); setSelectedColumn({ ...match, request: ++columnRequest.current }); }}>查看欄位 {match.table}.{match.column}</button>)}</div>
      {columnQuery.trim() !== '' && columnMatches.length === 0 && <p className="muted">沒有符合的欄位。</p>}
      <button type="button" className="secondary" disabled={columnQuery === ''} onClick={() => setColumnQuery('')}>清除欄位搜尋</button>
    </fieldset>
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
            return <g key={node.name} ref={element => { if (element) nodeRefs.current.set(node.name, element); else nodeRefs.current.delete(node.name); }} data-focused={focused === node.name} transform={`translate(${at.x} ${at.y})`} className={`erd-node ${mark ?? ''}`} role="button" tabIndex={0} aria-label={`移動資料表 ${node.name}`}
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
    <TableDetails openOnSelection={initialSelection?.table === focused} schema={schema} selected={focused} selectedColumn={selectedColumn && selectedColumn.table === focused ? selectedColumn.column : undefined} selectionRequest={selectedColumn?.request} analysis={analysis} onSource={onSource} />
  </section>;
}
