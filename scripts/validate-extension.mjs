#!/usr/bin/env node
/**
 * Static validation of the built extension in ./out (or a directory passed as argv[2]).
 * Fails (exit 1) on anything Chrome would reject or that violates the extension CSP.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.resolve(process.argv[2] ?? path.join(root, 'out'));
const errors = [];
const fail = (message) => errors.push(message);

const ALLOWED_PERMISSIONS = new Set(['storage', 'alarms']);
const ALLOWED_OPTIONAL = new Set(['notifications']);

function walk(d) {
  return readdirSync(d, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(d, entry.name);
    return entry.isDirectory() ? [full, ...walk(full)] : [full];
  });
}

if (!existsSync(dir)) {
  console.error(`Not found: ${dir}`);
  process.exit(1);
}

// ---- manifest
const manifestPath = path.join(dir, 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error('manifest.json is missing from the build output.');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

if (manifest.manifest_version !== 3) fail('manifest_version must be 3');
for (const field of ['name', 'version', 'description']) if (!manifest[field]) fail(`manifest.${field} is required`);
if (manifest.version !== pkg.version) fail(`manifest.version (${manifest.version}) must equal package.json version (${pkg.version})`);
if ((manifest.description ?? '').length > 132) fail('manifest.description must be <= 132 characters');

const mustExist = (label, rel) => {
  if (!rel || typeof rel !== 'string') return fail(`${label} is not set`);
  if (!existsSync(path.join(dir, rel))) fail(`${label} points to a missing file: ${rel}`);
};

mustExist('chrome_url_overrides.newtab', manifest.chrome_url_overrides?.newtab);
mustExist('action.default_popup', manifest.action?.default_popup);
mustExist('options_ui.page', manifest.options_ui?.page);
mustExist('background.service_worker', manifest.background?.service_worker);

// icons: all four sizes, real PNGs of the declared dimension
for (const size of ['16', '32', '48', '128']) {
  const iconRel = manifest.icons?.[size];
  mustExist(`icons.${size}`, iconRel);
  mustExist(`action.default_icon.${size}`, manifest.action?.default_icon?.[size]);
  const iconPath = iconRel && path.join(dir, iconRel);
  if (iconPath && existsSync(iconPath)) {
    const buf = readFileSync(iconPath);
    const isPng = buf.subarray(1, 4).toString() === 'PNG';
    const w = isPng ? buf.readUInt32BE(16) : 0;
    const h = isPng ? buf.readUInt32BE(20) : 0;
    if (!isPng || w !== Number(size) || h !== Number(size)) fail(`icons.${size} must be a ${size}x${size} PNG (got ${isPng ? `${w}x${h}` : 'not a PNG'})`);
  }
}

// minimal permissions
for (const p of manifest.permissions ?? []) if (!ALLOWED_PERMISSIONS.has(p)) fail(`unexpected permission "${p}" (allowed: ${[...ALLOWED_PERMISSIONS].join(', ')})`);
for (const p of manifest.optional_permissions ?? []) if (!ALLOWED_OPTIONAL.has(p)) fail(`unexpected optional permission "${p}"`);
if (manifest.host_permissions?.length) fail('host_permissions must be empty (APIs are called via CORS; see README)');
if (manifest.optional_host_permissions?.length) fail('optional_host_permissions must be empty');
if (manifest.content_scripts) fail('content_scripts are not used by this extension');

// CSP
const csp = manifest.content_security_policy?.extension_pages ?? '';
const directive = (name) => csp.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${name} `)) ?? '';
if (!directive('script-src').includes("'self'")) fail("CSP script-src must contain 'self'");
if (/unsafe-eval|unsafe-inline|https?:|\*/.test(directive('script-src'))) fail('CSP script-src must be local only (no unsafe-*, no remote origins)');
if (/unsafe-eval|unsafe-inline|\*/.test(directive('object-src'))) fail('CSP object-src must be local only');

// ---- files
const files = walk(dir);
for (const f of files) {
  const rel = path.relative(dir, f).split(path.sep).join('/');
  if (rel.split('/').some((part) => part.startsWith('_'))) fail(`reserved name (starts with "_"): ${rel}`);
  if (rel.endsWith('.map')) fail(`source map shipped: ${rel}`);
  if (statSync(f).isFile() && statSync(f).size > 8 * 1024 * 1024) fail(`file larger than 8 MB: ${rel}`);
  if (/\.env|\.pem$|\.key$/i.test(path.basename(f))) fail(`possible secret file in output: ${rel}`);
}

// ---- HTML: CSP-compliance + resolvable local references
const resolveLocal = (htmlFile, ref) => {
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean) return null;
  if (clean.startsWith('/')) return path.join(dir, clean);
  return path.resolve(path.dirname(htmlFile), clean);
};
const htmlFiles = files.filter((f) => f.endsWith('.html'));
if (htmlFiles.length === 0) fail('no HTML files in output');
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const rel = path.relative(dir, file).split(path.sep).join('/');
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const [, attrs, body] = m;
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1];
    if (src) {
      if (/^(https?:)?\/\//i.test(src)) fail(`${rel}: remote script "${src}"`);
      else {
        const target = resolveLocal(file, src);
        if (target && !existsSync(target)) fail(`${rel}: script not found "${src}"`);
      }
    } else if (body.trim() && !/type\s*=\s*["']?(application\/json|application\/ld\+json|importmap)/i.test(attrs)) {
      fail(`${rel}: inline <script> (blocked by extension CSP)`);
    }
  }
  if (/\son[a-z]+\s*=\s*["']/i.test(html.replace(/<script[\s\S]*?<\/script>/gi, ''))) fail(`${rel}: inline event-handler attribute`);
  if (/href\s*=\s*["']javascript:/i.test(html)) fail(`${rel}: javascript: URL`);
  for (const m of html.matchAll(/<(?:link|img)\b[^>]*?\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    const ref = m[1];
    if (/^(https?:|data:|mailto:|\/\/)/i.test(ref)) continue;
    const target = resolveLocal(file, ref);
    if (target && !existsSync(target)) fail(`${rel}: missing asset "${ref}"`);
  }
}

if (errors.length) {
  console.error(`\nExtension validation FAILED (${errors.length}):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
const total = files.filter((f) => statSync(f).isFile()).reduce((sum, f) => sum + statSync(f).size, 0);
console.log(`Extension validation passed: ${path.relative(root, dir) || '.'} — ${htmlFiles.length} page(s), ${(total / 1024).toFixed(0)} KiB, permissions: [${(manifest.permissions ?? []).join(', ')}] optional: [${(manifest.optional_permissions ?? []).join(', ')}].`);
