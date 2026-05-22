/**
 * Cloudflare Pages can fail to serve very large static trees (500 on all routes).
 * This keeps the screener (manifest + stocks-raw-first) and drops heavy per-ticker raw caches.
 * Statements / Fundamentals tabs need raw JSON — host those on R2 or use full build on GitHub Pages.
 */
import fs from 'node:fs';
import path from 'node:path';

const distData = path.join('dist', 'data', 'edgequity');

function rmDir(rel) {
  const target = path.join(distData, rel);
  if (!fs.existsSync(target)) return 0;
  const files = fs.readdirSync(target, { recursive: true, withFileTypes: true });
  let count = 0;
  for (const entry of files) {
    if (entry.isFile()) count += 1;
  }
  fs.rmSync(target, { recursive: true, force: true });
  return count;
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return { files: 0, bytes: 0 };
  let files = 0;
  let bytes = 0;
  function walk(current) {
    for (const name of fs.readdirSync(current)) {
      const full = path.join(current, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else {
        files += 1;
        bytes += stat.size;
      }
    }
  }
  walk(dir);
  return { files, bytes };
}

if (!fs.existsSync(distData)) {
  console.error('prepare-cloudflare-dist: dist/data/edgequity missing — run vite build first');
  process.exit(1);
}

const removed = [
  ['raw', rmDir('raw')],
  ['stocks', rmDir('stocks')],
  ['sec', rmDir('sec')],
];

const kept = countFiles(distData);
const total = countFiles(path.join('dist'));

console.log('prepare-cloudflare-dist: removed cached folders for Cloudflare Pages:');
for (const [name, fileCount] of removed) {
  console.log(`  - ${name}: ${fileCount} files`);
}
console.log(
  `prepare-cloudflare-dist: kept data ${(kept.bytes / 1024 / 1024).toFixed(1)} MB (${kept.files} files); dist total ${(total.bytes / 1024 / 1024).toFixed(1)} MB (${total.files} files)`,
);
