// Vice Cover Maker — tiny local server for trying the app.
// Serves this directory's app/ (and screenshots/) over plain HTTP
// on port 8080. Nothing is uploaded anywhere: the app is static
// files, and photos stay on the machine that opens the page.
//
//   node serve.ts
//   open http://localhost:8080

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const safe = path.replace(/^\/+/, '').replace(/\.\./g, '');
  let file = join(root, 'app', safe === '' ? 'index.html' : safe);
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found\n');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

const port = Number(process.env.PORT ?? 8080);
server.listen(port, () => {
  console.log(`Vice Cover Maker at http://localhost:${port}`);
});
