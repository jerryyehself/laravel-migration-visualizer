import type { Column, SchemaState } from './types.js';
import type { SchemaDiff } from './project-types.js';
import { compareNames } from './ordering.js';
const owns = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);
function equalColumns(a: Column, b: Column): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)] as (keyof Column)[]);
  return [...keys].every(key => {
    if (owns(a,key) !== owns(b,key)) return false;
    if (key === 'allowedValues') {
      const left=a.allowedValues, right=b.allowedValues;
      return left === undefined || right === undefined ? left === right
        : left.length === right.length && left.every((value,i)=>value === right[i]);
    }
    return a[key] === b[key];
  });
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
      const oldIndexes = before.tables[table].indexes, newIndexes = after.tables[table].indexes;
      const indexes = [...new Set([...Object.keys(oldIndexes), ...Object.keys(newIndexes)])].sort(compareNames);
      for (const index of indexes) {
        if (!owns(oldIndexes, index)) changes.push({ kind: 'indexAdded', table, index, after: structuredClone(newIndexes[index]) });
        else if (!owns(newIndexes, index)) changes.push({ kind: 'indexRemoved', table, index, before: structuredClone(oldIndexes[index]) });
        else {
          const a = oldIndexes[index], b = newIndexes[index];
          if (a.name !== b.name || a.type !== b.type || a.columns.length !== b.columns.length || a.columns.some((name, i) => name !== b.columns[i])) {
            changes.push({ kind: 'indexChanged', table, index, before: structuredClone(a), after: structuredClone(b) });
          }
        }
      }
      const oldKeys = before.tables[table].foreignKeys, newKeys = after.tables[table].foreignKeys;
      for (const foreignKey of [...new Set([...Object.keys(oldKeys), ...Object.keys(newKeys)])].sort(compareNames)) {
        if (!owns(oldKeys, foreignKey)) changes.push({ kind:'foreignKeyAdded', table, foreignKey, after:structuredClone(newKeys[foreignKey]) });
        else if (!owns(newKeys, foreignKey)) changes.push({ kind:'foreignKeyRemoved', table, foreignKey, before:structuredClone(oldKeys[foreignKey]) });
        else {
          const a = oldKeys[foreignKey], b = newKeys[foreignKey];
          const same = (left: string[], right: string[]) => left.length === right.length && left.every((name, i) => name === right[i]);
          if (a.name !== b.name || a.referencedTable !== b.referencedTable || !same(a.columns,b.columns) || !same(a.referencedColumns,b.referencedColumns) || a.onDelete !== b.onDelete || a.onUpdate !== b.onUpdate) {
            changes.push({ kind:'foreignKeyChanged', table, foreignKey, before:structuredClone(a), after:structuredClone(b) });
          }
        }
      }
    }
  }
  return { changes };
}
