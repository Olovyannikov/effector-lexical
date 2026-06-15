// Bundle a single, self-contained .d.ts per entry with rollup-plugin-dts.
// External packages stay as imports so node16/nodenext resolves them via their
// own types (avoids the multi-entry merge problem of api-extractor).
import { rollup } from 'rollup';
import { dts } from 'rollup-plugin-dts';

const external = [/^effector/, /^lexical/, /^react/, /^@lexical\//];

const entries = [
  { input: 'src/index.ts', file: 'dist/index.d.ts' },
  { input: 'src/react/index.ts', file: 'dist/react/index.d.ts' },
  { input: 'src/html/index.ts', file: 'dist/html/index.d.ts' },
  { input: 'src/markdown/index.ts', file: 'dist/markdown/index.d.ts' },
];

for (const { input, file } of entries) {
  const bundle = await rollup({ input, plugins: [dts()], external });
  await bundle.write({ file, format: 'es' });
  await bundle.close();
}
