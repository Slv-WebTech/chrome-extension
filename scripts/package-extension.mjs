#!/usr/bin/env node
/** Zips ./out into release/momentum-dashboard-v<version>.zip (ready for chrome://extensions or the Web Store). */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'out');
if (!existsSync(path.join(out, 'manifest.json'))) {
  console.error('out/manifest.json not found — run `pnpm build` first.');
  process.exit(1);
}

const version = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const entries = {};
const fixedTime = new Date('2026-01-01T00:00:00Z');

(function add(dir) {
  for (const name of readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) add(full);
    else entries[path.relative(out, full).split(path.sep).join('/')] = [new Uint8Array(readFileSync(full)), { level: 9, mtime: fixedTime }];
  }
})(out);

const zip = zipSync(entries);
const dest = path.join(root, 'release');
mkdirSync(dest, { recursive: true });
const file = path.join(dest, `momentum-dashboard-v${version}.zip`);
writeFileSync(file, zip);
console.log(`Packaged ${Object.keys(entries).length} files -> ${path.relative(root, file)} (${(zip.length / 1024).toFixed(0)} KiB)`);
