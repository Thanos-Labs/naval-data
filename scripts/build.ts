import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const dataDir = join(root, 'public', 'data');

const keyedFolders: Record<string, string> = {
  ships: 'id',
  poi: 'id',
  aoi: 'id',
};

for (const folder of readdirSync(dataDir, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
  const dir = join(dataDir, folder.name);
  const files = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();

  const items = files.map((file) => JSON.parse(readFileSync(file, 'utf8')));
  const out = join(dataDir, `${folder.name}.json`);
  const keyField = keyedFolders[folder.name];

  if (keyField) {
    const keyed: Record<string, unknown> = {};

    for (const item of items) {
      const key = item[keyField];
      if ((typeof key !== 'string' && typeof key !== 'number') || key === '') {
        throw new Error(`${relative(root, out)}: missing key field ${keyField}`);
      }

      keyed[String(key)] = item;
    }

    writeFileSync(out, JSON.stringify(keyed));
    console.log(`${relative(root, out)}: ${items.length} files keyed by ${keyField}`);
  } else {
    writeFileSync(out, JSON.stringify(items));
    console.log(`${relative(root, out)}: ${items.length} files`);
  }
}
