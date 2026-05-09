#!/usr/bin/env node
// Tiny zero-dependency static server for the local dev loop. Serves the
// repo root over HTTP so the example pages can `import` ESM modules and
// `fetch` calendar JSON — both of which fail when files are opened with
// the `file://` protocol because browsers refuse cross-origin module
// requests from null origins.
//
// Usage:
//   node tools/serve.mjs
//   PORT=8080 node tools/serve.mjs
//
// Then open http://localhost:5173/examples/01-banner-basic.html
//
// Security notes:
//   - Path-traversal protection: every resolved path is verified to live
//     inside the repo root before any read.
//   - Only specific MIME types are returned; unknown extensions fall
//     back to application/octet-stream so the browser refuses to
//     execute them.
//   - Listens on 127.0.0.1 only — never exposed on the network.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT) || 5173;
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.map':  'application/json; charset=utf-8',
};

function isInside(parent, child) {
  const rel = child.startsWith(parent) ? child.slice(parent.length) : null;
  if (rel == null) return false;
  return rel === '' || rel.startsWith(sep);
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    const rawUrl = decodeURIComponent((req.url || '/').split('?')[0]);
    const requested = rawUrl === '/' ? '/index.html' : rawUrl;
    const resolved = resolve(join(REPO_ROOT, '.' + requested));

    if (!isInside(REPO_ROOT, resolved)) {
      send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain' });
      return;
    }

    let target = resolved;
    let info;
    try {
      info = await stat(target);
    } catch {
      send(res, 404, 'Not found: ' + requested, { 'Content-Type': 'text/plain' });
      return;
    }

    if (info.isDirectory()) {
      target = join(target, 'index.html');
      try {
        info = await stat(target);
      } catch {
        send(res, 404, 'Directory listing disabled', { 'Content-Type': 'text/plain' });
        return;
      }
    }

    const ext = extname(target).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const data = await readFile(target);
    send(res, 200, data, { 'Content-Type': type });
  } catch (err) {
    send(res, 500, 'Server error: ' + (err && err.message ? err.message : err), {
      'Content-Type': 'text/plain',
    });
  }
});

server.listen(PORT, HOST, () => {
  const base = 'http://' + HOST + ':' + PORT;
  console.log('seasonly dev server');
  console.log('  serving ' + REPO_ROOT);
  console.log('  → ' + base);
  console.log('  open one of:');
  console.log('     ' + base + '/examples/01-banner-basic.html');
  console.log('     ' + base + '/examples/02-particles-gallery.html');
  console.log('     ' + base + '/examples/03-banner-and-particles.html');
  console.log('     ' + base + '/examples/04-auto-init.html');
  console.log('  Ctrl+C to stop');
});
