import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeMigration, analyzeProject, diffSchemas } from '../src/index.js';
const php = (body: string, method = 'create') => `<?php return new class extends Migration { function up() { Schema::${method}('events', function($t) { ${body} }); } };`;
const file = (day: number, body: string, method = 'create') => ({ filename: `2026_06_0${day}_000000_events.php`, source: php(body, method) });
describe('dateTime current default intent', () => {
  it.each(['dateTime', 'dateTimeTz'])('normalizes %s with precision and chained modifiers', type => {
    const result = analyzeMigration(php(`$t->${type}('at', 6)->nullable()->useCurrent()->comment('clock');`));
    expect(result.complete).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.operations.find(o => o.kind === 'addColumn')).toMatchObject({ column: { name: 'at', type, precision: 6, nullable: true, useCurrent: true, comment: 'clock' } });
    const column = result.operations.find(o => o.kind === 'addColumn');
    if (column?.kind === 'addColumn') expect(column.column).not.toHaveProperty('default');
  });
  it.each(['dateTime', 'dateTimeTz'])('keeps ordinary %s without useCurrent metadata', type => {
    const result = analyzeProject([file(1, `$t->${type}('at');`)]);
    expect(result.complete).toBe(true);
    expect(result.finalSchema!.tables.events.columns.at).toEqual({ name: 'at', type, precision: 0, nullable: false });
  });
  it.each(['dateTime', 'dateTimeTz'])('rejects ambiguous %s modifiers and retains the trusted prefix', type => {
    for (const chain of ['default(null)->useCurrent()', "useCurrent()->default('now')", 'useCurrent(false)', 'useCurrentOnUpdate()']) {
      const result = analyzeProject([file(1, "$t->string('name');"), file(2, `$t->${type}('at')->${chain};`, 'table'), file(3, "$t->string('later');", 'table')]);
      expect(result.migrations.map(m => m.status)).toEqual(['applied', 'failed', 'blocked']);
      expect(result.diagnostics.some(d => d.code === 'UNSUPPORTED_BLUEPRINT')).toBe(true);
      expect(result.finalSchema).toBeNull();
      expect(Object.keys(result.lastValidSchema.tables.events.columns)).toEqual(['name']);
      expect(result.migrations[1].schemaBefore).toEqual(result.lastValidSchema);
      expect(result.migrations[1].schemaAfter).toBeNull();
      expect(result.migrations[2].schemaBefore).toBeNull();
      expect(result.migrations[2].diff).toBeNull();
    }
  });
  it.each(['time', 'timeTz', 'date', 'string'])('continues rejecting useCurrent for %s', type => {
    expect(analyzeMigration(php(`$t->${type}('at')->useCurrent();`)).complete).toBe(false);
  });
  it('matches independent cross-file snapshot and diff goldens without aliasing', () => {
    const result = analyzeProject([file(2, "$t->dateTimeTz('zoned', 6)->useCurrent();", 'table'), file(1, "$t->dateTime('at')->useCurrent();")]);
    const golden = JSON.parse(readFileSync(new URL('./fixtures/datetime-current.golden.json', import.meta.url), 'utf8'));
    expect(result.complete).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.migrations.map(m => ({ before: m.schemaBefore, after: m.schemaAfter, diff: m.diff }))).toEqual(golden);
    const after = result.migrations[1].schemaAfter!;
    delete after.tables.events.columns.at.useCurrent;
    expect(result.migrations[0].schemaAfter!.tables.events.columns.at.useCurrent).toBe(true);
    expect(result.finalSchema!.tables.events.columns.at.useCurrent).toBe(true);
    expect(diffSchemas(result.finalSchema!, after).changes).toMatchObject([{ kind: 'columnChanged', column: 'at', before: { useCurrent: true } }]);
  });
});
