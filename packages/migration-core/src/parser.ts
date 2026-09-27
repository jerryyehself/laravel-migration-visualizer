import { Engine } from 'php-parser';
// The parser boundary is intentionally isolated; only the normalizer consumes AST nodes.
export function parseMigration(source: string, file: string): unknown {
  const parser = new Engine({ parser: { suppressErrors: false }, ast: { withPositions: true } });
  return parser.parseCode(source, file);
}
