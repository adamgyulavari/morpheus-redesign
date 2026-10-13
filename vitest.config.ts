import path from 'node:path';

import { defineConfig } from 'vitest/config';

/** Unit tests of pure logic (`*.test.ts`): `npm test`. No database, no Next.js. */
export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname) } },
  test: { include: ['lib/**/*.test.ts'], environment: 'node' },
});
