import type { ProjectAnalysis,SchemaState } from '@lmv/migration-core';
import { geometryLayout,initialGraphView,type GraphLayout,type GraphView } from './comparison-layout';
import { schemaGraph,graphFit,NODE_WIDTH } from './schema-graph';
import { objectAvailability } from './migration-reading';
import type { StructureQuery } from './operation-sources';
export function analysisLayout(result:ProjectAnalysis):GraphLayout {
 return geometryLayout([result.initialSchema,result.finalSchema,...result.migrations.flatMap(s=>[s.schemaBefore,s.schemaAfter])]);
}
export function resetVisibleView(layout:GraphLayout,schemas:readonly (SchemaState|null)[],current?:GraphView):GraphView {
 const nodes=schemas.flatMap(s=>s===null?[]:schemaGraph(s).nodes);
 const positions=new Map(current?.positions);
 for(const node of nodes)positions.delete(node.name);
 if(nodes.length===0)return {...initialGraphView({width:550,height:180}),positions,...(current?.focused?{focused:current.focused}:{})};
 const points=nodes.map(node=>({node,at:layout.positions.get(node.name)??node}));
 const x=Math.min(...points.map(p=>p.at.x)),y=Math.min(...points.map(p=>p.at.y));
 const width=Math.max(...points.map(p=>p.at.x+NODE_WIDTH))-x+40,height=Math.max(...points.map(p=>p.at.y+p.node.height))-y+40;
 const zoom=graphFit(width,height);
 return {zoom,pan:{x:20-x*zoom,y:20-y*zoom},positions,...(current?.focused?{focused:current.focused}:{})};
}
export function objectInView(schema:SchemaState|null,query:StructureQuery,layout:GraphLayout,view:GraphView):boolean {
 if(objectAvailability(schema,query)!=='available')return false;
 const node=schemaGraph(schema!).nodes.find(n=>n.name===query.table)!;
 const at=view.positions.get(node.name)??layout.positions.get(node.name)??node;
 const x=at.x*view.zoom+view.pan.x,y=at.y*view.zoom+view.pan.y;
 return x>=0&&y>=0&&x+NODE_WIDTH*view.zoom<=1200&&y+node.height*view.zoom<=560;
}
