import type { AtomicOperation, SchemaState } from './types.js';
export const emptySchema = (): SchemaState => ({ tables: {} });
const owns = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);
function set<T>(record: Record<string, T>, key: string, value: T) {
  Object.defineProperty(record, key, { value, enumerable: true, writable: true, configurable: true });
}
/** Immutable, all-or-nothing replay. Invalid operation sequences throw. */
export function applyOperations(initial: SchemaState, operations: readonly AtomicOperation[]): SchemaState {
  const state = structuredClone(initial);
  for (const op of operations) {
    if (op.kind === 'createTable') {
      if (owns(state.tables, op.table)) throw new Error(`Table already exists: ${op.table}`);
      set(state.tables, op.table, { name: op.table, columns: {} });
      continue;
    }
    if (!owns(state.tables, op.table)) throw new Error(`Unknown table: ${op.table}`);
    const columns = state.tables[op.table].columns;
    if (op.kind === 'addColumn') {
      if (owns(columns, op.column.name)) throw new Error(`Column already exists: ${op.column.name}`);
      set(columns, op.column.name, structuredClone(op.column));
    } else if (op.kind === 'dropColumn') {
      if (!owns(columns, op.column)) throw new Error(`Unknown column: ${op.column}`);
      delete columns[op.column];
    } else {
      if (!owns(columns, op.from)) throw new Error(`Unknown column: ${op.from}`);
      if (owns(columns, op.to)) throw new Error(`Column already exists: ${op.to}`);
      set(columns, op.to, { ...columns[op.from], name: op.to });
      delete columns[op.from];
    }
  }
  return state;
}
