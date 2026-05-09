#!/usr/bin/env node
// Zero-dependency bundle-size budget check. Walks src/, gzips each .js
// file, prints a per-file table, and fails if the total exceeds the
// budget. The budget can be overridden with SEASONLY_BUDGET=<bytes>.
//
// We measure the source files directly (no bundler) because seasonly
// ships ESM as-is to npm and CDN. There is no built artifact to measure.

import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC_DIR = join(REPO_ROOT, 'src');

const DEFAULT_BUDGET_BYTES = 25 * 1024;
const BUDGET = Number(process.env.SEASONLY_BUDGET || DEFAULT_BUDGET_BYTES);

function listJsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listJsFiles(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function fmt(n) {
  return n.toLocaleString('en-US');
}

const files = listJsFiles(SRC_DIR).sort();
const rows = [];
let totalRaw = 0;
let totalGz = 0;

for (const file of files) {
  const raw = readFileSync(file);
  const gz = gzipSync(raw, { level: 9 });
  rows.push({
    rel: relative(REPO_ROOT, file).replace(/\\/g, '/'),
    raw: raw.length,
    gz: gz.length,
  });
  totalRaw += raw.length;
  totalGz += gz.length;
}

console.log('seasonly · source size (gzip level 9)');
console.log('—'.repeat(78));
for (const r of rows) {
  console.log(
    '  ' + r.rel.padEnd(48) +
    fmt(r.gz).padStart(8) + ' B gz' +
    '   (' + fmt(r.raw).padStart(7) + ' B raw)'
  );
}
console.log('—'.repeat(78));
console.log(
  '  ' + 'TOTAL'.padEnd(48) +
  fmt(totalGz).padStart(8) + ' B gz' +
  '   (' + fmt(totalRaw).padStart(7) + ' B raw)'
);
console.log('  ' + 'BUDGET'.padEnd(48) + fmt(BUDGET).padStart(8) + ' B gz');
console.log('—'.repeat(78));

if (totalGz > BUDGET) {
  console.error('FAIL: total gzip size exceeds budget by ' + fmt(totalGz - BUDGET) + ' bytes');
  process.exit(1);
}

const headroom = BUDGET - totalGz;
console.log('OK: ' + fmt(headroom) + ' B headroom remaining');
