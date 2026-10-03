import type { MigrationFile } from '@lmv/migration-core';

export interface MigrationDraft { current: MigrationFile; original: MigrationFile }

export function createDrafts(files: readonly MigrationFile[]): MigrationDraft[] {
  return files.map(file => ({ current: { ...file }, original: { ...file } }));
}
export function isDraftModified(draft: MigrationDraft): boolean {
  return draft.current.filename !== draft.original.filename || draft.current.source !== draft.original.source;
}
export function updateDraft(drafts: readonly MigrationDraft[], index: number, patch: Partial<MigrationFile>): MigrationDraft[] {
  return drafts.map((draft, i) => i === index ? { ...draft, current: { ...draft.current, ...patch } } : draft);
}
export function restoreDraft(drafts: readonly MigrationDraft[], index: number): MigrationDraft[] {
  return drafts.map((draft, i) => i === index ? { ...draft, current: { ...draft.original } } : draft);
}
export function removeDraft(drafts: readonly MigrationDraft[], index: number): MigrationDraft[] {
  return drafts.filter((_, i) => i !== index);
}
