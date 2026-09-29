import type { MigrationFile, ProjectDiagnostic } from './project-types.js';

/** Locale-independent ordering for conventional ASCII Laravel migration names. */
export const compareNames = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
export function migrationName(filename: string): string {
  return filename.replace(/\\/g, '/').split('/').at(-1)!.replace(/\.php$/, '');
}
export interface OrderedMigrations {
  files: MigrationFile[];
  diagnostics: ProjectDiagnostic[];
}
/** Never mutates the input; paths are retained for source diagnostics. */
export function orderMigrations(files: readonly MigrationFile[]): OrderedMigrations {
  const ordered = files.map(file => ({ ...file })).sort((a, b) =>
    compareNames(migrationName(a.filename), migrationName(b.filename)) || compareNames(a.filename, b.filename));
  const diagnostics: ProjectDiagnostic[] = [];
  const counts = new Map<string, number>();
  for (const file of ordered) {
    const name = migrationName(file.filename);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  for (const file of ordered) {
    const basename = file.filename.replace(/\\/g, '/').split('/').at(-1)!;
    const name = migrationName(file.filename);
    const report = (code: string, message: string) => diagnostics.push({ phase: 'ordering', severity: 'error', code, message, source: { file: file.filename, line: 1, column: 0 } });
    // A naming contract, not calendar validation: Laravel also ships year 0001 files.
    if (!/^\d{4}_\d{2}_\d{2}_\d{6}_[A-Za-z0-9_]+\.php$/.test(basename)) {
      report('INVALID_MIGRATION_FILENAME', 'Expected YYYY_MM_DD_HHMMSS_description.php.');
    }
    if (counts.get(name)! > 1) report('DUPLICATE_MIGRATION_NAME', `Duplicate migration name: ${name}`);
  }
  return { files: ordered, diagnostics };
}
