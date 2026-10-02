import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeMigration, analyzeProject, applyOperations, diffSchemas, emptySchema, type MigrationFile } from '../src/index.js';
const wrap = (body: string) => `<?php return new class extends Migration { function up() { Schema::create('profiles',function($t){${body}}); } };`;
const analyze = (body: string) => analyzeMigration(wrap(body));
const replay = (body: string) => {
  const result=analyze(body); expect(result.diagnostics).toEqual([]);
  return applyOperations(emptySchema(),result.operations);
};
const read = (name: string) => readFileSync(new URL(`./fixtures/column-helpers/${name}`,import.meta.url),'utf8');
const names=['2026_05_01_000000_create_profiles.php','2026_05_02_000000_remove_helpers.php','2026_05_03_000000_rename_status.php'];
const fixture=(filename: string): MigrationFile=>({filename,source:read(filename)});

describe('column helper normalization',()=>{
  it('keeps enum value order, empty string values and scalar defaults',()=>{
    const state=replay("$t->enum('status',['', 'active', 'paused'])->default('')->nullable()->index();");
    expect(state.tables.profiles.columns.status).toEqual({name:'status',type:'enum',nullable:true,allowedValues:['','active','paused'],default:''});
    expect(state.tables.profiles.indexes.profiles_status_index.columns).toEqual(['status']);
  });
  it('expands rememberToken and allows single-column modifiers',()=>{
    expect(replay('$t->rememberToken()->nullable(false)->unique();').tables.profiles.columns.remember_token).toEqual({name:'remember_token',type:'string',length:100,nullable:false});
  });
  it.each(['softDeletes','softDeletesTz'])('expands %s with default and custom names/precision',method=>{
    const state=replay(`$t->${method}(); $t->${method}('archived_at',3)->nullable(false);`);
    const type=method.endsWith('Tz')?'timestampTz':'timestamp';
    expect(state.tables.profiles.columns.deleted_at).toEqual({name:'deleted_at',type,nullable:true,precision:0});
    expect(state.tables.profiles.columns.archived_at).toEqual({name:'archived_at',type,nullable:false,precision:3});
  });
  it.each(['timestampTz','dateTimeTz','timeTz'])('retains the timezone type %s',method=>{
    expect(replay(`$t->${method}('time',6);`).tables.profiles.columns.time).toEqual({name:'time',type:method,nullable:false,precision:6});
  });
  it('expands timestampsTz with the same source for both operations',()=>{
    const result=analyze('$t->timestampsTz(3);');
    expect(result.operations.slice(1)).toMatchObject([{kind:'addColumn',column:{name:'created_at',type:'timestampTz',nullable:true,precision:3}},{kind:'addColumn',column:{name:'updated_at',type:'timestampTz',nullable:true,precision:3}}]);
    expect(result.operations[1].source).toEqual(result.operations[2].source);
    expect(replay('$t->timestampsTz();').tables.profiles.columns.created_at.precision).toBe(0);
  });
  it.each([
    "$t->enum('status',[]);", "$t->enum('status',['a','a']);", "$t->enum('status',[1]);", "$t->enum('status',['a'=> 'b']);", "$t->enum('status',[...$values]);",
    "$t->enum('status',$values);", "$t->enum('status',[Status::Active]);", "$t->enum('status');", "$t->enum('status',['a'],true);", "$t->enum('status',['a'])->change();",
    "$t->rememberToken('custom');", "$t->softDeletes(null);", "$t->softDeletes('x',null);", "$t->softDeletesTz('x',-1);", "$t->timestampsTz(null);", "$t->timestampsTz()->nullable();", "$t->timestampsTz()->index();",
    "$t->dropTimestamps(1);", "$t->dropRememberToken('x');", "$t->dropSoftDeletes(null);", "$t->dropSoftDeletesTz('x',3);", "$t->dropTimestampsTz()->nullable();",
  ])('rejects unsupported calls atomically: %s',body=>{
    const result=analyze(body);expect(result.complete).toBe(false);
    expect(result.operations.map(op=>op.kind)).toEqual(['createTable']);
    expect(result.diagnostics[0].code).toBe('UNSUPPORTED_BLUEPRINT');
  });
  it('still rejects empty index identifiers after accepting empty enum values',()=>{
    expect(analyze("$t->index(['']);").complete).toBe(false);
    expect(analyze("$t->enum('status',[''])->index();").complete).toBe(true);
  });
  it.each(['dropTimestamps','dropTimestampsTz'])('expands %s into guarded dropColumn operations',method=>{
    const source=`<?php return new class extends Migration { function up() { Schema::table('profiles',function($t){$t->${method}();}); } };`;
    const result=analyzeMigration(source);
    expect(result.operations).toMatchObject([{kind:'dropColumn',column:'created_at'},{kind:'dropColumn',column:'updated_at'}]);
    const initial=replay('$t->timestampsTz();');expect(applyOperations(initial,result.operations).tables.profiles.columns).toEqual({});
  });
  it.each(['dropSoftDeletes','dropSoftDeletesTz'])('supports %s with custom/default column names',method=>{
    const initial=replay("$t->softDeletes(); $t->softDeletesTz('archived_at'); $t->rememberToken();");
    const source=`<?php return new class extends Migration { function up() { Schema::table('profiles',function($t){$t->${method}(); $t->${method}('archived_at'); $t->dropRememberToken();}); } };`;
    const result=analyzeMigration(source);expect(result.complete).toBe(true);
    expect(applyOperations(initial,result.operations).tables.profiles.columns).toEqual({});
    expect(Object.keys(initial.tables.profiles.columns)).toHaveLength(3);
  });
});

