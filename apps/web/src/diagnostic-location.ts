import type { MigrationFile, ProjectAnalysis, ProjectDiagnostic } from '@lmv/migration-core';

// Exact paths only: a basename match could select the wrong nested migration.
export function diagnosticTarget(files: readonly MigrationFile[], result: ProjectAnalysis, diagnostic: ProjectDiagnostic) {
  const matches = files.filter(file => file.filename === diagnostic.source.file);
  if (matches.length !== 1) return null;
  const indexes = result.migrations.flatMap((step, index) => step.filename === diagnostic.source.file ? [index] : []);
  return { file: matches[0], resultIndex: indexes.length === 1 ? indexes[0] : null };
}

export function sourceExcerpt(source: string, requested: number | null) {
  const lines = source.split(/\r\n|\n|\r/);
  const line = requested !== null && Number.isInteger(requested) && requested >= 1 && requested <= lines.length ? requested : null;
  const start = line === null ? 0 : Math.max(0,line - 4);
  const end = line === null ? Math.min(lines.length,7) : Math.min(lines.length,line + 3);
  return { line, lines: lines.slice(start,end).map((text,offset) => ({ number:start+offset+1,text })) };
}
export function diagnosticExcerpt(source: string, diagnostic: ProjectDiagnostic) {
  // Ordering/dependency locations identify a file, not a PHP statement.
  return sourceExcerpt(source,diagnostic.phase === 'ordering' || diagnostic.phase === 'dependency' ? null : diagnostic.source.line);
}

// Textarea values normalize CRLF/CR to LF; selection offsets use UTF-16 units.
export function sourceLineSelection(source: string, line: number | null) {
  const text = source.replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  if (line === null || !Number.isInteger(line) || line < 1 || line > lines.length) return { start: 0, end: 0 };
  const start = lines.slice(0, line - 1).reduce((offset, value) => offset + value.length + 1, 0);
  return { start, end: start + lines[line - 1].length };
}
