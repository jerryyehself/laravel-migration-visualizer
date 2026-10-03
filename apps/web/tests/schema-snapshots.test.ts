import { describe, expect, it } from 'vitest';
import { analyzeProject } from '../../../packages/migration-core/src/index.js';
import { schemaSnapshotChoices } from '../src/schema-snapshots';
const php = (body: string) => `<?php return new class extends Migration { function up() { ${body} } };`;
const create = { filename: '2026_01_01_000000_create.php', source: php("Schema::create('users', function($t){$t->id();});") };
const update = { filename: '2026_01_02_000000_update.php', source: php("Schema::table('users', function($t){$t->string('name');});") };

describe('schema snapshot choices', () => {
  it('follows core order rather than input order and keeps before/after distinct', () => {
    const result = analyzeProject([update, create]);
    const choices = schemaSnapshotChoices(result);
    expect(choices.map(choice => choice.id)).toEqual(['final', 'initial', 'before-0', 'after-0', 'diff-0', 'before-1', 'after-1', 'diff-1']);
    expect(choices[2].label).toContain(create.filename);
    expect(choices[2].schema!.tables).toEqual({});
    expect(Object.keys(choices[3].schema!.tables.users.columns)).toEqual(['id']);
    expect(Object.keys(choices[6].schema!.tables.users.columns)).toEqual(['id', 'name']);
  });
  it('preserves known empty initial and final states for a zero-file project', () => {
    const choices = schemaSnapshotChoices(analyzeProject([]));
    expect(choices).toHaveLength(2);
    expect(choices.every(choice => choice.schema !== null)).toBe(true);
    expect(choices[0].schema!.tables).toEqual({});
  });
  it('keeps the failed step before available and later snapshots unknown', () => {
    const bad = { ...update, source: php("Schema::table('missing', function($t){$t->string('name');});") };
    const later = { ...update, filename: '2026_01_03_000000_later.php' };
    const result = analyzeProject([later, bad, create]);
    const choices = schemaSnapshotChoices(result);
    expect(choices[0].schema).toBeNull();
    expect(choices[5].schema).toBe(result.migrations[1].schemaBefore);
    expect(choices[5].schema).not.toBeNull();
    expect(choices.slice(6).every(choice => choice.schema === null)).toBe(true);
    expect(choices[6].unavailable).toContain('未成功套用');
    expect(choices[8].unavailable).toContain('前序狀態未知');
  });
  it('does not substitute lastValidSchema after ordering failure', () => {
    const result = analyzeProject([create, create]);
    const choices = schemaSnapshotChoices(result);
    expect(choices[0].schema).toBeNull();
    expect(choices[1].schema).toBe(result.initialSchema);
    expect(choices.slice(2).every(choice => choice.schema === null)).toBe(true);
  });
  it('preserves explicit initialSchema and never mutates analysis during selection', () => {
    const initialSchema = analyzeProject([create]).finalSchema!;
    const result = analyzeProject([update], { initialSchema });
    const before = JSON.stringify(result);
    const choices = schemaSnapshotChoices(result);
    expect(choices[1].schema).toBe(result.initialSchema);
    expect(choices[0].schema).toBe(result.finalSchema);
    expect(JSON.stringify(result)).toBe(before);
  });
});
