import assert from 'node:assert/strict';
import { readdirSync,readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { analyzeProject } from '@lmv/migration-core';
const root=new URL('../packages/migration-core/tests/fixtures/commerce/',import.meta.url);
const files=readdirSync(root).filter(n=>n.endsWith('.php')).map(filename=>({filename,source:readFileSync(new URL(filename,root),'utf8')}));
const r=analyzeProject([...files].reverse());assert.equal(r.complete,true);assert.deepEqual(r.finalSchema,JSON.parse(readFileSync(new URL('final.golden.json',root),'utf8')));
const failing=structuredClone(files);failing[9].source=failing[9].source.replace("$t->dropMorphs('attachable');","$t->dropMorphs('attachable'); $t->dropColumn('missing');");
const bad=analyzeProject(failing);assert.equal(bad.finalSchema,null);assert.equal(bad.appliedCount,9);assert.deepEqual(bad.migrations.slice(9).map(m=>m.status),['failed','blocked','blocked']);
const observations=[];
for(const count of [250,1000]){
 const input=Array.from({length:count},(_,i)=>({filename:`2026_10_04_${String(i).padStart(6,'0')}_scale.php`,source:`<?php return new class extends Migration { function up() { Schema::create('t${i}',function($t){$t->string('value');}); } };`}));
 const start=performance.now(),result=analyzeProject(input.reverse());assert.equal(result.complete,true);assert.equal(result.appliedCount,count);
 observations.push({files:count,elapsedMs:Math.round(performance.now()-start),rssMiB:Math.round(process.memoryUsage().rss/1024/1024)});
}
console.log(JSON.stringify({node:process.version,platform:process.platform,arch:process.arch,commerce:{migrations:r.appliedCount,tables:Object.keys(r.finalSchema.tables).length},failedPrefix:bad.appliedCount,observations,note:'One-run local observations, not a latency or memory guarantee.'},null,2));
