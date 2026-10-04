import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyzeProject } from '../../../packages/migration-core/src/index.js';
import { readMigrationFiles } from '../src/import-files';
import { prepareProjectExport } from '../src/export-results';
import { schemaSnapshotChoices } from '../src/schema-snapshots';
import { schemaGraph } from '../src/schema-graph';
import { createDrafts, updateDraft, restoreDraft } from '../src/migration-drafts';

const corpus = new URL('../../../packages/migration-core/tests/fixtures/commerce/', import.meta.url);
async function imported() {
  return readMigrationFiles(readdirSync(corpus).filter(name => name.endsWith('.php')).reverse().map(name => ({
    name, arrayBuffer: async () => new TextEncoder().encode(readFileSync(new URL(name, corpus), 'utf8')).buffer as ArrayBuffer,
  })));
}
describe('project acceptance across web IO and core', () => {
  it('imports 12 files, selects authoritative snapshots and exports the independent final golden', async () => {
    const result = analyzeProject(await imported());
    const golden = JSON.parse(readFileSync(new URL('final.golden.json', corpus), 'utf8'));
    expect(result.complete).toBe(true);
    expect(JSON.parse(prepareProjectExport(result, 'finalSchema').contents)).toEqual(golden);
    const final = schemaSnapshotChoices(result)[0];
    expect(final.schema).toBe(result.finalSchema);
    expect(schemaGraph(final.schema!).nodes.map(node => node.name)).toEqual(['attachments', 'order_items', 'orders', 'products', 'users']);
    expect(schemaGraph(final.schema!).edges.map(edge => [edge.from, edge.to])).toEqual([
      ['order_items', 'orders'], ['order_items', 'products'], ['orders', 'users'],
    ]);
  });
  it('compares price replacement on its own sides and preserves explicit zero in JSON', async () => {
    const result = analyzeProject(await imported());
    const step = schemaSnapshotChoices(result).find(choice => choice.id === 'diff-6')!.comparison!;
    expect(step.schemaBefore!.tables.products.columns.price.precision).toBe(8);
    expect(step.schemaAfter!.tables.products.columns.price).toMatchObject({ precision: 10, nullable: true, default: 0 });
    expect(JSON.parse(prepareProjectExport(result, 'analysis').contents).migrations[6].schemaAfter.tables.products.columns.price.default).toBe(0);
  });
  it('edit failure keeps final unknown; restore recovers original corpus without changing it', async () => {
    const files = await imported();
    const original = JSON.stringify(files);
    let drafts = createDrafts(files);
    const index = files.findIndex(file => file.filename.includes('000010'));
    drafts = updateDraft(drafts, index, { source: files[index].source.replace('$t->dropMorphs', '$t->unsupportedHelper') });
    const failed = analyzeProject(drafts.map(draft => draft.current));
    expect(failed.appliedCount).toBe(9);
    expect(schemaSnapshotChoices(failed)[0].schema).toBeNull();
    expect(schemaSnapshotChoices(failed).find(choice => choice.id === 'diff-9')!.schema).toBeNull();
    expect(() => prepareProjectExport(failed, 'finalSchema')).toThrow();
    expect(JSON.parse(prepareProjectExport(failed, 'analysis').contents).finalSchema).toBeNull();
    drafts = restoreDraft(drafts, index);
    expect(analyzeProject(drafts.map(draft => draft.current)).complete).toBe(true);
    expect(JSON.stringify(files)).toBe(original);
  });
});
