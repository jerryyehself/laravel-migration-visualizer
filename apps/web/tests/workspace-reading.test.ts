import { describe, expect, it } from 'vitest';
import { analyzeProject } from '../../../packages/migration-core/src/index.js';
import { workspaceReading } from '../src/workspace-reading';
const file = (n:number,body:string) => ({ filename:`2026_10_10_00000${n}_read.php`,source:`<?php return new class extends Migration { function up(){${body}}};` });
const result = analyzeProject([file(3,"Schema::drop('later');"),file(1,"Schema::create('t',function($t){$t->string('a');});"),file(2,"Schema::drop('missing');")]);
describe('workspace reading location', () => {
  it('uses original sorted positions and does not skip failed or blocked steps', () => {
    const first=workspaceReading(result,{kind:'migration',index:0,side:'after'});
    expect(first).toMatchObject({index:0,previous:null,next:1});
    expect(first.step?.filename).toBe(file(1,'').filename);
    expect(workspaceReading(result,{kind:'migration',index:1,side:'after'})).toMatchObject({previous:0,next:2,step:{status:'failed'}});
    expect(workspaceReading(result,{kind:'migration',index:2,side:'before'})).toMatchObject({previous:1,next:null,step:{status:'blocked'}});
  });
  it('reads own sides without substituting a valid prefix', () => {
    expect(workspaceReading(result,{kind:'migration',index:1,side:'before'}).choice.schema).toBe(result.migrations[1].schemaBefore);
    for(const side of ['after','diff'] as const) expect(workspaceReading(result,{kind:'migration',index:1,side}).choice.schema).toBeNull();
    expect(workspaceReading(result,{kind:'final'}).choice.schema).toBeNull();
    expect(workspaceReading(result,{kind:'initial'}).choice.schema).toBe(result.initialSchema);
  });
  it('keeps known empty and no-op comparison distinct from unknown', () => {
    const noop=analyzeProject([file(1,"Schema::dropIfExists('missing');")]);
    expect(workspaceReading(noop,{kind:'migration',index:0,side:'diff'}).choice.comparison?.diff).toEqual({changes:[]});
    expect(workspaceReading(noop,{kind:'final'}).choice.schema).toEqual({tables:{}});
  });
  it('handles zero files and invalid positions without inventing a migration', () => {
    const empty=analyzeProject([]);
    for(const index of [-1,0,999,NaN,0.5]) expect(workspaceReading(empty,{kind:'migration',index,side:'after'})).toMatchObject({index:null,step:null,previous:null,next:null});
  });
  it('ordering failure remains unknown and a source lookup cannot mutate location', () => {
    const ordering=analyzeProject([{filename:'bad.php',source:'<?php'}]);
    const original=JSON.stringify(ordering);
    expect(workspaceReading(ordering,{kind:'final'}).choice.schema).toBeNull();
    expect(JSON.stringify(ordering)).toBe(original);
  });
});
