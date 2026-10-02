import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeProject } from '@lmv/migration-core';

// File IO stays in the caller. Import the public, built package rather than src.
const names = ['2026_04_01_000000_create_tables.php', '2026_04_02_000000_rename_tables.php', '2026_04_03_000000_drop_articles.php', '2026_04_04_000000_drop_members.php'];
const file = filename => ({ filename, source:readFileSync(new URL(`../packages/migration-core/tests/fixtures/table-lifecycle/${filename}`,import.meta.url),'utf8') });
const success=analyzeProject(names.map(file).reverse());
assert.equal(success.complete,true);
assert.equal(success.appliedCount,4);
assert.deepEqual(success.finalSchema,{tables:{}});
assert.equal(success.migrations[1].schemaAfter.tables.articles.foreignKeys.posts_user_id_foreign.referencedTable,'members');
const blocked=analyzeProject([file(names[3]),file('2026_04_03_000000_invalid_drop.php'),file(names[0]),file(names[1])]);
assert.equal(blocked.appliedCount,2);
assert.equal(blocked.finalSchema,null);
assert.deepEqual(blocked.lastValidSchema,blocked.migrations[1].schemaAfter);
assert.equal(blocked.migrations[3].schemaBefore,null);
console.log(JSON.stringify({success,blocked},null,2));
