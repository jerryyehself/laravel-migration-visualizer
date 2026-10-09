import type { AtomicOperation, MigrationSnapshot, SchemaState } from '@lmv/migration-core';
import { operationObjects, type OperationSource, type StructureQuery } from './operation-sources';
export type Availability = 'available' | 'snapshot-unknown' | 'object-absent';
export function objectAvailability(schema: SchemaState | null, query: StructureQuery): Availability {
  if (schema === null) return 'snapshot-unknown';
  if (!Object.hasOwn(schema.tables,query.table)) return 'object-absent';
  return query.column === undefined || Object.hasOwn(schema.tables[query.table].columns,query.column) ? 'available' : 'object-absent';
}
export function operationLabel(op: AtomicOperation): string {
  switch (op.kind) {
    case 'addColumn': case 'changeColumn': return `${op.kind} · ${op.table}.${op.column.name} (${op.column.type})`;
    case 'dropColumn': return `${op.kind} · ${op.table}.${op.column}`;
    case 'renameColumn': return `${op.kind} · ${op.table}.${op.from} → ${op.to}`;
    case 'renameTable': return `${op.kind} · ${op.table} → ${op.to}`;
    case 'addIndex': return `${op.kind} · ${op.table} / ${op.index.name}`;
    case 'renameIndex': return `${op.kind} · ${op.table} / ${op.from} → ${op.to}`;
    case 'dropIndex': return `${op.kind} · ${op.table} / ${op.name ?? op.indexType}`;
    case 'addForeignKey': return `${op.kind} · ${op.table} / ${op.foreignKey.name} → ${op.foreignKey.referencedTable}`;
    case 'dropForeignKey': return `${op.kind} · ${op.table} / ${op.name}`;
    case 'createTable': case 'dropTable': return `${op.kind} · ${op.table}`;
    default: { const unreachable: never = op; return unreachable; }
  }
}
export function migrationReading(step: MigrationSnapshot, migrationIndex: number) {
  const objects = new Map<string,StructureQuery & { evidence:'syntax'|'structural' }>();
  const key = (query:StructureQuery) => JSON.stringify([query.table,query.column ?? null]);
  for (const op of step.analysis.operations) for (const query of operationObjects(op)) objects.set(key(query),{...query,evidence:'syntax'});
  for (const change of step.diff?.changes ?? []) {
    const query = { table:change.table,...('column' in change ? {column:change.column} : {}) };
    objects.set(key(query),{...query,evidence:'structural'});
  }
  const operations:OperationSource[] = step.analysis.operations.map((operation,operationIndex) => ({ migrationIndex,operationIndex,filename:step.filename,status:step.status,operation,source:operation.source ?? null }));
  return { status:step.status, beforeKnown:step.schemaBefore !== null, afterKnown:step.schemaAfter !== null,
    operations, changes:step.diff?.changes ?? null, diagnostics:step.diagnostics,
    objects:[...objects.values()].map(object => ({...object,before:objectAvailability(step.schemaBefore,object),after:objectAvailability(step.schemaAfter,object)})) };
}
