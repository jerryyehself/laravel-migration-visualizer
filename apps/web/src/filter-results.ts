import type { MigrationSnapshot } from '@lmv/migration-core';

export type ResultStatusFilter = 'all' | MigrationSnapshot['status'];
export interface VisibleMigration { index: number; migration: MigrationSnapshot }

// A view projection: retain core ordering and original indices, without replay or mutation.
export function filterMigrationResults(migrations: readonly MigrationSnapshot[], query: string, status: ResultStatusFilter): VisibleMigration[] {
  const needle = query.trim().toLowerCase();
  return migrations.map((migration, index) => ({ migration, index })).filter(({ migration }) =>
    (status === 'all' || migration.status === status) && migration.filename.toLowerCase().includes(needle));
}

export function visibleSelection(visible: readonly VisibleMigration[], selected: number): number | null {
  return visible.some(item => item.index === selected) ? selected : visible[0]?.index ?? null;
}
