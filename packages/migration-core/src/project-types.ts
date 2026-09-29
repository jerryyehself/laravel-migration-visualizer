import type { AnalysisResult, Column, SchemaState, SourceLocation } from './types.js';

export interface MigrationFile { filename: string; source: string }
export type TableState = SchemaState['tables'][string];
export type SchemaChange =
  | { kind: 'tableAdded'; table: string; after: TableState }
  | { kind: 'tableRemoved'; table: string; before: TableState }
  | { kind: 'columnAdded'; table: string; column: string; after: Column }
  | { kind: 'columnRemoved'; table: string; column: string; before: Column }
  | { kind: 'columnChanged'; table: string; column: string; before: Column; after: Column };
export interface SchemaDiff { changes: SchemaChange[] }
export interface ProjectDiagnostic {
  phase: 'ordering' | 'analysis' | 'replay' | 'dependency';
  severity: 'error';
  code: string;
  message: string;
  source: SourceLocation;
  operationIndex?: number;
}
export interface MigrationSnapshot {
  filename: string;
  migrationName: string;
  status: 'applied' | 'failed' | 'blocked';
  analysis: AnalysisResult;
  /** Null means unknown, never an empty schema or a guessed snapshot. */
  schemaBefore: SchemaState | null;
  schemaAfter: SchemaState | null;
  diff: SchemaDiff | null;
  diagnostics: ProjectDiagnostic[];
}
export interface ProjectAnalysis {
  complete: boolean;
  migrations: MigrationSnapshot[];
  diagnostics: ProjectDiagnostic[];
  initialSchema: SchemaState;
  /** Only populated when every migration was applied successfully. */
  finalSchema: SchemaState | null;
  /** End of the successfully applied prefix, not necessarily the final schema. */
  lastValidSchema: SchemaState;
  appliedCount: number;
}
