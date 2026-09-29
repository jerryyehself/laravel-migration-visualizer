import type { Column, SchemaState } from './types.js';
import type { SchemaDiff } from './project-types.js';
import { compareNames } from './ordering.js';
const owns = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);
function equalColumns(a: Column, b: Column): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)] as (keyof Column)[]);
  return [...keys].every(key => owns(a, key) === owns(b, key) && a[key] === b[key]);
}
/** Structural diff only: renames are removed + added, never inferred. */
export function diffSchemas(before: SchemaState, after: SchemaState): SchemaDiff {
  const changes: SchemaDiff['changes'] = [];
  const tables = [...new Set([...Object.keys(before.tables), ...Object.keys(after.tables)])].sort(compareNames);
  for (const table of tables) {
    if (!owns(before.tables, table)) {
      changes.push({ kind: 'tableAdded', table, after: structuredClone(after.tables[table]) });
    } else if (!owns(after.tables, table)) {
      changes.push({ kind: 'tableRemoved', table, before: structuredClone(before.tables[table]) });
    } else {
      const oldColumns = before.tables[table].columns, newColumns = after.tables[table].columns;
      const columns = [...new Set([...Object.keys(oldColumns), ...Object.keys(newColumns)])].sort(compareNames);
      for (const column of columns) {
        if (!owns(oldColumns, column)) changes.push({ kind: 'columnAdded', table, column, after: structuredClone(newColumns[column]) });
        else if (!owns(newColumns, column)) changes.push({ kind: 'columnRemoved', table, column, before: structuredClone(oldColumns[column]) });
        else if (!equalColumns(oldColumns[column], newColumns[column])) changes.push({ kind: 'columnChanged', table, column, before: structuredClone(oldColumns[column]), after: structuredClone(newColumns[column]) });
      }
    }
  }
  return { changes };
}
