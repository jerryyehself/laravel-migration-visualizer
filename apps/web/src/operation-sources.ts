import type { AtomicOperation, ProjectAnalysis, MigrationSnapshot, SourceLocation } from '@lmv/migration-core';
export interface StructureQuery { table: string; column?: string }
export interface OperationSource {
  migrationIndex: number;
  operationIndex: number;
  filename: string;
  status: MigrationSnapshot['status'];
  operation: AtomicOperation;
  source: SourceLocation | null;
}
export type SourceNavigation = (hit: OperationSource, origin: HTMLElement) => void;
export function operationObjects(op: AtomicOperation): StructureQuery[] {
  const table = { table:op.table };
  const columns = (names: readonly string[]) => names.map(column => ({ table:op.table,column }));
  switch (op.kind) {
    case 'addColumn': case 'changeColumn': return [table,...columns([op.column.name])];
    case 'dropColumn': return [table,...columns([op.column])];
    case 'renameColumn': return [table,...columns([op.from,op.to])];
    case 'addIndex': return [table,...columns(op.index.columns)];
    case 'addForeignKey': return [table,...columns(op.foreignKey.columns),{table:op.foreignKey.referencedTable},
      ...op.foreignKey.referencedColumns.map(column => ({table:op.foreignKey.referencedTable,column}))];
    case 'renameTable': return [table,{table:op.to}];
    case 'createTable': case 'dropTable': case 'renameIndex': case 'dropIndex': case 'dropForeignKey': return [table];
    default: { const unreachable: never = op; return unreachable; }
  }
}
function involves(op: AtomicOperation, query: StructureQuery): boolean {
  return operationObjects(op).some(object => object.table === query.table && (query.column === undefined || object.column === query.column));
}
// Literal name evidence only; never replays or invents persistent object identity.
export function operationSources(result: ProjectAnalysis, query: StructureQuery): OperationSource[] {
  return result.migrations.flatMap((step, migrationIndex) => step.analysis.operations.flatMap((operation, operationIndex) =>
    involves(operation,query) ? [{ migrationIndex, operationIndex, filename:step.filename, status:step.status, operation, source:operation.source ?? null }] : []));
}
