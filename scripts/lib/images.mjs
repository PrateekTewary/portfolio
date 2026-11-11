// Shared rules for image optimisation and checking.
// `sharp` is already installed as a dependency of Astro, so it is not declared separately.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

// What the optimizer produces.
export const TARGET_LONG_EDGE = 2000;
export const QUALITY = 82;

// What `images:check` tolerates before failing the build.
export const MAX_LONG_EDGE = 2400;
export const MAX_BYTES = 1024 * 1024;
export const MAX_GIF_BYTES = 3 * 1024 * 1024;

// Re-encoding only pays off when it saves at least this much; otherwise the file is left as is,
// which keeps `images:optimize` safe to run repeatedly without generation loss.
const MIN_SAVING_RATIO = 0.85;

export function toPosix(p) {
  return p.split(path.sep).join('/');
}

export function walkImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkImages(full);
    return IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()) ? [full] : [];
  });
}

// Spaces, parentheses and similar characters break URLs and Markdown links, so they become hyphens.
// Letter case is preserved on purpose: case-only renames are invisible to git on Windows and macOS.
export function sanitizeName(name) {
  const ext = path.extname(name);
  const base = ext ? name.slice(0, -ext.length) : name;
  const clean = base
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
  return (clean || 'image') + ext;
}

// Only files below an `images` directory are renamed; `relPath` is posix and relative to src/content.
export function sanitizeImagePath(relPath) {
  const segments = relPath.split('/');
  const at = segments.indexOf('images');
  if (at === -1) return relPath;
  return segments.map((segment, i) => (i > at ? sanitizeName(segment) : segment)).join('/');
}

export function withExtension(relPath, ext) {
  const current = path.posix.extname(relPath);
  return relPath.slice(0, relPath.length - current.length) + ext;
}

/**
 * Resize to TARGET_LONG_EDGE, recompress, strip metadata. PNGs become WebP unless `keepFormat`.
 * Returns the original bytes untouched when re-encoding would not be worth it.
 */
export async function optimizeImage(buffer, ext, { keepFormat = false } = {}) {
  const lower = ext.toLowerCase();
  if (lower === '.gif') return { buffer, ext, changed: false };

  const meta = await sharp(buffer, { failOn: 'none' }).metadata();
  const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
  const needsResize = longEdge > TARGET_LONG_EDGE;
  const convertPng = lower === '.png' && !keepFormat;

  let pipeline = sharp(buffer, { failOn: 'none' }).rotate();
  if (needsResize) {
    pipeline = pipeline.resize({
      width: TARGET_LONG_EDGE,
      height: TARGET_LONG_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  let output;
  let outExt = lower;
  if (lower === '.jpg' || lower === '.jpeg') {
    output = await pipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();
  } else if (lower === '.png' && keepFormat) {
    output = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  } else {
    output = await pipeline.webp({ quality: QUALITY }).toBuffer();
    outExt = '.webp';
  }

  const worthIt = needsResize || output.length <= buffer.length * MIN_SAVING_RATIO;
  // A PNG that would grow as WebP stays a PNG.
  if (convertPng && output.length >= buffer.length) return { buffer, ext, changed: false };
  if (!convertPng && !worthIt) return { buffer, ext, changed: false };
  return { buffer: output, ext: outExt, changed: true };
}

/**
 * Update image references in Markdown/MDX after files were renamed.
 * `renames` maps old posix paths to new ones, both relative to src/content.
 * References are written relative to the Markdown file, so matching starts at the `images/` segment
 * and only considers images that live in the same top-level section as the document.
 */
export function rewriteReferences(text, docRelPath, renames) {
  const section = docRelPath.split('/')[0];
  const pairs = [];
  for (const [oldPath, newPath] of renames) {
    if (oldPath === newPath || oldPath.split('/')[0] !== section) continue;
    const from = oldPath.slice(oldPath.indexOf('images/'));
    const to = newPath.slice(newPath.indexOf('images/'));
    pairs.push([from, to]);
    if (from.includes(' ')) pairs.push([from.replaceAll(' ', '%20'), to]);
  }
  pairs.sort((a, b) => b[0].length - a[0].length);

  let result = text;
  let count = 0;
  for (const [from, to] of pairs) {
    const parts = result.split(from);
    if (parts.length > 1) {
      count += parts.length - 1;
      result = parts.join(to);
    }
  }
  return { text: result, count };
}

export async function readDimensions(file) {
  const meta = await sharp(file, { failOn: 'none' }).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}
