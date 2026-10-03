import { indexName } from './index-name.js';
import { foreignActions, inferReferencedTable } from './foreign-key.js';
import { parseMigration } from './parser.js';
import type { AnalysisResult, AtomicOperation, Column, ForeignKey, Literal, SourceLocation, IndexType } from './types.js';
// php-parser's heterogeneous AST stays private to this adapter, never in the public model.
type Node = { kind: string; [key: string]: any };
const facade = 'Illuminate\\Support\\Facades\\Schema';
const migration = 'Illuminate\\Database\\Migrations\\Migration';
const clean = (name: string) => name.replace(/^\\/, '');
function literal(node: Node): Literal {
  if (node?.kind === 'string' || node?.kind === 'boolean') return node.value;
  if (node?.kind === 'nullkeyword') return null;
  if (node?.kind === 'number') {
    const raw = node.value.replace(/_/g, '');
    // PHP legacy octal (010) differs from JavaScript Number('010'). Do not guess.
    if (!/^(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][+-]?[0-9]+)?$/.test(raw) && !/^\.[0-9]+(?:[eE][+-]?[0-9]+)?$/.test(raw)) throw new Error('Only decimal numeric literals are supported.');
    const value = Number(raw);
    if (Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER) return value;
  }
  if (node?.kind === 'unary' && ['-', '+'].includes(node.type)) {
    const value = literal(node.what);
    if (typeof value === 'number') return node.type === '-' ? -value : value;
  }
  throw new Error('Expected a static scalar literal; expressions are not evaluated.');
}
type Argument = Literal | string[];
function argument(node: Node): Argument {
  if (node?.kind !== 'array') return literal(node);
  return node.items.map((item: Node) => {
    if (!item || item.key !== null || item.unpack || item.byRef) throw new Error('Expected an unkeyed static string array.');
    const value = literal(item.value);
    if (typeof value !== 'string') throw new Error('Expected a static string array.');
    return value;
  });
}
function text(value: Argument | undefined): string {
  if (typeof value !== 'string' || !value.length) throw new Error('Expected a non-empty string.');
  return value;
}
function integer(value: Argument | undefined, fallback: number, minimum = 0): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < minimum) throw new Error('Expected a valid integer argument.');
  return value;
}
function arity(args: unknown[], min: number, max = min) {
  if (args.length < min || args.length > max) throw new Error(`Expected ${min}–${max} arguments, received ${args.length}.`);
}
interface Call { name: string; args: Argument[] }
function chain(node: Node, receiver: string): Call[] {
  if (node?.kind === 'variable' && node.name === receiver) return [];
  if (node?.kind !== 'call' || node.what.kind !== 'propertylookup' || node.what.offset.kind !== 'identifier') throw new Error('Expected a direct Blueprint method chain.');
  return [...chain(node.what.what, receiver), { name: node.what.offset.name, args: node.arguments.map(argument) }];
}
const simpleTypes = new Set(['text', 'longText', 'mediumText', 'boolean', 'date', 'json', 'jsonb', 'uuid']);
const integerTypes = new Set(['integer', 'bigInteger', 'smallInteger', 'tinyInteger', 'mediumInteger', 'unsignedInteger', 'unsignedBigInteger', 'unsignedSmallInteger', 'unsignedTinyInteger', 'unsignedMediumInteger']);
function columns(call: Call): Column[] {
  const { name: method, args } = call;
  if (method === 'timestamps' || method === 'timestampsTz') {
    arity(args, 0, 1);
    return ['created_at', 'updated_at'].map(name => ({ name, type: method === 'timestampsTz' ? 'timestampTz' : 'timestamp', nullable: true, precision: integer(args[0], 0) }));
  }
  if (method === 'id' || method === 'increments' || method === 'bigIncrements') {
    arity(args, method === 'id' ? 0 : 1, 1);
    return [{ name: text(args[0] === undefined ? 'id' : args[0]), type: method === 'increments' ? 'integer' : 'bigInteger', nullable: false, unsigned: true, autoIncrement: true, primary: true }];
  }
  if (method === 'rememberToken') {
    arity(args, 0);
    return [{ name:'remember_token', type:'string', length:100, nullable:true }];
  }
  if (method === 'softDeletes' || method === 'softDeletesTz') {
    arity(args, 0, 2);
    return [{ name:text(args[0] === undefined ? 'deleted_at' : args[0]), type:method === 'softDeletesTz' ? 'timestampTz' : 'timestamp', nullable:true, precision:integer(args[1],0) }];
  }
  const name = text(args[0]);
  if (method === 'enum') {
    arity(args, 2);
    const allowedValues = args[1];
    if (!Array.isArray(allowedValues) || !allowedValues.length || new Set(allowedValues).size !== allowedValues.length) throw new Error('enum requires a non-empty array of distinct static strings.');
    return [{ name, type:'enum', nullable:false, allowedValues:[...allowedValues] }];
  }
  if (method === 'foreignId') {
    arity(args, 1);
    return [{ name, type:'bigInteger', nullable:false, unsigned:true, autoIncrement:false }];
  }
  if (method === 'string' || method === 'char') {
    arity(args, 1, 2);
    return [{ name, type: method, nullable: false, length: integer(args[1], 255, 1) }];
  }
  if (method === 'decimal') {
    arity(args, 1, 3);
    const precision = integer(args[1], 8, 1), scale = integer(args[2], 2);
    if (scale > precision) throw new Error('Decimal scale exceeds precision.');
    return [{ name, type: method, nullable: false, precision, scale }];
  }
  if (['timestamp', 'dateTime', 'time', 'timestampTz', 'dateTimeTz', 'timeTz'].includes(method)) {
    arity(args, 1, 2);
    return [{ name, type: method, nullable: false, precision: integer(args[1], 0) }];
  }
  if (simpleTypes.has(method) || integerTypes.has(method)) {
    // Optional integer flags are deliberately excluded from this milestone.
    arity(args, 1);
    const unsigned = method.startsWith('unsigned');
    const type = unsigned ? method[8].toLowerCase() + method.slice(9) : method;
    return [{ name, type, nullable: false, ...(unsigned ? { unsigned: true } : {}) }];
  }
  throw new Error(`Unsupported Blueprint API: ${method}`);
}
function modify(column: Column, modifier: Call) {
  const { name, args } = modifier;
  if (name === 'nullable' || name === 'unsigned') {
    arity(args, 0, 1);
    const value = args[0] === undefined ? true : args[0];
    if (typeof value !== 'boolean') throw new Error(`${name} expects a boolean.`);
    column[name] = value;
  } else if (name === 'useCurrent' || name === 'useCurrentOnUpdate') {
    arity(args, 0);
    if (!['timestamp', 'timestampTz', 'dateTime', 'dateTimeTz'].includes(column.type)) throw new Error(`${name} is supported only for timestamp, timestampTz, dateTime and dateTimeTz.`);
    if (name === 'useCurrent' && Object.hasOwn(column, 'default')) throw new Error('Combining useCurrent and default is unsupported.');
    column[name] = true;
  } else if (name === 'default') {
    if (column.useCurrent) throw new Error('Combining useCurrent and default is unsupported.');
    arity(args, 1); if (Array.isArray(args[0])) throw new Error('default expects a scalar.'); column.default = args[0];
  } else if (name === 'comment') {
    arity(args, 1); column.comment = text(args[0]);
  } else throw new Error(`Unsupported column modifier: ${name}`);
}
const indexTypes = new Set<string>(['index', 'unique', 'primary']);
const dropTypes: Record<string, IndexType> = { dropIndex: 'index', dropUnique: 'unique', dropPrimary: 'primary' };
function indexColumns(value: Argument | undefined): string[] {
  const names = Array.isArray(value) ? value.map(text) : [text(value)];
  if (!names.length || new Set(names).size !== names.length) throw new Error('Index columns must be non-empty and distinct.');
  return names;
}
function explicitName(value: Argument | undefined): string | undefined {
  return value === undefined || value === null ? undefined : text(value);
}
/** Analyze only a migration's up() method. Unsupported statements yield diagnostics. */
export function analyzeMigration(source: string, file = 'migration.php'): AnalysisResult {
  const result: AnalysisResult = { operations: [], diagnostics: [], complete: true };
  const location = (node?: Node): SourceLocation => ({ file, line: node?.loc?.start.line ?? 1, column: node?.loc?.start.column ?? 0 });
  const report = (code: string, message: string, node?: Node) => {
    result.complete = false; result.diagnostics.push({ code, message, source: location(node) });
  };
  let ast: Node;
  try { ast = parseMigration(source, file) as Node; }
  catch (error) { report('PARSE_ERROR', error instanceof Error ? error.message : String(error)); return result; }
  let found = 0;
  function scope(nodes: Node[]) {
    const aliases = new Map<string, string>([['Schema', facade], ['Migration', migration]]);
    for (const node of nodes) if (node.kind === 'usegroup') {
      for (const item of node.items) {
        const full = clean([node.name, item.name].filter(Boolean).join('\\'));
        aliases.set(item.alias?.name ?? full.split('\\').at(-1)!, full);
      }
    }
    const resolves = (name: string | undefined, target: string) => !!name && (clean(name) === target || aliases.get(name) === target);
    for (const node of nodes) {
      if (node.kind === 'namespace') { scope(node.children); continue; }
      const cls = node.kind === 'class' ? node : node.kind === 'return' && node.expr?.kind === 'new' ? node.expr.what : undefined;
      if (cls?.kind !== 'class' || !resolves(cls.extends?.name, migration)) continue;
      const up = cls.body.find((member: Node) => member.kind === 'method' && member.name.name.toLowerCase() === 'up');
      if (!up?.body) continue;
      found++;
      for (const statement of up.body.children) {
        const call = statement.expression;
        const lookup = call?.what;
        if (statement.kind !== 'expressionstatement' || call?.kind !== 'call' || lookup?.kind !== 'staticlookup' || lookup.offset?.kind !== 'identifier' || !resolves(lookup.what?.name, facade)) {
          report('UNSUPPORTED_STATEMENT', 'Only direct Schema calls in up() are supported; control flow and helper calls are not evaluated.', statement); continue;
        }
        try {
          const method = lookup.offset.name;
          if (method === 'rename') {
            arity(call.arguments, 2);
            const table = text(literal(call.arguments[0])), to = text(literal(call.arguments[1]));
            result.operations.push({ kind:'renameTable', table, to, source:location(statement) });
            continue;
          }
          if (method === 'drop' || method === 'dropIfExists') {
            arity(call.arguments, 1);
            const table = text(literal(call.arguments[0]));
            result.operations.push({ kind:'dropTable', table, ifExists:method === 'dropIfExists', source:location(statement) });
            continue;
          }
          if (!['create', 'table'].includes(method)) throw new Error(`Unsupported Schema API: ${method}`);
          arity(call.arguments, 2);
          const table = text(literal(call.arguments[0]));
          const closure = call.arguments[1];
          if (closure.kind !== 'closure' || closure.arguments.length !== 1 || closure.body?.kind !== 'block') throw new Error('Expected a closure with one Blueprint parameter.');
          const receiver = closure.arguments[0].name.name;
          const fluentIndexes: AtomicOperation[] = [];
          if (method === 'create') result.operations.push({ kind: 'createTable', table, source: location(statement) });
          for (const body of closure.body.children) {
            try {
              if (body.kind !== 'expressionstatement') throw new Error('Blueprint control flow is unsupported.');
              const calls = chain(body.expression, receiver);
              if (!calls.length) throw new Error('Expected a Blueprint call.');
              const [first, ...allModifiers] = calls;
              const changes = allModifiers.filter(call => call.name === 'change');
              const changing = changes.length > 0;
              if (changing) {
                if (method !== 'table') throw new Error('change is supported only in Schema::table.');
                if (changes.length !== 1) throw new Error('Expected exactly one change modifier.');
                arity(changes[0].args, 0);
                const plain = simpleTypes.has(first.name) || integerTypes.has(first.name) ||
                  ['string', 'char', 'decimal', 'enum', 'timestamp', 'timestampTz', 'dateTime', 'dateTimeTz', 'time', 'timeTz'].includes(first.name);
                if (!plain) throw new Error('change supports only single ordinary column definitions, without helpers or auto-increment.');
                if (allModifiers.some(call => indexTypes.has(call.name))) throw new Error('Index modifiers combined with change are unsupported; use separate index commands.');
              }
              const modifiers = allModifiers.filter(call => call.name !== 'change');
              const operations: AtomicOperation[] = [];
              if (first.name === 'foreign') {
                arity(first.args, 1, 2);
                const names = indexColumns(first.args[0]);
                const references = modifiers.filter(call => call.name === 'references');
                const targets = modifiers.filter(call => call.name === 'on');
                if (references.length !== 1 || targets.length !== 1) throw new Error('foreign requires exactly one references() and on().');
                arity(references[0].args, 1); arity(targets[0].args, 1);
                const key: ForeignKey = { name:explicitName(first.args[1]) ?? indexName(table,names,'foreign'), columns:names,
                  referencedTable:text(targets[0].args[0]), referencedColumns:indexColumns(references[0].args[0]) };
                if (key.columns.length !== key.referencedColumns.length) throw new Error('Foreign key column counts must match.');
                foreignActions(key, modifiers.filter(call => call.name !== 'references' && call.name !== 'on'));
                operations.push({ kind:'addForeignKey', table, foreignKey:key, source:location(body) });
              } else if (first.name === 'dropForeign') {
                arity(first.args, 1);
                if (modifiers.length) throw new Error('dropForeign cannot have modifiers.');
                const value = first.args[0];
                operations.push({ kind:'dropForeignKey', table, name:Array.isArray(value) ? indexName(table,indexColumns(value),'foreign') : text(value), source:location(body) });
              } else if (first.name === 'foreignId' && modifiers.some(call => call.name === 'constrained')) {
                const column = columns(first)[0];
                const position = modifiers.findIndex(call => call.name === 'constrained');
                for (const call of modifiers.slice(0,position)) modify(column,call);
                const constrained = modifiers[position];
                arity(constrained.args, 0, 3);
                const reference = explicitName(constrained.args[1]) ?? 'id';
                const target = explicitName(constrained.args[0]) ?? inferReferencedTable(column.name,reference);
                const key: ForeignKey = { name:explicitName(constrained.args[2]) ?? indexName(table,[column.name],'foreign'),
                  columns:[column.name], referencedTable:target, referencedColumns:[reference] };
                foreignActions(key, modifiers.slice(position+1));
                operations.push({ kind:'addColumn', table, column, source:location(body) }, { kind:'addForeignKey', table, foreignKey:key, source:location(body) });
              } else if (indexTypes.has(first.name)) {
                arity(first.args, 1, 2);
                if (modifiers.length) throw new Error('Index commands cannot have modifiers.');
                const names = indexColumns(first.args[0]);
                const type = first.name as IndexType;
                operations.push({ kind: 'addIndex', table, index: { name: explicitName(first.args[1]) ?? indexName(table, names, type), type, columns: names }, source: location(body) });
              } else if (Object.hasOwn(dropTypes, first.name)) {
                const type = dropTypes[first.name];
                arity(first.args, type === 'primary' ? 0 : 1, 1);
                if (modifiers.length) throw new Error('Drop index commands cannot have modifiers.');
                const value = first.args[0];
                const name = Array.isArray(value) ? indexName(table, indexColumns(value), type)
                  : type === 'primary' && (value === undefined || value === null) ? null : text(value);
                operations.push({ kind: 'dropIndex', table, name, indexType: type, source: location(body) });
              } else if (['dropTimestamps','dropTimestampsTz','dropRememberToken','dropSoftDeletes','dropSoftDeletesTz'].includes(first.name)) {
                const soft = first.name === 'dropSoftDeletes' || first.name === 'dropSoftDeletesTz';
                arity(first.args, 0, soft ? 1 : 0);
                if (modifiers.length) throw new Error('Drop helpers cannot have modifiers.');
                const names = soft ? [text(first.args[0] === undefined ? 'deleted_at' : first.args[0])]
                  : first.name === 'dropRememberToken' ? ['remember_token'] : ['created_at','updated_at'];
                for (const column of names) operations.push({ kind:'dropColumn', table, column, source:location(body) });
              } else if (first.name === 'dropColumn') {
                arity(first.args, 1);
                if (modifiers.length) throw new Error('dropColumn cannot have modifiers.');
                operations.push({ kind: 'dropColumn', table, column: text(first.args[0]), source: location(body) });
              } else if (first.name === 'renameColumn') {
                arity(first.args, 2);
                if (modifiers.length) throw new Error('renameColumn cannot have modifiers.');
                operations.push({ kind: 'renameColumn', table, from: text(first.args[0]), to: text(first.args[1]), source: location(body) });
              } else {
                const definitions = columns(first);
                if (['timestamps','timestampsTz'].includes(first.name) && modifiers.length) throw new Error('Timestamp pair helpers do not support chained modifiers.');
                const pending: AtomicOperation[] = [];
                for (const column of definitions) {
                  const indexes = modifiers.filter(modifier => indexTypes.has(modifier.name));
                  if (indexes.length > 1) throw new Error('Multiple fluent index modifiers on one column are unsupported.');
                  for (const modifier of modifiers.filter(modifier => !indexTypes.has(modifier.name))) modify(column, modifier);
                  for (const modifier of indexes) {
                    arity(modifier.args, 0, 1);
                    const value = modifier.args[0];
                    // Fluent stores explicit null; Blueprint's isset check skips it.
                    // Omitting the argument instead stores true and creates an index.
                    if (value === null) continue;
                    if (column.autoIncrement && modifier.name === 'primary') throw new Error('Auto-increment columns already have an implicit primary key.');
                    const name = value === true ? undefined : explicitName(value);
                    const type = modifier.name as IndexType;
                    pending.push({ kind: 'addIndex', table, index: { name: name ?? indexName(table, [column.name], type), type, columns: [column.name] }, source: location(body) });
                  }
                  operations.push({ kind: changing ? 'changeColumn' : 'addColumn', table, column, source: location(body) });
                }
                fluentIndexes.push(...pending);
              }
              result.operations.push(...operations);
            } catch (error) { report('UNSUPPORTED_BLUEPRINT', (error as Error).message, body); }
          }
          result.operations.push(...fluentIndexes);
        } catch (error) { report('UNSUPPORTED_SCHEMA', (error as Error).message, statement); }
      }
    }
  }
  scope(ast.children);
  if (found !== 1) report('MIGRATION_COUNT', `Expected one migration with up(); found ${found}.`);
  return result;
}
