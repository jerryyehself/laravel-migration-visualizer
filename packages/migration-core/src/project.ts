import { analyzeMigration } from './normalize.js';
import { applyOperations, emptySchema, SchemaReplayError } from './schema.js';
import { migrationName, orderMigrations } from './ordering.js';
import { diffSchemas } from './diff.js';
import type { SchemaState } from './types.js';
import type { MigrationFile, MigrationSnapshot, ProjectAnalysis, ProjectDiagnostic } from './project-types.js';

/** Pure project analysis. File IO belongs to the caller, not core or React hooks. */
export function analyzeProject(files: readonly MigrationFile[], options: { initialSchema?: SchemaState } = {}): ProjectAnalysis {
  const initialSchema = structuredClone(options.initialSchema ?? emptySchema());
  let current = structuredClone(initialSchema);
  const ordered = orderMigrations(files);
  const diagnostics: ProjectDiagnostic[] = [...ordered.diagnostics];
  const migrations: MigrationSnapshot[] = [];
  let appliedCount = 0;
  let blocked = ordered.diagnostics.length > 0;
  let blocker = blocked ? 'Project filenames are invalid or ambiguous.' : '';
  for (const file of ordered.files) {
    // Continue syntax analysis after failure to report independent diagnostics,
    // but never replay against a stale schema or fabricate later snapshots.
    const analysis = analyzeMigration(file.source, file.filename);
    const local: ProjectDiagnostic[] = [
      ...ordered.diagnostics.filter((d, index, all) => d.source.file === file.filename &&
        all.findIndex(other => other.source.file === d.source.file && other.code === d.code) === index),
      ...analysis.diagnostics.map(d => ({ ...d, phase: 'analysis' as const, severity: 'error' as const })),
    ];
    const entry: MigrationSnapshot = {
      filename: file.filename, migrationName: migrationName(file.filename),
      status: 'blocked', analysis, schemaBefore: null, schemaAfter: null, diff: null, diagnostics: local,
    };
    const report = (diagnostic: ProjectDiagnostic) => local.push(diagnostic);
    if (blocked) {
      report({ phase: 'dependency', severity: 'error', code: 'SCHEMA_BLOCKED', message: blocker, source: { file: file.filename, line: 1, column: 0 } });
    } else {
      entry.schemaBefore = structuredClone(current);
      if (!analysis.complete) {
        entry.status = 'failed';
        blocked = true;
      } else {
        try {
          const after = applyOperations(current, analysis.operations);
          entry.diff = diffSchemas(current, after);
          entry.schemaAfter = structuredClone(after);
          entry.status = 'applied';
          current = after;
          appliedCount++;
        } catch (error) {
          if (!(error instanceof SchemaReplayError)) throw error;
          report({ phase: 'replay', severity: 'error', code: 'SCHEMA_REPLAY_ERROR', message: error.message, source: error.source, operationIndex: error.operationIndex });
          entry.status = 'failed';
          blocked = true;
        }
      }
      if (blocked) blocker = `Schema is unknown after failed migration: ${file.filename}`;
    }
    diagnostics.push(...local.filter(d => d.phase !== 'ordering'));
    migrations.push(entry);
  }
  return {
    complete: !blocked, migrations, diagnostics, initialSchema,
    finalSchema: blocked ? null : structuredClone(current),
    lastValidSchema: structuredClone(current), appliedCount,
  };
}
