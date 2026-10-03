import { describe, expect, it } from 'vitest';
import { analyzeProject, type ProjectDiagnostic } from '../../../packages/migration-core/src/index.js';
import { diagnosticExcerpt, diagnosticTarget } from '../src/diagnostic-location';

const diagnostic = (line = 5, phase: ProjectDiagnostic['phase'] = 'analysis'): ProjectDiagnostic => ({
  phase, severity: 'error', code: 'test', message: 'test', source: { file: 'migrations/a.php', line, column: 0 },
});
const source = Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join('\n');

describe('diagnostic source navigation', () => {
  it('uses exact relative paths rather than colliding basenames', () => {
    const files = [{ filename: 'migrations/a.php', source }, { filename: 'other/a.php', source: 'other' }];
    const result = analyzeProject(files);
    expect(diagnosticTarget(files, result, diagnostic())?.file).toBe(files[0]);
    expect(diagnosticTarget(files, result, { ...diagnostic(), source: { ...diagnostic().source, file: 'a.php' } })).toBeNull();
  });
  it('refuses ambiguous identical paths and missing source files', () => {
    const files = [{ filename: 'migrations/a.php', source }, { filename: 'migrations/a.php', source: 'different' }];
    expect(diagnosticTarget(files, analyzeProject(files), diagnostic())).toBeNull();
    expect(diagnosticTarget([], analyzeProject([]), diagnostic())).toBeNull();
  });
  it('selects the core result index even when input order differs', () => {
    const files = [
      { filename: '2026_01_02_000000_bad.php', source: '<?php return new class extends Migration {function up(){ unknown(); }};' },
      { filename: '2026_01_01_000000_create.php', source: '<?php return new class extends Migration {function up(){}};' },
    ];
    const result = analyzeProject(files);
    const item = result.diagnostics.find(d => d.source.file === files[0].filename)!;
    expect(diagnosticTarget(files, result, item)).toEqual({ file: files[0], resultIndex: 1 });
    expect(result.finalSchema).toBeNull();
  });
  it('keeps ordering diagnostics navigable even without a replayed snapshot', () => {
    const files = [{ filename: 'migrations/a.php', source }];
    const result = analyzeProject(files);
    expect(diagnosticTarget(files, result, result.diagnostics[0])?.file).toBe(files[0]);
    expect(diagnosticExcerpt(source, result.diagnostics[0]).line).toBeNull();
  });
  it('shows three context lines on each side using one-based line numbers', () => {
    expect(diagnosticExcerpt(source, diagnostic())).toEqual({ line: 5, lines: Array.from({ length: 7 }, (_, i) => ({ number: i + 2, text: `line ${i + 2}` })) });
  });
  it('handles CRLF and end-of-file locations without inventing lines', () => {
    expect(diagnosticExcerpt('one\r\ntwo\r\n', diagnostic(3))).toEqual({ line: 3, lines: [{ number: 1, text: 'one' }, { number: 2, text: 'two' }, { number: 3, text: '' }] });
  });
  it('shows the beginning without a highlight for invalid or file-level locations', () => {
    for (const item of [diagnostic(0), diagnostic(100), diagnostic(1.5), diagnostic(5, 'ordering'), diagnostic(5, 'dependency')]) {
      const excerpt = diagnosticExcerpt(source, item);
      expect(excerpt.line).toBeNull(); expect(excerpt.lines.map(line => line.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    }
  });
  it('retains literal source text and never mutates the diagnostic or result', () => {
    const item = diagnostic(1); const before = JSON.stringify(item);
    expect(diagnosticExcerpt('<script>alert(1)</script>', item).lines[0].text).toBe('<script>alert(1)</script>');
    expect(JSON.stringify(item)).toBe(before);
  });
});
