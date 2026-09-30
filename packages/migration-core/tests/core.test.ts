import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { analyzeMigration, applyOperations, emptySchema, type AtomicOperation } from '../src/index.js';
const read = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const wrap = (body: string) => `<?php return new class extends Migration { public function up() { ${body} } public function down() { Schema::dropIfExists('users'); } };`;
const blueprint = (body: string) => wrap(`Schema::create('users', function(Blueprint $t) { ${body} });`);
const analyze = (body: string) => analyzeMigration(blueprint(body));

describe('golden migrations', () => {
  for (const name of ['001_create_users', '002_update_users']) it(name, () => {
    const actual = analyzeMigration(read(`${name}.php`), `${name}.php`);
    expect(JSON.parse(JSON.stringify(actual))).toEqual(JSON.parse(read(`${name}.golden.json`)));
  });
  it('replays ordered migrations without mutating initial state', () => {
    const initial = emptySchema();
    const first = applyOperations(initial, analyzeMigration(read('001_create_users.php')).operations);
    const second = applyOperations(first, analyzeMigration(read('002_update_users.php')).operations);
    expect(initial).toEqual({ tables: {} });
    expect(first.tables.users.columns.name).toBeDefined();
    expect(second.tables.users.columns.name).toBeUndefined();
    expect(second.tables.users.columns.email).toBeUndefined();
    expect(second.tables.users.columns.display_name).toEqual({ name: 'display_name', type: 'string', nullable: false, length: 120 });
    expect(Object.keys(second.tables.users.columns)).toHaveLength(8);
  });
});
describe('normalization', () => {
  it('does not analyze down() or helper methods', () => {
    expect(analyze('$t->id();').diagnostics).toEqual([]);
    expect(analyze('$t->id();').operations).toHaveLength(2);
  });
  it.each(['text','longText','mediumText','boolean','date','json','jsonb','uuid','integer','bigInteger','smallInteger','tinyInteger','mediumInteger'])('supports %s', type => {
    const result = analyze(`$t->${type}('value');`);
    expect(result.complete).toBe(true);
    expect(result.operations[1]).toMatchObject({ column: { name: 'value', type, nullable: false } });
  });
  it('normalizes signed defaults and explicit false', () => {
    expect(analyze("$t->integer('count')->default(-2)->nullable(false)->unsigned(false)->comment('Count');").operations[1]).toMatchObject({column:{default:-2,nullable:false,unsigned:false,comment:'Count'}});
  });
  it('handles fully qualified facade and namespace aliases', () => {
    const result = analyzeMigration(`<?php namespace Example; use Illuminate\\Database\\Migrations\\Migration as Base; return new class extends Base { function up() { \\Illuminate\\Support\\Facades\\Schema::create('x', function($b) { $b->id('key'); }); } };`);
    expect(result.complete).toBe(true);
    expect(result.operations[1]).toMatchObject({ column: { name: 'key' } });
  });
  it.each([
    "$t->string('email')->fullText();", "$t->foreignIdFor(User::class)->constrained();",
    "$t->string($column);", "$t->string('name')->default(env('NAME'));",
    "if (true) { $t->id(); }", "$other->id();", "$t->string('x')->change();",
    "$t->id(null);", "$t->integer('x')->default(010);", "$t->integer('x')->default(9007199254740993);", "$t->decimal('x', 2, 8);", "$t->integer('x', true);", "$t->id()->nullable(null);",
  ])('reports unsupported or invalid statements atomically: %s', body => {
    const result = analyze(body);
    expect(result.complete).toBe(false);
    expect(result.operations).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe('UNSUPPORTED_BLUEPRINT');
  });
  it.each(["if (true) { Schema::create('x', function($t) { $t->id(); }); }", "Schema::create($name, function($t) {});", "Schema::connection('sqlite')->create('x', function($t) {});"] )('never guesses dynamic schema: %s', body => {
    const result = analyzeMigration(wrap(body));
    expect(result.complete).toBe(false);
    expect(result.operations).toEqual([]);
  });
  it('respects imports shadowing Schema', () => {
    const result = analyzeMigration(blueprint('$t->id();').replace('<?php', '<?php use App\\Schema;'));
    expect(result.operations).toEqual([]);
    expect(result.complete).toBe(false);
  });
  it('returns diagnostic on invalid PHP', () => {
    expect(analyzeMigration('<?php return new class {').diagnostics[0].code).toBe('PARSE_ERROR');
  });
  it('requires migration up method', () => {
    expect(analyzeMigration('<?php echo 1;').diagnostics[0].code).toBe('MIGRATION_COUNT');
  });
});
describe('schema invariants', () => {
  const source = { file: 'test.php', line: 1, column: 0 };
  const create: AtomicOperation = {kind:'createTable',table:'users',source};
  const add: AtomicOperation = {kind:'addColumn',table:'users',column:{name:'id',type:'integer',nullable:false},source};
  it('rejects duplicate tables and columns', () => {
    expect(() => applyOperations(emptySchema(),[create,create])).toThrow('already exists');
    expect(() => applyOperations(emptySchema(),[create,add,add])).toThrow('already exists');
  });
  it('rejects missing table, drop target and rename collision', () => {
    expect(() => applyOperations(emptySchema(),[add])).toThrow('Unknown table');
    expect(() => applyOperations(emptySchema(),[create,{kind:'dropColumn',table:'users',column:'x',source}])).toThrow('Unknown column');
    expect(() => applyOperations(emptySchema(),[create,add,{kind:'renameColumn',table:'users',from:'id',to:'id',source}])).toThrow('already exists');
  });
  it('does not mutate input when replay fails', () => {
    const initial = applyOperations(emptySchema(),[create]);
    expect(() => applyOperations(initial,[add,add])).toThrow();
    expect(initial.tables.users.columns).toEqual({});
  });
  it('handles names that match object prototype keys', () => {
    const result = analyzeMigration(blueprint("$t->string('__proto__');").replace("'users'", "'__proto__'"));
    const state = applyOperations(emptySchema(), result.operations);
    expect(Object.keys(state.tables)).toEqual(['__proto__']);
    expect(Object.keys(state.tables.__proto__.columns)).toEqual(['__proto__']);
  });
});
