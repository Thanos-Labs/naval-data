import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'public', 'data');

for (const entry of readdirSync(dataDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const dir = join(dataDir, entry.name);
  const files = readdirSync(dir).filter((file) => file.endsWith('.json')).sort();
  const items = files.map((file) => ({ ...JSON.parse(readFileSync(join(dir, file), 'utf8')), _file: file }));
  const out = join(dataDir, `${entry.name}.json`);

  writeFileSync(out, `${JSON.stringify(items, null, 2)}\n`);
  console.log(`${relative(root, out)}: ${items.length} files`);
}
