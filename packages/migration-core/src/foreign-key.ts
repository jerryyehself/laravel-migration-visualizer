import type { ForeignKey, Literal, ReferentialAction } from './types.js';

type Call = { name: string; args: (Literal | string[])[] };
const actions = new Set<string>(['cascade', 'restrict', 'set null', 'no action']);
const shortcuts: Record<string, ReferentialAction> = { cascade:'cascade', restrict:'restrict', null:'set null', noAction:'no action' };

/** Apply only ForeignKeyDefinition modifiers, not ColumnDefinition modifiers. */
export function foreignActions(key: ForeignKey, calls: Call[]): void {
  const seen = new Set<string>();
  for (const call of calls) {
    let property: 'onDelete' | 'onUpdate';
    let action: ReferentialAction;
    if (call.name === 'onDelete' || call.name === 'onUpdate') {
      property = call.name;
      if (call.args.length !== 1 || typeof call.args[0] !== 'string' || !actions.has(call.args[0])) throw new Error('Expected a supported referential action.');
      action = call.args[0] as ReferentialAction;
    } else {
      const match = /^(cascade|restrict|null|noAction)On(Delete|Update)$/.exec(call.name);
      if (!match || call.args.length !== 0) throw new Error(`Unsupported foreign key modifier: ${call.name}`);
      property = match[2] === 'Delete' ? 'onDelete' : 'onUpdate';
      action = shortcuts[match[1]];
    }
    if (seen.has(property)) throw new Error(`Repeated foreign key action: ${property}`);
    seen.add(property);
    key[property] = action;
  }
}

// Deliberately bounded: do not pretend to implement Laravel's configurable inflector.
const conventionalTables = new Map(['user', 'post', 'account', 'team', 'role', 'product', 'order', 'comment'].map(noun => [`${noun}_id`, `${noun}s`]));
export function inferReferencedTable(column: string, reference: string): string {
  const table = reference === 'id' ? conventionalTables.get(column) : undefined;
  if (!table) throw new Error('Cannot safely infer referenced table; pass an explicit table to constrained().');
  return table;
}
