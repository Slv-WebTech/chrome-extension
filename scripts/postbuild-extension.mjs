#!/usr/bin/env node
/**
 * Turns the Next.js static export in ./out into a loadable Manifest V3 extension.
 *
 *  1. Removes files the extension does not need (RSC prefetch payloads, 404 pages).
 *  2. Renames anything starting with "_" (Chrome reserves those names, e.g. `_next`)
 *     and rewrites every reference to the old paths.
 *  3. Moves inline <script> bodies into external files (extension pages forbid inline script).
 *  4. Runs the validator.
 *
 * Cross-platform (no PowerShell required).
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'out');
const posix = (p) => p.split(path.sep).join('/');
const rel = (p) => posix(path.relative(out, p));

if (!existsSync(path.join(out, 'index.html'))) {
  console.error('out/index.html not found — run `next build` first (use `pnpm build`).');
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? [full, ...walk(full)] : [full];
  });
}

// 1) Drop files that are useless in an extension.
let removed = 0;
for (const file of walk(out)) {
  if (!existsSync(file)) continue;
  const name = path.basename(file);
  const isUnusedPage = name === '404.html' || name === '404' || file.includes(`${path.sep}404${path.sep}`) || file.includes(`${path.sep}_not-found`) || name.startsWith('_not-found');
  const isPrefetchPayload = name.endsWith('.txt') || name.endsWith('.map');
  if (isUnusedPage || isPrefetchPayload) {
    rmSync(file, { recursive: true, force: true });
    removed += 1;
  }
}

// 2) Rename underscore-prefixed paths, deepest first, remembering how to rewrite references.
const replacements = new Map();
const underscored = walk(out)
  .filter((p) => path.basename(p).startsWith('_'))
  .sort((a, b) => b.length - a.length);

for (const item of underscored) {
  if (!existsSync(item)) continue;
  const dir = path.dirname(item);
  const oldName = path.basename(item);
  let newName = oldName.replace(/^_+/, '') || 'item';
  let counter = 1;
  while (existsSync(path.join(dir, newName))) newName = `${newName.replace(/-\d+$/, '')}-${counter++}`;
  const oldRel = `/${rel(item)}`;
  renameSync(item, path.join(dir, newName));
  const newRel = `/${rel(path.join(dir, newName))}`;
  replacements.set(oldRel, newRel);
  replacements.set(`/${oldName}`, `/${newName}`); // references that are relative to their folder
  // Parent directories were already renamed by the time we compute oldRel for children, so also
  // register the form that the (not yet renamed) HTML/JS uses.
}
// The top-level `_next` directory is renamed last (shortest path); make sure its prefix form is covered.
replacements.set('/_next/', '/next/');

const sorted = [...replacements.entries()].sort((a, b) => b[0].length - a[0].length);
const TEXT = new Set(['.html', '.js', '.css', '.json']);
let rewritten = 0;
for (const file of walk(out)) {
  if (!statSync(file).isFile() || !TEXT.has(path.extname(file))) continue;
  const original = readFileSync(file, 'utf8');
  let updated = original;
  for (const [from, to] of sorted) {
    updated = updated.split(from).join(to);
    const escapedFrom = from.replaceAll('/', '\\/');
    if (escapedFrom !== from) updated = updated.split(escapedFrom).join(to.replaceAll('/', '\\/'));
  }
  if (updated !== original) {
    writeFileSync(file, updated);
    rewritten += 1;
  }
}

// 3) Externalise inline scripts in every HTML document.
const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const inlineDir = path.join(out, 'next', 'inline');
let extracted = 0;
for (const file of walk(out)) {
  if (!file.endsWith('.html')) continue;
  const html = readFileSync(file, 'utf8');
  const next = html.replace(SCRIPT_RE, (match, attrs, body) => {
    if (/\bsrc\s*=/.test(attrs)) return match;
    if (/type\s*=\s*["']?(application\/json|application\/ld\+json|importmap|speculationrules)/i.test(attrs)) return match;
    if (!body.trim()) return '';
    mkdirSync(inlineDir, { recursive: true });
    const hash = createHash('sha256').update(body).digest('hex').slice(0, 12);
    writeFileSync(path.join(inlineDir, `${hash}.js`), body);
    extracted += 1;
    return `<script src="/next/inline/${hash}.js"></script>`;
  });
  if (next !== html) writeFileSync(file, next);
}

console.log(`postbuild: removed ${removed} unused file(s), renamed ${underscored.length} reserved path(s), rewrote ${rewritten} file(s), externalised ${extracted} inline script(s).`);

// 4) Validate.
const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'validate-extension.mjs')], { stdio: 'inherit' });
process.exit(result.status ?? 1);
