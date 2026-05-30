import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'public', 'data');
const ajv = new Ajv2020({ allErrors: true, validateFormats: false });
let errors = 0;

for (const entry of readdirSync(dataDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const schemaPath = join(dataDir, `${entry.name}.schema.json`);
  if (!existsSync(schemaPath)) continue;

  const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf8')));
  const dir = join(dataDir, entry.name);
  const files = readdirSync(dir).filter((file) => file.endsWith('.json')).sort();

  for (const name of files) {
    const file = join(dir, name);
    const valid = validate(JSON.parse(readFileSync(file, 'utf8')));
    if (valid) continue;

    for (const error of validate.errors ?? []) {
      errors += 1;
      console.log(`${relative(root, file)}:${error.instancePath || '.'}: ${error.message}`);
    }
  }

  console.log(`ok ${entry.name}: ${files.length} files`);
}

if (errors) {
  console.log(`failed: ${errors} errors`);
  process.exit(1);
}
