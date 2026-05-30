import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

type DataKind = 'ports' | 'naval_bases' | 'areas_of_interest';
type NamedPayload = { name: string; [key: string]: unknown };
const kinds = new Set<DataKind>(['ports', 'naval_bases', 'areas_of_interest']);

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'item';
}

function readBody(req: import('node:http').IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error('body too large'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function buildCollection(dataDir: string, kind: DataKind) {
  const dir = join(dataDir, kind);
  const items = readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => ({ ...JSON.parse(readFileSync(join(dir, file), 'utf8')), _file: file }));
  writeFileSync(join(dataDir, `${kind}.json`), `${JSON.stringify(items, null, 2)}\n`);
}

function dataWriterPlugin(): Plugin {
  const root = dirname(fileURLToPath(import.meta.url));
  const dataDir = join(root, 'public', 'data');

  return {
    name: 'naval-data-writer',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST' || !req.url?.startsWith('/api/data/')) return next();

        const kind = decodeURIComponent(req.url.replace('/api/data/', '').split('?')[0] ?? '') as DataKind;
        if (!kinds.has(kind)) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'unknown data kind' }));
          return;
        }

        try {
          const payload = JSON.parse(await readBody(req)) as NamedPayload;
          const requestedFile = new URL(req.url, 'http://localhost').searchParams.get('file');
          delete payload._file;
          const schema = JSON.parse(readFileSync(join(dataDir, `${kind}.schema.json`), 'utf8'));
          const ajv = new Ajv2020({ allErrors: true, validateFormats: false });
          const validate = ajv.compile(schema);

          if (!validate(payload)) {
            res.statusCode = 400;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ errors: validate.errors }, null, 2));
            return;
          }

          const dir = join(dataDir, kind);
          mkdirSync(dir, { recursive: true });
          if (typeof payload.name !== 'string') throw new Error('payload.name must be string');
          const slug = slugify(payload.name);
          const safeRequestedFile = requestedFile?.match(/^[a-z0-9_\-.]+\.json$/) ? requestedFile : null;
          const filename = safeRequestedFile ?? `${slug}.json`;
          const file = join(dir, filename);
          writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
          buildCollection(dataDir, kind);

          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: true, file: `/data/${kind}/${safeRequestedFile ?? `${slug}.json`}` }));
          server.ws.send({ type: 'full-reload' });
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), dataWriterPlugin()],
});
