import { describe, expect, it } from 'vitest';
import { analyzeProject } from '../../../packages/migration-core/src/index.js';
import { operationSources } from '../src/operation-sources';
const file=(order:number,body:string)=>({filename:`2026_10_09_${String(order).padStart(6,'0')}_source.php`,source:`<?php return new class extends Migration {function up(){${body}}};`});
describe('literal operation source query',()=>{
  it('finds declarations, indexes and explicit foreign-key targets without mutation',()=>{
    const r=analyzeProject([file(1,"Schema::create('users',function($t){$t->id();}); Schema::create('posts',function($t){$t->integer('author');$t->index('author');$t->foreign('author')->references('id')->on('users');});")]);
    const original=JSON.stringify(r);
    expect(operationSources(r,{table:'users',column:'id'}).map(h=>h.operation.kind)).toEqual(['addColumn','addForeignKey']);
    expect(operationSources(r,{table:'posts',column:'author'}).map(h=>h.operation.kind)).toEqual(['addColumn','addIndex','addForeignKey']);
    expect(operationSources(r,{table:'users'}).at(-1)?.operation.kind).toBe('addForeignKey');
    expect(JSON.stringify(r)).toBe(original);
  });
  it('keeps delete/recreate and rename names separate without following identity',()=>{
    const r=analyzeProject([file(1,"Schema::create('t',function($t){$t->string('a');});"),file(2,"Schema::table('t',function($t){$t->renameColumn('a','b');});Schema::rename('t','other');"),file(3,"Schema::drop('other');Schema::create('t',function($t){$t->string('a');});")]);
    expect(operationSources(r,{table:'t',column:'a'}).map(h=>[h.migrationIndex,h.operation.kind])).toEqual([[0,'addColumn'],[1,'renameColumn'],[2,'addColumn']]);
    expect(operationSources(r,{table:'other'}).map(h=>h.operation.kind)).toEqual(['renameTable','dropTable']);
    expect(operationSources(r,{table:'other',column:'b'})).toEqual([]);
  });
  it('retains failed and blocked syntactic operations without labeling them applied',()=>{
    const r=analyzeProject([file(1,"Schema::create('t',function($t){$t->integer('a');});"),file(2,"Schema::table('t',function($t){$t->string('a');});"),file(3,"Schema::table('t',function($t){$t->integer('a')->change();});")]);
    expect(operationSources(r,{table:'t',column:'a'}).map(h=>h.status)).toEqual(['applied','failed','blocked']);
  });
  it('does not infer columns for dropped constraints or table-level operations',()=>{
    const r=analyzeProject([file(1,"Schema::create('t',function($t){$t->string('a');$t->index('a');});"),file(2,"Schema::table('t',function($t){$t->dropIndex('t_a_index');$t->dropColumn('a');});Schema::drop('t');")]);
    expect(operationSources(r,{table:'t',column:'a'}).map(h=>h.operation.kind)).toEqual(['addColumn','addIndex','dropColumn']);
  });
  it('matches hostile identifiers literally, preserving source order and indexes',()=>{
    const r=analyzeProject([file(1,"Schema::create('__proto__',function($t){$t->string('constructor');});")]);
    const hits=operationSources(r,{table:'__proto__',column:'constructor'});
    expect(hits).toHaveLength(1);expect(hits[0].operationIndex).toBe(1);expect(hits[0].source?.file).toBe(r.migrations[0].filename);
    expect(operationSources(r,{table:'__proto__',column:'CONSTRUCTOR'})).toEqual([]);
  });
});

it('returns both composite FK column positions and only one self-reference hit',()=>{
  const r=analyzeProject([file(1,"Schema::create('t',function($t){$t->integer('a');$t->integer('b');$t->primary(['a','b']);$t->foreign(['a','b'])->references(['a','b'])->on('t');});")]);
  expect(operationSources(r,{table:'t',column:'b'}).map(h=>h.operation.kind)).toEqual(['addColumn','addIndex','addForeignKey']);
  expect(operationSources(r,{table:'t'}).filter(h=>h.operation.kind==='addForeignKey')).toHaveLength(1);
});
it('does not manufacture a source when it is missing from externally supplied analysis',()=>{
  const r=analyzeProject([file(1,"Schema::create('t',function($t){});")]);
  Object.assign(r.migrations[0].analysis.operations[0],{source:undefined});
  expect(operationSources(r,{table:'t'})[0].source).toBeNull();
});
it('does not infer dropped foreign-key columns from a prior snapshot',()=>{
  const r=analyzeProject([file(1,"Schema::create('users',function($t){$t->id();});Schema::create('posts',function($t){$t->integer('author');$t->foreign('author')->references('id')->on('users');});"),file(2,"Schema::table('posts',function($t){$t->dropForeign('posts_author_foreign');});")]);
  expect(operationSources(r,{table:'posts',column:'author'}).map(h=>h.operation.kind)).toEqual(['addColumn','addForeignKey']);
  expect(operationSources(r,{table:'posts'}).at(-1)?.operation.kind).toBe('dropForeignKey');
});
