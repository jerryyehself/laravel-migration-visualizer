import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { analyzeMigration, analyzeProject, emptySchema } from '../src/index.js';
const source = (call: string) => `<?php return new class extends Migration { function up() { Schema::table('users', function ($table) { ${call} }); } };`;
const fixture = (filename: string) => ({ filename, source: readFileSync(new URL(`./fixtures/nullable-timestamps/${filename}`, import.meta.url), 'utf8') });
describe('nullableTimestamps static alias', () => {
  it.each(['', '0', '3'])('expands nullable timestamp pairs with precision %s', precision => {
    const result = analyzeMigration(source(`$table->nullableTimestamps(${precision});`));
    expect(result.complete).toBe(true);
    expect(result.operations).toMatchObject(['created_at','updated_at'].map(name => ({ kind:'addColumn',table:'users',column:{name,type:'timestamp',nullable:true,precision:Number(precision)} })));
    expect(result.operations).toHaveLength(2);
    expect(result.operations[0].source).toEqual(result.operations[1].source);
    expect(result.operations).toEqual(analyzeMigration(source(`$table->timestamps(${precision});`)).operations);
  });
  it.each(['null', 'false', '"3"', '-1', '1.5', '$precision', '0, 3'])('rejects argument %s without emitting partial pairs', argument => {
    const result = analyzeMigration(source(`$table->nullableTimestamps(${argument});`));
    expect(result.complete).toBe(false); expect(result.operations).toEqual([]);
    expect(result.diagnostics).toHaveLength(1);
  });
  it.each(['nullable()', 'default(null)', 'useCurrent()', 'useCurrentOnUpdate()', 'index()', 'change()'])('rejects chained %s', modifier => {
    const result = analyzeMigration(source(`$table->nullableTimestamps()->${modifier};`));
    expect(result.complete).toBe(false); expect(result.operations).toEqual([]);
  });
  it('does not include the timezone alias without sample evidence', () => {
    expect(analyzeMigration(source('$table->nullableTimestampsTz();')).complete).toBe(false);
  });
  it('matches an independently authored cross-file schema golden', () => {
    const result = analyzeProject([fixture('2026_10_09_000002_add_timestamps.php'), fixture('2026_10_09_000001_create_users.php')]);
    const expected = JSON.parse(readFileSync(new URL('./fixtures/nullable-timestamps/success.golden.json', import.meta.url),'utf8'));
    expect(result.complete).toBe(true); expect(result.finalSchema).toEqual(expected);
    expect(result.migrations[1].diff?.changes.map(change => change.kind)).toEqual(['columnAdded','columnAdded']);
    expect(result.migrations[0].schemaAfter?.tables.users.columns).not.toHaveProperty('created_at');
    expect(result.migrations[1].schemaBefore).toEqual(result.migrations[0].schemaAfter);
  });
  it('rolls back the first added column when the second already exists and blocks the suffix', () => {
    const initial=emptySchema();const original=structuredClone(initial);
    const result=analyzeProject([fixture('2026_10_09_000000_create_collision.php'),fixture('2026_10_09_000002_add_timestamps.php'),fixture('2026_10_09_000003_after.php')],{initialSchema:initial});
    expect(result.migrations.map(step=>step.status)).toEqual(['applied','failed','blocked']);
    expect(result.migrations[1].diagnostics[0].phase).toBe('replay');
    expect(result.lastValidSchema.tables.users.columns).not.toHaveProperty('created_at');
    expect(result.migrations[1].schemaBefore).toEqual(result.lastValidSchema);
    expect(result.migrations[1].schemaAfter).toBeNull();expect(result.migrations[1].diff).toBeNull();
    expect(result.migrations[2].schemaBefore).toBeNull();expect(result.migrations[2].schemaAfter).toBeNull();expect(result.migrations[2].diff).toBeNull();
    expect(result.finalSchema).toBeNull();expect(initial).toEqual(original);
  });
  it('retains data-write rejection even when the timestamp alias is supported', () => {
    const php=`<?php return new class extends Migration { function up() { Schema::create('users',function($t){$t->nullableTimestamps();}); DB::table('users')->insert(['name'=>'admin']); } };`;
    const result=analyzeProject([{filename:'2026_10_09_000001_write.php',source:php}]);
    expect(result.migrations[0].analysis.operations.filter(op=>op.kind==='addColumn')).toHaveLength(2);
    expect(result.migrations[0].diagnostics.map(d=>d.code)).toEqual(['UNSUPPORTED_STATEMENT']);
    expect(result.finalSchema).toBeNull();expect(result.lastValidSchema).toEqual(emptySchema());
  });
});
