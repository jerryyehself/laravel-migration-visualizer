import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  // php-parser 3.7's numeric lexer reads process.arch even in its browser bundle.
  // Select its 64-bit branch without exposing a global Node process object.
  define: { 'process.arch': JSON.stringify('x64') },
  optimizeDeps: { esbuildOptions: { define: { 'process.arch': JSON.stringify('x64') } } },
  resolve: { alias: { '@lmv/migration-core': fileURLToPath(new URL('../../packages/migration-core/src/index.ts', import.meta.url)) } },
});
