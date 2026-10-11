import { describe,it,expect } from 'vitest';
import { analyzeProject } from '../../../packages/migration-core/src/index.js';
import { analysisLayout, resetVisibleView, objectInView } from '../src/reading-view';
import { initialGraphView } from '../src/comparison-layout';
const f=(n:number,body:string)=>({filename:`2026_10_11_00000${n}_case.php`,source:`<?php return new class extends Migration {function up(){${body}}};`});
describe('analysis-scoped view geometry',()=>{
 it('keeps only names and maximum visual heights, never schema members',()=>{const r=analyzeProject([f(1,"Schema::create('t',function($t){$t->string('a');});"),f(2,"Schema::table('t',function($t){$t->string('b');});"),f(3,"Schema::drop('t');")]);const saved=JSON.stringify(r),layout=analysisLayout(r);expect([...layout.positions.keys()]).toEqual(['t']);expect('tables' in layout).toBe(false);expect(JSON.stringify(r)).toBe(saved);});
 it('fits only current visible nodes and preserves absent-name manual positions',()=>{const r=analyzeProject([f(1,"Schema::create('a',function($t){$t->string('x');});Schema::create('b',function($t){$t->string('x');});Schema::create('c',function($t){$t->string('x');});"),f(2,"Schema::drop('a');Schema::drop('b');")]);const layout=analysisLayout(r),view=initialGraphView(layout);view.positions.set('a',{x:999,y:999});view.positions.set('c',{x:888,y:888});const reset=resetVisibleView(layout,[r.finalSchema],view);expect(reset.positions.get('a')).toEqual({x:999,y:999});expect(reset.positions.has('c')).toBe(false);expect(reset.zoom).toBe(1);expect(reset.pan.y).toBeLessThan(0);expect(objectInView(r.finalSchema,{table:'c'},layout,reset)).toBe(true);});
 it('does not draw or focus missing/unknown targets',()=>{const r=analyzeProject([f(1,"Schema::create('t',function($t){$t->string('x');});")]),layout=analysisLayout(r),view=resetVisibleView(layout,[r.finalSchema]);expect(objectInView(null,{table:'t'},layout,view)).toBe(false);expect(objectInView(r.finalSchema,{table:'t',column:'missing'},layout,view)).toBe(false);expect(resetVisibleView(layout,[null]).positions.size).toBe(0);});
 it('keeps special names safe and identifies off-screen objects',()=>{const r=analyzeProject([f(1,"Schema::create('__proto__',function($t){$t->string('constructor');});")]),layout=analysisLayout(r),view=resetVisibleView(layout,[r.finalSchema]);expect(objectInView(r.finalSchema,{table:'__proto__',column:'constructor'},layout,view)).toBe(true);expect(objectInView(r.finalSchema,{table:'__proto__'},layout,{...view,pan:{x:-5000,y:0}})).toBe(false);});
});

describe('same-name geometry is not schema identity',()=>{
 it('uses one name slot for drop/recreate while keeping each schema its own columns',()=>{
  const r=analyzeProject([f(1,"Schema::create('t',function($t){$t->string('old');});"),f(2,"Schema::drop('t');"),f(3,"Schema::create('t',function($t){$t->integer('new');});")]);
  const layout=analysisLayout(r);expect(layout.positions.size).toBe(1);expect(Object.keys(r.migrations[0].schemaAfter!.tables.t.columns)).toEqual(['old']);expect(Object.keys(r.migrations[2].schemaAfter!.tables.t.columns)).toEqual(['new']);expect(Object.keys(r.migrations[1].schemaAfter!.tables)).toEqual([]);
 });
});
