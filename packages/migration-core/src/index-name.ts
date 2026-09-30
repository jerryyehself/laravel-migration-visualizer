import type { IndexType } from './types.js';
/** Laravel Blueprint convention without connection prefix_indexes or DB naming rules. */
export function indexName(table: string, columns: readonly string[], type: IndexType | 'foreign'): string {
  return `${table}_${columns.join('_')}_${type}`.replace(/[A-Z]/g, letter => letter.toLowerCase()).replace(/[-.]/g, '_');
}
