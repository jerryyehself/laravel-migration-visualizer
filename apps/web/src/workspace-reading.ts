import type { ProjectAnalysis } from '@lmv/migration-core';
import { schemaSnapshotChoices } from './schema-snapshots';
export type ReadingSide = 'before' | 'after' | 'diff';
export type ReadingLocation = { kind: 'initial' | 'final' } | { kind: 'migration'; index: number; side: ReadingSide };
export function workspaceReading(result: ProjectAnalysis, location: ReadingLocation) {
  const index = location.kind === 'migration' && Number.isInteger(location.index) && location.index >= 0 && location.index < result.migrations.length ? location.index : null;
  const step = index === null ? null : result.migrations[index];
  const id = step && location.kind === 'migration' ? `${location.side}-${index}` : location.kind === 'initial' ? 'initial' : 'final';
  const choice = schemaSnapshotChoices(result).find(item => item.id === id)!;
  return { index, step, choice, previous: index !== null && index > 0 ? index - 1 : null,
    next: index !== null && index + 1 < result.migrations.length ? index + 1 : null };
}
