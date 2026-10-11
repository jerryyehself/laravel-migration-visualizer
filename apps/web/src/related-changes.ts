import type { ProjectAnalysis, SchemaChange, ForeignKey } from '@lmv/migration-core';
import { objectAvailability } from './migration-reading';
import { operationObjects, type StructureQuery, type OperationSource } from './operation-sources';
export type Evidence='structure'|'index'|'relation'|'table-context'|'syntax';
export type RelatedChange={change:SchemaChange;evidence:Evidence};
function foreignMatches(fk:ForeignKey,q:StructureQuery):boolean{return fk.referencedTable===q.table&&(q.column===undefined||fk.referencedColumns.includes(q.column));}
function changeEvidence(c:SchemaChange,q:StructureQuery):Evidence|null {
 const sides=[...('before' in c?[c.before]:[]),...('after' in c?[c.after]:[])];
 if(c.table===q.table){
  if(q.column===undefined)return 'structure';
  if('column' in c)return c.column===q.column?'structure':null;
  if('index' in c)return sides.some(s=>'columns' in s&&(s.columns as string[]).includes(q.column!))?'index':null;
  if('foreignKey' in c)return sides.some(s=>'columns' in s&&(s.columns as string[]).includes(q.column!))?'relation':null;
  if(sides.some(s=>'columns' in s&&Object.hasOwn(s.columns!,q.column!)))return 'structure';
 }
 if('foreignKey' in c&&sides.some(s=>foreignMatches(s as ForeignKey,q)))return 'relation';
 // Whole-table payloads can contain explicit foreign-key reference context.
 if(!('column' in c)&&!('index' in c)&&!('foreignKey' in c)&&sides.some(s=>'foreignKeys' in s&&Object.values(s.foreignKeys!).some(fk=>foreignMatches(fk as ForeignKey,q))))return 'relation';
 return null;
}
export function relatedChanges(result:ProjectAnalysis,query:StructureQuery){
 const steps=result.migrations.flatMap((step,index)=>{
  const changes=step.diff===null?null:step.diff.changes.flatMap(change=>{const evidence=changeEvidence(change,query);return evidence?[{change,evidence}]:[];});
  const before=objectAvailability(step.schemaBefore,query),after=objectAvailability(step.schemaAfter,query);
  const syntaxMatch=step.analysis.operations.some(op=>operationObjects(op).some(q=>q.table===query.table&&(query.column===undefined||q.column===query.column)));
  const operations:(OperationSource&{evidence:Evidence})[]=step.analysis.operations.flatMap((operation,operationIndex)=>{
   const exact=operationObjects(operation).some(q=>q.table===query.table&&(query.column===undefined||q.column===query.column));
   const tableContext=query.column!==undefined&&['createTable','dropTable','renameTable','dropIndex','renameIndex','dropForeignKey'].includes(operation.kind)&&operationObjects(operation).some(q=>q.table===query.table)&&((changes?.length??0)>0||step.diff===null||(['createTable','dropTable','renameTable'].includes(operation.kind)&&(before==='available'||after==='available'||syntaxMatch)));
   if(!exact&&!tableContext)return [];
   const evidence:Evidence=tableContext?'table-context':operation.kind==='addForeignKey'?'relation':operation.kind==='addIndex'?'index':'syntax';
   return [{migrationIndex:index,operationIndex,filename:step.filename,status:step.status,operation,source:operation.source??null,evidence}];
  });
  if((changes?.length??0)===0&&operations.length===0)return [];
  return [{index,filename:step.filename,status:step.status,before,after,changes,operations,comparable:step.schemaBefore!==null&&step.schemaAfter!==null&&step.diff!==null,beforeKnown:step.schemaBefore!==null,diagnostics:step.diagnostics}];
 });
 const state=result.diagnostics.some(d=>d.phase==='ordering')?'ordering':result.migrations.length>0?'analyzed':'empty';
 return {query,steps,state,complete:result.complete,final:objectAvailability(result.finalSchema,query)};
}