describe('enum snapshot and structural diff',()=>{
  it('compares detached value arrays by contents rather than identity',()=>{
    const before=replay("$t->enum('status',['a','b']);");
    expect(diffSchemas(before,structuredClone(before)).changes).toEqual([]);
  });
  it.each([{values:['b','a']},{values:['a','c']},{values:['a']}])('reports ordered enum value changes: $values',({values})=>{
    const before=replay("$t->enum('status',['a','b']);"),after=structuredClone(before);
    after.tables.profiles.columns.status.allowedValues=values;
    const diff=diffSchemas(before,after);expect(diff.changes).toHaveLength(1);
    const change=diff.changes[0];if(change.kind!=='columnChanged') throw Error('Expected columnChanged');
    expect(change.after.allowedValues).toEqual(values);
    change.after.allowedValues!.push('detached');expect(after.tables.profiles.columns.status.allowedValues).toEqual(values);
  });
  it('retains optional property presence and detached operations/snapshots',()=>{
    const result=analyze("$t->enum('status',['a']);"),before=applyOperations(emptySchema(),result.operations);
    const after=structuredClone(before);delete after.tables.profiles.columns.status.allowedValues;
    expect(diffSchemas(before,after).changes[0].kind).toBe('columnChanged');
    const op=result.operations[1];if(op.kind!=='addColumn') throw Error('Expected addColumn');
    op.column.allowedValues!.push('changed');expect(before.tables.profiles.columns.status.allowedValues).toEqual(['a']);
  });
  it('rolls back both timestamp drops when the second column is absent',()=>{
    const initial=replay("$t->timestampTz('created_at');"),original=structuredClone(initial);
    const result=analyzeMigration("<?php return new class extends Migration { function up() { Schema::table('profiles',function($t){$t->dropTimestampsTz();}); } };");
    expect(()=>applyOperations(initial,result.operations)).toThrow('Unknown column');expect(initial).toEqual(original);
  });
  it('drop helpers cannot bypass index or foreign-key protection',()=>{
    const initial=replay('$t->rememberToken()->index();');
    const result=analyzeMigration("<?php return new class extends Migration { function up() { Schema::table('profiles',function($t){$t->dropRememberToken();}); } };");
    expect(()=>applyOperations(initial,result.operations)).toThrow('Drop indexes');
    const linked=replay("$t->softDeletes(); $t->timestamp('reference'); $t->foreign('reference')->references('deleted_at')->on('profiles');");
    const drop=analyzeMigration("<?php return new class extends Migration { function up() { Schema::table('profiles',function($t){$t->dropSoftDeletes();}); } };");
    expect(()=>applyOperations(linked,drop.operations)).toThrow('foreign key');
  });
});
function summary(files: MigrationFile[]) {
  const result=analyzeProject(files);
  return {complete:result.complete,appliedCount:result.appliedCount,
    diagnostics:result.diagnostics.map(d=>({code:d.code,phase:d.phase,file:d.source.file,...(d.operationIndex!==undefined?{operationIndex:d.operationIndex}:{})})),
    migrations:result.migrations.map(m=>({filename:m.filename,status:m.status,before:m.schemaBefore,after:m.schemaAfter,changes:m.diff===null?null:m.diff.changes.map(c=>`${c.kind}:${'column' in c?c.column:c.table}`)})),final:result.finalSchema,lastValid:result.lastValidSchema};
}
describe('column helpers project goldens',()=>{
  it('matches ordered helper creation/removal/rename with full schemas',()=>expect(summary(names.map(fixture).reverse())).toEqual(JSON.parse(read('success.golden.json'))));
  it('rolls back a partial helper removal and blocks subsequent snapshots',()=>{
    const files=[fixture(names[2]),fixture('2026_05_02_000000_invalid_drop.php'),fixture(names[0])];
    expect(summary(files)).toEqual(JSON.parse(read('blocked.golden.json')));
    const result=analyzeProject(files);expect(result.migrations[2].analysis.complete).toBe(true);
    result.migrations[0].schemaAfter!.tables.profiles.columns.status.allowedValues!.push('mutated');
    expect(result.lastValidSchema.tables.profiles.columns.status.allowedValues).toEqual(['','active','paused']);
  });
});
