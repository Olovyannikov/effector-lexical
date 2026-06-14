// Duplicate the bundled .d.ts into .d.cts so the "require" export condition
// resolves CJS-flavoured types (fixes attw "masquerading as ESM").
import { copyFileSync } from 'node:fs';

for (const entry of ['index', 'react/index']) {
  copyFileSync(`dist/${entry}.d.ts`, `dist/${entry}.d.cts`);
}
