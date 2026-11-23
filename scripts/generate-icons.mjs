#!/usr/bin/env node
/** Renders assets/icon.svg to the extension icon sizes and a multi-size favicon.ico. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(path.join(root, 'assets', 'icon.svg'));
const iconsDir = path.join(root, 'public', 'icons');
mkdirSync(iconsDir, { recursive: true });

const render = (size) => sharp(svg, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

for (const size of [16, 32, 48, 128]) {
  writeFileSync(path.join(iconsDir, `icon-${size}.png`), await render(size));
}

// ICO container holding PNG images (supported by all modern browsers).
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(render));
const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = 6 + images.length * 16;
const dirEntries = images.map((img, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i], 0);
  e.writeUInt8(sizes[i], 1);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(img.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += img.length;
  return e;
});
writeFileSync(path.join(root, 'src', 'app', 'favicon.ico'), Buffer.concat([header, ...dirEntries, ...images]));
console.log('Icons written: public/icons/icon-{16,32,48,128}.png and src/app/favicon.ico');
