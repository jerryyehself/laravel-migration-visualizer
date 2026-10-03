import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeMigration, analyzeProject, applyOperations, diffSchemas } from '../src/index.js';

const php = (body: string, method = 'create') => `<?php return new class extends Migration { function up() { Schema::${method}('events', function($t) { ${body} }); } };`;
const file = (day: number, body: string, method = 'create') => ({ filename: `2026_08_0${day}_000000_events.php`, source: php(body, method) });
const types = ['timestamp', 'timestampTz', 'dateTime', 'dateTimeTz'];

describe('current timestamp on update intent', () => {
  it.each(types)('normalizes %s as independent update metadata', type => {
    const result = analyzeMigration(php(`$t->${type}('at', 6)->nullable()->useCurrentOnUpdate()->comment('clock');`));
    expect(result.complete).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.operations).toMatchObject([{ kind: 'createTable' }, {
      kind: 'addColumn', table: 'events', column: { name: 'at', type, precision: 6, nullable: true, useCurrentOnUpdate: true, comment: 'clock' },
    }]);
    const op = result.operations[1];
    if (op.kind === 'addColumn') {
      expect(op.column).not.toHaveProperty('default');
      expect(op.column).not.toHaveProperty('useCurrent');
    }
  });

  it.each(types)('combines %s update and default intents in either order', type => {
    for (const chain of ['useCurrent()->useCurrentOnUpdate()', 'useCurrentOnUpdate()->useCurrent()']) {
      const result = analyzeProject([file(1, `$t->${type}('at')->${chain};`)]);
      expect(result.complete).toBe(true);
      expect(result.finalSchema!.tables.events.columns.at).toEqual({ name: 'at', type, nullable: false, precision: 0, useCurrent: true, useCurrentOnUpdate: true });
    }
  });

  it.each(['null', "'2000-01-01 00:00:00'", '0', 'false'])('preserves scalar default %s independently of on-update intent', value => {
    for (const chain of [`default(${value})->useCurrentOnUpdate()`, `useCurrentOnUpdate()->default(${value})`]) {
      const result = analyzeProject([file(1, `$t->timestamp('at')->${chain};`)]);
      expect(result.complete).toBe(true);
      const column = result.finalSchema!.tables.events.columns.at;
      expect(column).toHaveProperty('useCurrentOnUpdate', true);
      expect(column).toHaveProperty('default', value === 'null' ? null : value === '0' ? 0 : value === 'false' ? false : '2000-01-01 00:00:00');
      expect(column).not.toHaveProperty('useCurrent');
    }
  });

  it.each(['time', 'timeTz', 'date', 'string', 'integer', 'foreignId'])('rejects on-update for %s without emitting partial column operations', type => {
    const result = analyzeMigration(php(`$t->${type}('at')->useCurrentOnUpdate()->index();`));
    expect(result.complete).toBe(false);
    expect(result.diagnostics.map(d => d.code)).toEqual(['UNSUPPORTED_BLUEPRINT']);
    expect(result.operations.map(op => op.kind)).toEqual(['createTable']);
  });

  it.each(['false', 'true', 'null', "'now'", '1', '$value'])('rejects explicit on-update argument %s', argument => {
    const result = analyzeMigration(php(`$t->timestamp('at')->useCurrentOnUpdate(${argument});`));
    expect(result.complete).toBe(false);
    expect(result.operations.map(op => op.kind)).toEqual(['createTable']);
    expect(result.diagnostics.map(d => d.code)).toEqual(['UNSUPPORTED_BLUEPRINT']);
  });

  it('keeps all useCurrent/default conflicts rejected even with on-update', () => {
    for (const chain of [
      'default(null)->useCurrentOnUpdate()->useCurrent()',
      'useCurrent()->useCurrentOnUpdate()->default(null)',
      'useCurrentOnUpdate()->default(null)->useCurrent()',
      'useCurrentOnUpdate()->useCurrent()->default(null)',
    ]) {
      const result = analyzeMigration(php(`$t->timestamp('at')->${chain};`));
      expect(result.complete).toBe(false);
      expect(result.operations.map(op => op.kind)).toEqual(['createTable']);
    }
  });

  it.each(types)('supports %s change with on-update before or after change', type => {
    for (const chain of ['useCurrentOnUpdate()->change()', 'change()->useCurrentOnUpdate()']) {
      const result = analyzeProject([file(1, `$t->${type}('at');`), file(2, `$t->${type}('at')->${chain};`, 'table')]);
      expect(result.complete).toBe(true);
      expect(result.migrations[1].analysis.operations).toMatchObject([{ kind: 'changeColumn', column: { useCurrentOnUpdate: true } }]);
      expect(result.migrations[1].diff!.changes).toMatchObject([{ kind: 'columnChanged', before: { name: 'at' }, after: { useCurrentOnUpdate: true } }]);
    }
  });

  it.each(['timestamps', 'timestampsTz'])('continues rejecting chained modifiers on %s pair helpers', type => {
    const result = analyzeMigration(php(`$t->${type}()->useCurrentOnUpdate();`));
    expect(result.complete).toBe(false);
    expect(result.operations.map(op => op.kind)).toEqual(['createTable']);
  });

  it.each(['softDeletes', 'softDeletesTz'])('applies metadata to the single timestamp emitted by %s', type => {
    const result = analyzeProject([file(1, `$t->${type}()->useCurrentOnUpdate();`)]);
    expect(result.complete).toBe(true);
    expect(result.finalSchema!.tables.events.columns.deleted_at).toEqual({ name: 'deleted_at', type: type === 'softDeletes' ? 'timestamp' : 'timestampTz', nullable: true, precision: 0, useCurrentOnUpdate: true });
    expect(analyzeMigration(php(`$t->${type}()->useCurrentOnUpdate()->change();`, 'table')).complete).toBe(false);
  });

  it('keeps duplicate zero-argument intent idempotent and ordinary columns unspecified', () => {
    const result = analyzeProject([file(1, "$t->timestamp('at')->useCurrentOnUpdate()->useCurrentOnUpdate(); $t->timestamp('plain');")]);
    expect(result.complete).toBe(true);
    expect(result.finalSchema!.tables.events.columns.at).toHaveProperty('useCurrentOnUpdate', true);
    expect(result.finalSchema!.tables.events.columns.plain).not.toHaveProperty('useCurrentOnUpdate');
  });

  it('preserves independent indexes while replacing and removing current intents', () => {
    const result = analyzeProject([
      file(1, "$t->timestamp('at')->useCurrent()->useCurrentOnUpdate()->index();"),
      file(2, "$t->dateTime('at')->default(null)->useCurrentOnUpdate()->change();", 'table'),
      file(3, "$t->dateTime('at')->change();", 'table'),
    ]);
    expect(result.complete).toBe(true);
    expect(result.migrations[1].schemaAfter!.tables.events.columns.at).toEqual({ name: 'at', type: 'dateTime', nullable: false, precision: 0, default: null, useCurrentOnUpdate: true });
    expect(result.finalSchema!.tables.events.columns.at).toEqual({ name: 'at', type: 'dateTime', nullable: false, precision: 0 });
    expect(Object.keys(result.finalSchema!.tables.events.indexes)).toEqual(['events_at_index']);
  });

  it('does not alias operations, replay input, snapshots or diff metadata', () => {
    const result = analyzeProject([file(1, "$t->timestamp('at');"), file(2, "$t->timestamp('at')->useCurrentOnUpdate()->change();", 'table')]);
    expect(result.complete).toBe(true);
    const before = result.migrations[1].schemaBefore!;
    const original = structuredClone(before);
    const operations = result.migrations[1].analysis.operations;
    const replayed = applyOperations(before, operations);
    expect(before).toEqual(original);
    expect(replayed).toEqual(result.finalSchema);
    const operation = operations[0];
    if (operation.kind === 'changeColumn') Object.assign(operation.column, { useCurrentOnUpdate: false });
    Object.assign(result.migrations[1].schemaAfter!.tables.events.columns.at, { useCurrentOnUpdate: false });
    expect(result.finalSchema!.tables.events.columns.at).toHaveProperty('useCurrentOnUpdate', true);
    expect(result.migrations[1].diff!.changes).toMatchObject([{ after: { useCurrentOnUpdate: true } }]);
    expect(diffSchemas(result.finalSchema!, result.migrations[1].schemaAfter!).changes).toMatchObject([{ before: { useCurrentOnUpdate: true }, after: { useCurrentOnUpdate: false } }]);
  });

  it('does not relax create/change or chained index/change restrictions', () => {
    for (const [method, chain] of [['create', 'useCurrentOnUpdate()->change()'], ['table', 'useCurrentOnUpdate()->index()->change()'], ['table', 'change()->useCurrentOnUpdate()->change()']]) {
      const result = analyzeMigration(php(`$t->timestamp('at')->${chain};`, method));
      expect(result.complete).toBe(false);
      expect(result.operations.filter(op => op.kind !== 'createTable')).toEqual([]);
    }
  });

  it('matches independently authored cross-file success and failure goldens', () => {
    const root = new URL('./fixtures/current-on-update/', import.meta.url);
    const read = (name: string) => readFileSync(new URL(name, root), 'utf8');
    const first = '2026_08_01_000000_create_events.php', second = '2026_08_02_000000_update_events.php', third = '2026_08_03_000000_reset_events.php', bad = '2026_08_02_000000_bad_events.php';
    const project = (names: string[]) => analyzeProject(names.reverse().map(filename => ({ filename, source: read(filename) })));
    const view = (r: ReturnType<typeof analyzeProject>) => ({ complete: r.complete, appliedCount: r.appliedCount, finalSchema: r.finalSchema, lastValidSchema: r.lastValidSchema, steps: r.migrations.map(m => ({ status: m.status, before: m.schemaBefore, after: m.schemaAfter, diff: m.diff })), diagnosticCodes: r.diagnostics.map(d => d.code) });
    expect(view(project([first, second, third]))).toEqual(JSON.parse(read('success.golden.json')));
    const blocked = project([first, bad, third]);
    expect(view(blocked)).toEqual(JSON.parse(read('blocked.golden.json')));
    expect(blocked.migrations[1].analysis.operations).toMatchObject([{ kind: 'addColumn', column: { name: 'partial', useCurrentOnUpdate: true } }]);
    expect(blocked.lastValidSchema.tables.events.columns).not.toHaveProperty('partial');
  });
});
