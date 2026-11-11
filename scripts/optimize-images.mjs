#!/usr/bin/env node
// Shrinks images in place so the repository and the deployed site stay small.
//
//   npm run images:optimize              optimize everything
//   npm run images:optimize -- --dry-run show what would change
//
// Content images (src/content/**/images) are resized to 2000px on the long edge, recompressed, stripped
// of metadata, PNGs are converted to WebP, file names are cleaned up (spaces become hyphens) and the
// references in .md/.mdx files are updated. Images in src/assets and public keep their format and name.
// Safe to run repeatedly: files that are already small are left untouched.
import fs from 'node:fs';
import path from 'node:path';
import {
  MAX_BYTES,
  MAX_LONG_EDGE,
  optimizeImage,
  readDimensions,
  rewriteReferences,
  sanitizeImagePath,
  toPosix,
  walkImages,
  withExtension,
} from './lib/images.mjs';

const dryRun = process.argv.includes('--dry-run');
const cwd = process.cwd();
const contentDir = path.join(cwd, 'src', 'content');
const mb = (bytes) => (bytes / 1048576).toFixed(2);

async function optimizeContent() {
  const files = walkImages(contentDir);
  const plan = [];
  const taken = new Map();

  for (const file of files) {
    const rel = toPosix(path.relative(contentDir, file));
    const buffer = fs.readFileSync(file);
    const result = await optimizeImage(buffer, path.extname(file));
    let newRel = sanitizeImagePath(rel);
    if (result.ext.toLowerCase() !== path.posix.extname(newRel).toLowerCase()) {
      newRel = withExtension(newRel, result.ext);
    }

    const key = newRel.toLowerCase();
    if (taken.has(key)) {
      throw new Error(`Two images would end up with the same name:\n  ${taken.get(key)}\n  ${rel}\n  -> ${newRel}`);
    }
    taken.set(key, rel);
    plan.push({ file, rel, newRel, before: buffer.length, result });
  }

  const renames = new Map(plan.filter((p) => p.rel !== p.newRel).map((p) => [p.rel, p.newRel]));
  let before = 0;
  let after = 0;
  let rewritten = 0;

  for (const item of plan) {
    before += item.before;
    after += item.result.buffer.length;
    const changed = item.result.changed || item.rel !== item.newRel;
    if (!changed) continue;
    const saved = item.before - item.result.buffer.length;
    console.log(`${dryRun ? 'would update' : 'updated'}  ${item.rel}${item.rel !== item.newRel ? `  ->  ${item.newRel}` : ''}  (${mb(item.before)} -> ${mb(item.result.buffer.length)} MB${saved < 0 ? ', larger' : ''})`);
    if (dryRun) continue;
    const target = path.join(contentDir, ...item.newRel.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, item.result.buffer);
    if (path.resolve(target) !== path.resolve(item.file)) fs.rmSync(item.file);
  }

  if (!dryRun && renames.size > 0) {
    for (const doc of walkDocs(contentDir)) {
      const docRel = toPosix(path.relative(contentDir, doc));
      const original = fs.readFileSync(doc, 'utf8');
      const { text, count } = rewriteReferences(original, docRel, renames);
      if (count > 0) {
        fs.writeFileSync(doc, text);
        rewritten += count;
        console.log(`references  ${docRel}  (${count} updated)`);
      }
    }
    removeEmptyDirs(contentDir);
  }

  return { count: files.length, before, after, renames: renames.size, rewritten };
}

function walkDocs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkDocs(full);
    return /\.mdx?$/i.test(entry.name) ? [full] : [];
  });
}

function removeEmptyDirs(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    removeEmptyDirs(full);
    if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
  }
}

// Assets imported from code or served from /public must keep their name and format, and are only
// touched when they break the limits enforced by check-images.mjs.
async function optimizeInPlace(dir) {
  let before = 0;
  let after = 0;
  for (const file of walkImages(dir)) {
    const buffer = fs.readFileSync(file);
    before += buffer.length;
    after += buffer.length;
    const { width, height } = await readDimensions(file);
    const withinLimits = buffer.length <= MAX_BYTES && Math.max(width, height) <= MAX_LONG_EDGE;
    if (withinLimits) continue;
    const result = await optimizeImage(buffer, path.extname(file), { keepFormat: true });
    after += result.buffer.length - buffer.length;
    if (!result.changed) continue;
    console.log(`${dryRun ? 'would update' : 'updated'}  ${toPosix(path.relative(cwd, file))}  (${mb(buffer.length)} -> ${mb(result.buffer.length)} MB)`);
    if (!dryRun) fs.writeFileSync(file, result.buffer);
  }
  return { before, after };
}

const content = await optimizeContent();
const assets = await optimizeInPlace(path.join(cwd, 'src', 'assets'));
const pub = await optimizeInPlace(path.join(cwd, 'public'));

const before = content.before + assets.before + pub.before;
const after = content.after + assets.after + pub.after;
console.log(
  `\n${dryRun ? 'Dry run: ' : ''}${content.count} content images, ${mb(before)} MB -> ${mb(after)} MB` +
    ` (${before ? Math.round((1 - after / before) * 100) : 0}% smaller), ${content.renames} renamed, ${content.rewritten} references updated.`,
);
if (dryRun) console.log('Nothing was written. Run without --dry-run to apply.');
