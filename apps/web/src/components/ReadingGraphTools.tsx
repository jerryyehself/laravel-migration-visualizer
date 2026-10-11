import type { Dispatch,SetStateAction } from 'react';
import type { SchemaState } from '@lmv/migration-core';
import type { GraphLayout,GraphView } from '../comparison-layout';
import type { StructureQuery } from '../operation-sources';
import { objectAvailability } from '../migration-reading';
import { matchingColumns,matchingTables } from '../graph-focus';
import { objectInView } from '../reading-view';
import { clampZoom } from '../schema-graph';
export function ReadingGraphTools({schema,side,comparison,searchSide,onSearchSide,tableQuery,onTableQuery,columnQuery,onColumnQuery,selection,layout,view,onViewChange,onLocate,onReset,visible}:{schema:SchemaState|null;side:string;comparison:boolean;searchSide:'before'|'after';onSearchSide:(side:'before'|'after')=>void;tableQuery:string;onTableQuery:(text:string)=>void;columnQuery:string;onColumnQuery:(text:string)=>void;selection?:StructureQuery;layout:GraphLayout;view:GraphView;onViewChange:Dispatch<SetStateAction<GraphView>>;onLocate:(query:StructureQuery)=>void;onReset:()=>void;visible:boolean}){
 const tables=matchingTables(schema?Object.keys(schema.tables):[],tableQuery),columns=matchingColumns(schema,columnQuery);
 const availability=selection?objectAvailability(schema,selection):null;
 return <section className="reading-graph-tools" aria-label="工作區 ERD 搜尋與視野"><h3>ERD 搜尋與視野 · {side}</h3>
 {comparison&&<><label htmlFor="workspace-search-side">比較搜尋側別</label><select id="workspace-search-side" value={searchSide} onChange={e=>onSearchSide(e.target.value as 'before'|'after')}><option value="before">Before · 套用前</option><option value="after">After · 套用後</option></select></>}
 <div className="toolbar"><button type="button" className="secondary" aria-label="縮小 ERD" disabled={!visible||view.zoom<=.15} onClick={()=>onViewChange(v=>({...v,zoom:clampZoom(v.zoom/1.2)}))}>−</button><span role="status">縮放 {Math.round(view.zoom*100)}%</span><button type="button" className="secondary" aria-label="放大 ERD" disabled={!visible||view.zoom>=2.5} onClick={()=>onViewChange(v=>({...v,zoom:clampZoom(v.zoom*1.2)}))}>＋</button><button type="button" className="secondary" disabled={!visible} onClick={onReset}>重設 ERD 位置</button></div>
 <p>順序閱讀保留 pan／zoom 與同名手動位置；名稱定位不代表跨檔物件身分。</p>
 {selection&&<p role="status">目前目標：{selection.table}{selection.column===undefined?'':'.'+selection.column} · {availability==='snapshot-unknown'?'快照未知':availability==='object-absent'?'此側不存在':objectInView(schema,selection,layout,view)?'在視野內':'已離開視野，可明確定位'}</p>}
 <button type="button" className="secondary" disabled={!visible||availability!=='available'} onClick={()=>selection&&onLocate(selection)}>定位目前物件</button>
 {schema===null&&<p className="unavailable">{side} 快照未知，搜尋不可用；保留搜尋文字，不補另一側資料。</p>}
 <fieldset disabled={schema===null}><legend>搜尋 {side} · 各側自己的快照</legend>
 <label htmlFor="workspace-table-query">搜尋 ERD 資料表</label><input id="workspace-table-query" type="search" value={tableQuery} onChange={e=>onTableQuery(e.target.value)}/>
 <p role="status">{schema===null?'快照未知':`找到 ${tables.length} / ${Object.keys(schema.tables).length} 張表`}；只篩選結果，不隱藏圖形或外鍵。</p>
 <div className="table-focus-list">{tables.map(table=><span key={table}>{side} · <button type="button" className="secondary" onClick={()=>onLocate({table})}>聚焦資料表 {table}</button></span>)}</div>
 {schema!==null&&tables.length===0&&<p>沒有符合的資料表。</p>}<button type="button" className="secondary" disabled={!tableQuery} onClick={()=>onTableQuery('')}>清除資料表搜尋</button>
 <label htmlFor="workspace-column-query">搜尋目前快照欄位</label><input id="workspace-column-query" type="search" value={columnQuery} onChange={e=>onColumnQuery(e.target.value)}/>
 <p role="status">{schema===null?'快照未知':columnQuery.trim()===''?'輸入欄位名稱開始搜尋。':`找到 ${columns.length} 個欄位。`} · {side}</p>
 <div className="table-focus-list">{columns.map(q=><span key={JSON.stringify([q.table,q.column])}>{side} · <button type="button" className="secondary" onClick={()=>onLocate(q)}>查看欄位 {q.table}.{q.column}</button></span>)}</div>
 {schema!==null&&columnQuery.trim()!==''&&columns.length===0&&<p>沒有符合的欄位。</p>}<button type="button" className="secondary" disabled={!columnQuery} onClick={()=>onColumnQuery('')}>清除欄位搜尋</button>
 {schema!==null&&Object.keys(schema.tables).length===0&&<p>已知空白 schema，沒有資料表或欄位；不同於未知。</p>}
 </fieldset></section>;
}
