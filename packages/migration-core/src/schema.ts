import type { AtomicOperation, SchemaState, SourceLocation } from './types.js';
export class SchemaReplayError extends Error {
  readonly source: SourceLocation;
  constructor(message: string, readonly operationIndex: number, operation: AtomicOperation) {
    super(message);
    this.name = 'SchemaReplayError';
    this.source = { ...operation.source };
  }
}
export const emptySchema = (): SchemaState => ({ tables: {} });
const owns = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);
function set<T>(record: Record<string, T>, key: string, value: T) {
  Object.defineProperty(record, key, { value, enumerable: true, writable: true, configurable: true });
}
/** Immutable, all-or-nothing replay. Invalid operation sequences throw. */
export function applyOperations(initial: SchemaState, operations: readonly AtomicOperation[]): SchemaState {
  const state = structuredClone(initial);
  for (const [operationIndex, op] of operations.entries()) {
    const fail = (message: string): never => { throw new SchemaReplayError(message, operationIndex, op); };
    if (op.kind === 'createTable') {
      if (owns(state.tables, op.table)) fail(`Table already exists: ${op.table}`);
      set(state.tables, op.table, { name: op.table, columns: {} });
      continue;
    }
    if (!owns(state.tables, op.table)) fail(`Unknown table: ${op.table}`);
    const columns = state.tables[op.table].columns;
    if (op.kind === 'addColumn') {
      if (owns(columns, op.column.name)) fail(`Column already exists: ${op.column.name}`);
      set(columns, op.column.name, structuredClone(op.column));
    } else if (op.kind === 'dropColumn') {
      if (!owns(columns, op.column)) fail(`Unknown column: ${op.column}`);
      delete columns[op.column];
    } else {
      if (!owns(columns, op.from)) fail(`Unknown column: ${op.from}`);
      if (owns(columns, op.to)) fail(`Column already exists: ${op.to}`);
      set(columns, op.to, { ...columns[op.from], name: op.to });
      delete columns[op.from];
    }
  }
  return state;
}
