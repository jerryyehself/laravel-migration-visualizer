export type Literal = string | number | boolean | null;
export interface SourceLocation { file: string; line: number; column: number }
export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  unsigned?: boolean;
  autoIncrement?: boolean;
  primary?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
  default?: Literal;
  comment?: string;
}
export type IndexType = 'index' | 'unique' | 'primary';
export interface SchemaIndex { name: string; type: IndexType; columns: string[] }
export type ReferentialAction = 'cascade' | 'restrict' | 'set null' | 'no action';
export interface ForeignKey {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
}
export type AtomicOperation = ({ kind: 'createTable'; table: string }
  | { kind: 'addColumn'; table: string; column: Column }
  | { kind: 'dropColumn'; table: string; column: string }
  | { kind: 'renameColumn'; table: string; from: string; to: string }
  | { kind: 'addIndex'; table: string; index: SchemaIndex }
  | { kind: 'dropIndex'; table: string; name: string | null; indexType: IndexType }
  | { kind: 'addForeignKey'; table: string; foreignKey: ForeignKey }
  | { kind: 'dropForeignKey'; table: string; name: string }) & { source: SourceLocation };
export interface Diagnostic { code: string; message: string; source: SourceLocation }
export interface AnalysisResult { operations: AtomicOperation[]; diagnostics: Diagnostic[]; complete: boolean }
export interface SchemaState { tables: Record<string, { name: string; columns: Record<string, Column>; indexes: Record<string, SchemaIndex>; foreignKeys: Record<string, ForeignKey> }> }
