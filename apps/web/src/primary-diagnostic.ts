import type { ProjectAnalysis, ProjectDiagnostic } from '@lmv/migration-core';

// Select evidence already supplied by core; do not infer a new failure cause.
export function primaryDiagnostic(result: ProjectAnalysis): ProjectDiagnostic | null {
  return result.diagnostics.find(item => item.phase === 'ordering')
    ?? result.migrations.find(item => item.status === 'failed')?.diagnostics.find(item => item.phase === 'analysis' || item.phase === 'replay')
    ?? null;
}
