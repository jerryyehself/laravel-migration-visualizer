import type { ProjectAnalysis, SchemaState, MigrationSnapshot } from '@lmv/migration-core';
export interface SchemaSnapshotChoice {
  id: string;
  label: string;
  schema: SchemaState | null;
  unavailable: string;
  comparison?: MigrationSnapshot;
}
// Select existing authoritative snapshots; never replay or substitute a prefix.
export function schemaSnapshotChoices(result: ProjectAnalysis): SchemaSnapshotChoice[] {
  return [
    { id: 'final', label: '專案最終 Schema', schema: result.complete ? result.finalSchema : null,
      unavailable: '分析未完成，最終 schema 未知。' },
    { id: 'initial', label: '專案初始 Schema', schema: result.initialSchema, unavailable: '' },
    ...result.migrations.flatMap((step, index) => [
      { id: `before-${index}`, label: `${index + 1}. ${step.filename} · 套用前`, schema: step.schemaBefore,
        unavailable: '前序狀態未知，沒有可信的套用前快照。' },
      { id: `after-${index}`, label: `${index + 1}. ${step.filename} · 套用後`, schema: step.schemaAfter,
        unavailable: '此檔未成功套用，沒有可信的套用後快照。' },
      { id: `diff-${index}`, label: `${index + 1}. ${step.filename} · 結構比較`,
        schema: step.schemaBefore !== null && step.schemaAfter !== null && step.diff !== null ? step.schemaAfter : null,
        unavailable: '快照或 diff 未知，無法比較。', comparison: step },
    ]),
  ];
}
