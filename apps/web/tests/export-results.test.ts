import { describe, expect, it } from 'vitest';
import { analyzeProject, type MigrationFile } from '../../../packages/migration-core/src/index.js';
import { prepareProjectExport } from '../src/export-results';
const file = (filename: string, body: string): MigrationFile => ({filename, source:`<?php return new class extends Migration { function up() { ${body} } };`});
const first=file('2026_06_01_000000_create.php', "Schema::create('__proto__',function($t){$t->enum('狀態',['','啟用'])->default('')->comment('中文');});");
const second=file('2026_06_02_000000_update.php', "Schema::table('__proto__',function($t){$t->rememberToken();});");
const invalid=file('2026_06_02_000000_invalid.php', "Schema::table('__proto__',function($t){$t->rememberToken();$t->dropColumn('missing');});");

describe('project JSON export contract',()=>{
  it('round-trips all sorted successful analysis, including enum values and prototype-like names',()=>{
    const result=analyzeProject([second,first]),original=structuredClone(result);
    const download=prepareProjectExport(result,'analysis'),parsed=JSON.parse(download.contents);
    expect(download.filename).toBe('migration-project-analysis.json');
    expect(download.mimeType).toBe('application/json;charset=utf-8');
    expect(parsed).toEqual(result);expect(parsed.migrations.map((m: {filename: string})=>m.filename)).toEqual([first.filename,second.filename]);
    expect(parsed.finalSchema.tables.__proto__.columns['狀態'].allowedValues).toEqual(['','啟用']);
    expect(parsed.migrations[0].source).toBeUndefined();
    parsed.finalSchema.tables.__proto__.columns['狀態'].allowedValues.push('changed');
    expect(result).toEqual(original);
  });
  it('exports only the actual final SchemaState on a complete analysis',()=>{
    const result=analyzeProject([first,second]);
    const download=prepareProjectExport(result,'finalSchema');
    expect(download.filename).toBe('migration-final-schema.json');
    expect(JSON.parse(download.contents)).toEqual(result.finalSchema);
    expect(Object.keys(JSON.parse(download.contents))).toEqual(['tables']);
  });
  it('preserves failed/blocked unknown snapshots and the successful prefix',()=>{
    const result=analyzeProject([second,invalid,first]);
    const parsed=JSON.parse(prepareProjectExport(result,'analysis').contents);
    expect(parsed).toEqual(result);expect(parsed.complete).toBe(false);
    expect(parsed.finalSchema).toBeNull();expect(parsed.appliedCount).toBe(1);
    expect(parsed.migrations[1].schemaBefore).toEqual(parsed.lastValidSchema);
    expect(parsed.migrations[1].schemaAfter).toBeNull();expect(parsed.migrations[1].diff).toBeNull();
    expect(parsed.migrations[2].schemaBefore).toBeNull();expect(parsed.migrations[2].schemaAfter).toBeNull();
    expect(parsed.lastValidSchema.tables.__proto__.columns.remember_token).toBeUndefined();
    expect(()=>prepareProjectExport(result,'finalSchema')).toThrow('沒有可信的最終 Schema');
  });
  it('retains ordering diagnostics and prevents final-schema export before any replay',()=>{
    const result=analyzeProject([first,{...first,source:'<?php'}]);
    const parsed=JSON.parse(prepareProjectExport(result,'analysis').contents);
    expect(parsed).toEqual(result);expect(parsed.diagnostics[0].phase).toBe('ordering');
    expect(parsed.appliedCount).toBe(0);expect(parsed.finalSchema).toBeNull();
    expect(()=>prepareProjectExport(result,'finalSchema')).toThrow('分析未完成');
  });
  it('distinguishes a valid empty final schema from unknown schema',()=>{
    const result=analyzeProject([]);
    expect(JSON.parse(prepareProjectExport(result,'finalSchema').contents)).toEqual({tables:{}});
  });
  it('rejects a missing final schema even if a caller claims completion',()=>{
    const result={...analyzeProject([]),finalSchema:null};
    expect(()=>prepareProjectExport(result,'finalSchema')).toThrow('沒有可信的最終 Schema');
  });
});
