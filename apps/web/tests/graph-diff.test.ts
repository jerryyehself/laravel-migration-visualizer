import { describe, expect, it } from 'vitest';
import { analyzeProject, diffSchemas } from '../../../packages/migration-core/src/index.js';
import { graphDiffMarks, memberKey } from '../src/graph-diff';
import { schemaSnapshotChoices } from '../src/schema-snapshots';
const php = (body: string) => `<?php return new class extends Migration { function up() { ${body} } };`;
const project = (first: string, second: string) => analyzeProject([
  { filename: '2026_01_01_000000_first.php', source: php(first) },
  { filename: '2026_01_02_000000_second.php', source: php(second) },
]);
const create = "Schema::create('users', function($t){$t->id();$t->string('old');});";
describe('graph structural diff annotation', () => {
  it('shows removed columns only before and added columns only after', () => {
    const step = project(create, "Schema::table('users', function($t){$t->dropColumn('old');$t->string('new');});").migrations[1];
    const before = graphDiffMarks(step.diff!, 'before'), after = graphDiffMarks(step.diff!, 'after');
    expect(before.columns.get(memberKey('users', 'old'))).toBe('removed');
    expect(before.columns.has(memberKey('users', 'new'))).toBe(false);
    expect(after.columns.get(memberKey('users', 'new'))).toBe('added');
    expect(after.columns.has(memberKey('users', 'old'))).toBe(false);
    expect(after.tables.get('users')).toBe('changed');
  });
  it('preserves whole table additions and removals without inventing column diff entries', () => {
    const step = project(create, "Schema::drop('users');Schema::create('accounts', function($t){$t->id();});").migrations[1];
    expect([...graphDiffMarks(step.diff!, 'before').tables]).toEqual([['users', 'removed']]);
    expect([...graphDiffMarks(step.diff!, 'after').tables]).toEqual([['accounts', 'added']]);
    expect(graphDiffMarks(step.diff!, 'after').columns.size).toBe(0);
  });
  it('marks explicit column property changes on both sides', () => {
    const result = project(create, '');
    const before = result.finalSchema!;
    const after = structuredClone(before); after.tables.users.columns.old.nullable = true;
    const diff = diffSchemas(before, after);
    expect(graphDiffMarks(diff, 'before').columns.get(memberKey('users','old'))).toBe('changed');
    expect(graphDiffMarks(diff, 'after').columns.get(memberKey('users','old'))).toBe('changed');
  });
  it('marks foreign key changes and index-only table changes', () => {
    const result = project(create + "Schema::create('posts', function($t){$t->id();$t->unsignedBigInteger('user_id');});", "Schema::table('posts', function($t){$t->foreign('user_id')->references('id')->on('users');$t->index('user_id');});");
    const marks = graphDiffMarks(result.migrations[1].diff!, 'after');
    expect(marks.edges.get(memberKey('posts','posts_user_id_foreign'))).toBe('added');
    expect(marks.tables.get('posts')).toBe('changed');
    expect(graphDiffMarks(result.migrations[1].diff!, 'before').edges.size).toBe(0);
    const indexOnly = project(create, "Schema::table('users', function($t){$t->index('old');});");
    expect(graphDiffMarks(indexOnly.migrations[1].diff!, 'after').tables.get('users')).toBe('changed');
    expect(graphDiffMarks(indexOnly.migrations[1].diff!, 'before').tables.get('users')).toBe('changed');
  });
  it('marks changed foreign keys on both sides and removed keys only before', () => {
    const result = project(create + "Schema::create('posts', function($t){$t->id();$t->unsignedBigInteger('user_id');$t->foreign('user_id')->references('id')->on('users');});", '');
    const before = result.finalSchema!, after = structuredClone(before);
    after.tables.posts.foreignKeys.posts_user_id_foreign.onDelete = 'cascade';
    const changed = diffSchemas(before, after);
    for (const side of ['before', 'after'] as const) expect(graphDiffMarks(changed, side).edges.get(memberKey('posts','posts_user_id_foreign'))).toBe('changed');
    delete after.tables.posts.foreignKeys.posts_user_id_foreign;
    const removed = diffSchemas(before, after);
    expect(graphDiffMarks(removed, 'before').edges.get(memberKey('posts','posts_user_id_foreign'))).toBe('removed');
    expect(graphDiffMarks(removed, 'after').edges.size).toBe(0);
  });
  it('shows a real column rename as removal and addition without semantic inference', () => {
    const step = project(create, "Schema::table('users', function($t){$t->renameColumn('old','new');});").migrations[1];
    expect(graphDiffMarks(step.diff!, 'before').columns.get(memberKey('users','old'))).toBe('removed');
    expect(graphDiffMarks(step.diff!, 'after').columns.get(memberKey('users','new'))).toBe('added');
  });
  it('treats special identifiers safely and does not mutate diff', () => {
    const diff = { changes: [{ kind: 'columnAdded' as const, table: '__proto__', column: 'constructor', after: { name: 'constructor', type: 'string', nullable: false } }] };
    const original = JSON.stringify(diff); const marks = graphDiffMarks(diff, 'after');
    expect(marks.columns.get(memberKey('__proto__','constructor'))).toBe('added');
    expect(memberKey('a/b','c')).not.toBe(memberKey('a','b/c'));
    expect(JSON.stringify(diff)).toBe(original);
  });
  it('keeps empty diffs empty and failed comparison choices unavailable', () => {
    expect(graphDiffMarks({changes:[]}, 'after').tables.size).toBe(0);
    const result = project(create, "Schema::table('missing', function($t){$t->id();});");
    const choice = schemaSnapshotChoices(result).find(item => item.id === 'diff-1')!;
    expect(choice.schema).toBeNull(); expect(choice.comparison!.diff).toBeNull();
  });
});
