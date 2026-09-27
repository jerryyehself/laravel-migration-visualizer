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
export type AtomicOperation = ({ kind: 'createTable'; table: string }
  | { kind: 'addColumn'; table: string; column: Column }
  | { kind: 'dropColumn'; table: string; column: string }
  | { kind: 'renameColumn'; table: string; from: string; to: string }) & { source: SourceLocation };
export interface Diagnostic { code: string; message: string; source: SourceLocation }
export interface AnalysisResult { operations: AtomicOperation[]; diagnostics: Diagnostic[]; complete: boolean }
export interface SchemaState { tables: Record<string, { name: string; columns: Record<string, Column> }> }
