import { describe, expect, it } from 'vitest';
import { analyzeProject } from '../../../packages/migration-core/src/index.js';
import { createDrafts, isDraftModified, removeDraft, restoreDraft, updateDraft } from '../src/migration-drafts';

const file = { filename: 'migrations/2026_01_01_000000_create.php', source: '<?php return new class extends Migration {function up(){}};' };

describe('migration input draft baseline', () => {
  it('starts clean and isolates snapshots from imported mutable objects', () => {
    const input = { ...file }; const drafts = createDrafts([input]);
    expect(isDraftModified(drafts[0])).toBe(false);
    input.source = 'external change';
    expect(drafts[0].original.source).toBe(file.source);
    drafts[0].current.source = 'mutable caller';
    expect(drafts[0].original.source).toBe(file.source);
  });
  it('detects edits to source and filename and clears when manually reverted', () => {
    const drafts = createDrafts([file]);
    expect(isDraftModified(updateDraft(drafts, 0, { source: 'changed' })[0])).toBe(true);
    const renamed = updateDraft(drafts, 0, { filename: 'new.php' });
    expect(isDraftModified(renamed[0])).toBe(true);
    expect(isDraftModified(updateDraft(renamed, 0, { filename: file.filename })[0])).toBe(false);
  });
  it('restores both filename and source without mutating other drafts or originals', () => {
    const drafts = createDrafts([file, { ...file, filename: 'other.php' }]);
    const edited = updateDraft(updateDraft(drafts, 0, { filename: 'renamed.php', source: 'changed' }), 1, { source: 'keep' });
    const restored = restoreDraft(edited, 0);
    expect(restored[0].current).toEqual(file);
    expect(isDraftModified(restored[0])).toBe(false);
    expect(restored[1]).toBe(edited[1]);
    expect(isDraftModified(restored[1])).toBe(true);
    expect(edited[0].current.source).toBe('changed');
    expect(drafts[0].original).toEqual(file);
  });
  it('keeps each baseline attached to its draft after deletion shifts indexes', () => {
    const drafts = createDrafts([file, { ...file, filename: 'nested/second.php' }]);
    const edited = updateDraft(drafts, 1, { filename: 'changed.php' });
    const remaining = removeDraft(edited, 0);
    expect(restoreDraft(remaining, 0)[0].current.filename).toBe('nested/second.php');
  });
  it('handles duplicate original filenames without sharing a baseline', () => {
    const drafts = createDrafts([file, { ...file, source: 'second' }]);
    const edited = updateDraft(drafts, 1, { source: 'changed' });
    expect(restoreDraft(edited, 1)[1].current.source).toBe('second');
    expect(edited[0].current.source).toBe(file.source);
  });
  it('creates a new baseline when replacing the project', () => {
    const edited = updateDraft(createDrafts([file]), 0, { source: 'changed' });
    const loaded = createDrafts([{ filename: 'new.php', source: 'new' }]);
    expect(loaded.map(isDraftModified)).toEqual([false]);
    expect(restoreDraft(loaded, 0)[0].current.source).toBe('new');
    expect(edited[0].original.source).toBe(file.source);
  });
  it('preserves empty states and ignores out-of-range operations', () => {
    expect(restoreDraft([], 0)).toEqual([]);
    expect(removeDraft(createDrafts([file]), 0)).toEqual([]);
    const drafts = createDrafts([file]);
    expect(updateDraft(drafts, 10, { source: 'wrong' })).toEqual(drafts);
    expect(restoreDraft(drafts, -1)).toEqual(drafts);
  });
  it('analyzes current input and restores the original core outcome', () => {
    const drafts = createDrafts([file]);
    const edited = updateDraft(drafts, 0, { source: '<?php invalid {' });
    expect(analyzeProject(edited.map(d => d.current)).complete).toBe(false);
    expect(analyzeProject(restoreDraft(edited, 0).map(d => d.current)).complete).toBe(true);
  });
});
