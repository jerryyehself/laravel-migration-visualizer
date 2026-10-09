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
function involves(op: AtomicOperation, query: StructureQuery): boolean {
  if (query.column === undefined) {
    return op.table === query.table || (op.kind === 'renameTable' && op.to === query.table)
      || (op.kind === 'addForeignKey' && op.foreignKey.referencedTable === query.table);
  }
  if (op.kind === 'addForeignKey' && op.foreignKey.referencedTable === query.table
    && op.foreignKey.referencedColumns.includes(query.column)) return true;
  if (op.table !== query.table) return false;
  switch (op.kind) {
    case 'addColumn': case 'changeColumn': return op.column.name === query.column;
    case 'dropColumn': return op.column === query.column;
    case 'renameColumn': return op.from === query.column || op.to === query.column;
    case 'addIndex': return op.index.columns.includes(query.column);
    case 'addForeignKey': return op.foreignKey.columns.includes(query.column);
    case 'createTable': case 'dropTable': case 'renameTable':
    case 'renameIndex': case 'dropIndex': case 'dropForeignKey': return false;
    default: { const unreachable: never = op; return unreachable; }
  }
}
// Literal name evidence only; never replays or invents persistent object identity.
export function operationSources(result: ProjectAnalysis, query: StructureQuery): OperationSource[] {
  return result.migrations.flatMap((step, migrationIndex) => step.analysis.operations.flatMap((operation, operationIndex) =>
    involves(operation,query) ? [{ migrationIndex, operationIndex, filename:step.filename, status:step.status, operation, source:operation.source ?? null }] : []));
}
