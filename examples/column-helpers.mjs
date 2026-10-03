import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeProject, diffSchemas } from '@lmv/migration-core';
const names=['2026_05_01_000000_create_profiles.php','2026_05_02_000000_remove_helpers.php','2026_05_03_000000_rename_status.php'];
const file=filename=>({filename,source:readFileSync(new URL(`../packages/migration-core/tests/fixtures/column-helpers/${filename}`,import.meta.url),'utf8')});
const success=analyzeProject(names.map(file).reverse());
assert.equal(success.complete,true);
assert.equal(success.appliedCount,3);
assert.deepEqual(success.finalSchema.tables.profiles.columns.state.allowedValues,['','active','paused']);
assert.deepEqual(diffSchemas(success.finalSchema,structuredClone(success.finalSchema)).changes,[]);
assert.deepEqual(success.migrations[1].diff.changes.map(c=>c.column),['created_at','remember_token','updated_at']);
const blocked=analyzeProject([file(names[2]),file('2026_05_02_000000_invalid_drop.php'),file(names[0])]);
assert.equal(blocked.appliedCount,1);
assert.equal(blocked.finalSchema,null);
assert.equal(blocked.lastValidSchema.tables.profiles.columns.remember_token.length,100);
assert.equal(blocked.migrations[2].schemaBefore,null);
console.log(JSON.stringify({success,blocked},null,2));
// Built-package regression for the dateTime current-default metadata contract.
const current=analyzeProject([
  {filename:'2026_06_01_000000_events.php',source:"<?php return new class extends Migration { function up() { Schema::create('events',function($t){ $t->dateTime('at')->useCurrent(); }); } };"},
  {filename:'2026_06_02_000000_events.php',source:"<?php return new class extends Migration { function up() { Schema::table('events',function($t){ $t->dateTimeTz('zoned',6)->useCurrent(); }); } };"}
]);
assert.equal(current.complete,true);
assert.equal(current.finalSchema.tables.events.columns.at.useCurrent,true);
assert.equal(current.finalSchema.tables.events.columns.zoned.precision,6);
assert.equal(current.finalSchema.tables.events.columns.zoned.useCurrent,true);
assert.equal(Object.hasOwn(current.finalSchema.tables.events.columns.zoned,'default'),false);
assert.deepEqual(current.migrations[1].diff.changes.map(c=>c.kind),['columnAdded']);
console.log('dateTime/dateTimeTz current-default built-package checks passed');
