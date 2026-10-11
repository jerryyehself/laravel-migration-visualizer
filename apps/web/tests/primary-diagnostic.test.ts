import { describe, expect, it } from 'vitest';
import { analyzeProject } from '../../../packages/migration-core/src/index.js';
import { primaryDiagnostic } from '../src/primary-diagnostic';
const file=(n:number,body:string)=>({filename:`2026_10_11_00000${n}_read.php`,source:`<?php return new class extends Migration {function up(){${body}}};`});
describe('primary reading problem',()=>{
 it('ordering errors take priority before replay begins',()=>{
  const result=analyzeProject([{filename:'bad.php',source:'<?php'}]);
  expect(primaryDiagnostic(result)?.phase).toBe('ordering');
 });
 it('shows first failed cause, never a later dependency warning',()=>{
  const result=analyzeProject([file(1,"Schema::drop('missing');"),file(2,"Schema::drop('other');")]);
  const original=JSON.stringify(result);
  expect(primaryDiagnostic(result)).toBe(result.migrations[0].diagnostics.find(item=>item.phase==='replay'));
  expect(JSON.stringify(result)).toBe(original);
 });
 it('keeps successful empty/no-op analysis free of invented problems',()=>{
  expect(primaryDiagnostic(analyzeProject([]))).toBeNull();
  expect(primaryDiagnostic(analyzeProject([file(1,"Schema::dropIfExists('missing');")]))).toBeNull();
 });
});
