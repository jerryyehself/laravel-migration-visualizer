import type { SchemaDiff } from '@lmv/migration-core';
export type ChangeMark = 'added' | 'removed' | 'changed';
export const markLabels: Record<ChangeMark, string> = { added: '新增', removed: '移除', changed: '變更' };
export const memberKey = (table: string, name: string) => JSON.stringify([table, name]);
// Read the core diff; these maps only annotate an existing before/after graph.
export function graphDiffMarks(diff: SchemaDiff, side: 'before' | 'after') {
  const tables = new Map<string, ChangeMark>();
  const columns = new Map<string, ChangeMark>();
  const edges = new Map<string, ChangeMark>();
  for (const change of diff.changes) {
    const mark: ChangeMark = change.kind.endsWith('Added') ? 'added' : change.kind.endsWith('Removed') ? 'removed' : 'changed';
    if (change.kind !== 'tableAdded' && change.kind !== 'tableRemoved' && !tables.has(change.table)) tables.set(change.table, 'changed');
    if ((mark === 'added' && side === 'before') || (mark === 'removed' && side === 'after')) continue;
    if (change.kind === 'tableAdded' || change.kind === 'tableRemoved') tables.set(change.table, mark);
    else {
      if (!tables.has(change.table)) tables.set(change.table, 'changed');
      if ('column' in change) columns.set(memberKey(change.table, change.column), mark);
      if ('foreignKey' in change) edges.set(memberKey(change.table, change.foreignKey), mark);
    }
  }
  return { tables, columns, edges };
}
