import type { AtomicOperation, SchemaState, SourceLocation, SchemaIndex } from './types.js';
import { indexName } from './index-name.js';
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
/** Immutable, all-or-nothing replay. Indexes are authoritative; column.primary is derived. */
export function applyOperations(initial: SchemaState, operations: readonly AtomicOperation[]): SchemaState {
  const state = structuredClone(initial);
  for (const [operationIndex, op] of operations.entries()) {
    const fail = (message: string): never => { throw new SchemaReplayError(message, operationIndex, op); };
    if (op.kind === 'createTable') {
      if (owns(state.tables, op.table)) fail(`Table already exists: ${op.table}`);
      set(state.tables, op.table, { name: op.table, columns: {}, indexes: {}, foreignKeys: {} });
      continue;
    }
    if (!owns(state.tables, op.table)) {
      if (op.kind === 'dropTable' && op.ifExists) continue;
      fail(`Unknown table: ${op.table}`);
    }
    if (op.kind === 'renameTable') {
      if (owns(state.tables, op.to)) fail(`Table already exists: ${op.to}`);
      const table = state.tables[op.table];
      table.name = op.to;
      set(state.tables, op.to, table);
      delete state.tables[op.table];
      for (const current of Object.values(state.tables)) for (const key of Object.values(current.foreignKeys)) {
        if (key.referencedTable === op.table) key.referencedTable = op.to;
      }
      continue;
    }
    if (op.kind === 'dropTable') {
      if (Object.entries(state.tables).some(([name, table]) => name !== op.table &&
        Object.values(table.foreignKeys).some(key => key.referencedTable === op.table))) fail(`Drop incoming foreign keys before dropping table: ${op.table}`);
      delete state.tables[op.table];
      continue;
    }
    const { columns, indexes, foreignKeys } = state.tables[op.table];
    const syncPrimary = () => {
      const primaryColumns = new Set(Object.values(indexes).filter(index => index.type === 'primary').flatMap(index => index.columns));
      for (const column of Object.values(columns)) {
        if (primaryColumns.has(column.name)) column.primary = true;
        else delete column.primary;
      }
    };
    const addIndex = (index: SchemaIndex) => {
      if (!index.name || !index.columns.length || new Set(index.columns).size !== index.columns.length) fail('Invalid index definition.');
      if (owns(indexes, index.name)) fail(`Index already exists: ${index.name}`);
      for (const name of index.columns) if (!owns(columns, name)) fail(`Unknown index column: ${name}`);
      if (index.type === 'primary' && Object.values(indexes).some(existing => existing.type === 'primary')) fail('Table already has a primary key.');
      set(indexes, index.name, structuredClone(index));
      syncPrimary();
    };
    if (op.kind === 'addColumn') {
      if (owns(columns, op.column.name)) fail(`Column already exists: ${op.column.name}`);
      set(columns, op.column.name, structuredClone(op.column));
      if (op.column.primary) addIndex({ name: indexName(op.table, [op.column.name], 'primary'), type: 'primary', columns: [op.column.name] });
      else syncPrimary();
    } else if (op.kind === 'addIndex') {
      addIndex(op.index);
    } else if (op.kind === 'dropIndex') {
      const name = op.name ?? Object.values(indexes).find(index => index.type === 'primary')?.name;
      if (!name || !owns(indexes, name)) fail(`Unknown index: ${op.name ?? 'primary'}`);
      const target = indexes[name!];
      if (target.type !== op.indexType) fail(`Index type mismatch: ${name}`);
      delete indexes[name!];
      syncPrimary();
    } else if (op.kind === 'addForeignKey') {
      const key = op.foreignKey;
      if (!key.name || !key.columns.length || key.columns.length !== key.referencedColumns.length ||
          new Set(key.columns).size !== key.columns.length || new Set(key.referencedColumns).size !== key.referencedColumns.length) fail('Invalid foreign key definition.');
      if (owns(foreignKeys, key.name)) fail(`Foreign key already exists: ${key.name}`);
      for (const name of key.columns) if (!owns(columns, name)) fail(`Unknown foreign key column: ${name}`);
      if (!owns(state.tables, key.referencedTable)) fail(`Unknown referenced table: ${key.referencedTable}`);
      const target = state.tables[key.referencedTable];
      for (const name of key.referencedColumns) if (!owns(target.columns, name)) fail(`Unknown referenced column: ${key.referencedTable}.${name}`);
      if ((key.onDelete === 'set null' || key.onUpdate === 'set null') && key.columns.some(name => !columns[name].nullable)) fail('SET NULL requires nullable foreign key columns.');
      set(foreignKeys, key.name, structuredClone(key));
    } else if (op.kind === 'dropForeignKey') {
      if (!owns(foreignKeys, op.name)) fail(`Unknown foreign key: ${op.name}`);
      delete foreignKeys[op.name];
    } else if (op.kind === 'dropColumn') {
      if (!owns(columns, op.column)) fail(`Unknown column: ${op.column}`);
      if (Object.values(foreignKeys).some(key => key.columns.includes(op.column)) || Object.values(state.tables).some(table =>
        Object.values(table.foreignKeys).some(key => key.referencedTable === op.table && key.referencedColumns.includes(op.column)))) fail(`Drop foreign keys before dropping referenced column: ${op.table}.${op.column}`);
      if (Object.values(indexes).some(index => index.columns.includes(op.column))) fail(`Drop indexes before dropping referenced column: ${op.column}`);
      delete columns[op.column];
    } else if (op.kind === 'renameColumn') {
      if (!owns(columns, op.from)) fail(`Unknown column: ${op.from}`);
      if (owns(columns, op.to)) fail(`Column already exists: ${op.to}`);
      set(columns, op.to, { ...columns[op.from], name: op.to });
      delete columns[op.from];
      for (const index of Object.values(indexes)) index.columns = index.columns.map(name => name === op.from ? op.to : name);
      for (const key of Object.values(foreignKeys)) key.columns = key.columns.map(name => name === op.from ? op.to : name);
      for (const table of Object.values(state.tables)) for (const key of Object.values(table.foreignKeys)) {
        if (key.referencedTable === op.table) key.referencedColumns = key.referencedColumns.map(name => name === op.from ? op.to : name);
      }
      syncPrimary();
    }
  }
  return state;
}
