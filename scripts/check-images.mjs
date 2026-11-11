#!/usr/bin/env node
// Fails when an image is too heavy to be committed. Runs automatically before `npm run build`.
// Fix with: npm run images:optimize
import fs from 'node:fs';
import path from 'node:path';
import {
  MAX_BYTES,
  MAX_GIF_BYTES,
  MAX_LONG_EDGE,
  readDimensions,
  toPosix,
  walkImages,
} from './lib/images.mjs';

const cwd = process.cwd();
const roots = ['src/content', 'src/assets', 'public'].map((dir) => path.join(cwd, dir));
const mb = (bytes) => (bytes / 1048576).toFixed(2);

const problems = [];
const warnings = [];

for (const root of roots) {
  for (const file of walkImages(root)) {
    const rel = toPosix(path.relative(cwd, file));
    const { size } = fs.statSync(file);
    const isGif = file.toLowerCase().endsWith('.gif');

    if (size > (isGif ? MAX_GIF_BYTES : MAX_BYTES)) {
      problems.push(`${rel}: ${mb(size)} MB is over the ${mb(isGif ? MAX_GIF_BYTES : MAX_BYTES)} MB limit${isGif ? ' (consider a short looping MP4/WebM instead of a GIF)' : ''}`);
    }
    if (!isGif) {
      const { width, height } = await readDimensions(file);
      if (Math.max(width, height) > MAX_LONG_EDGE) {
        problems.push(`${rel}: ${width}x${height}px is over ${MAX_LONG_EDGE}px on the long edge`);
      }
    }
    if (rel.startsWith('src/content/') && /[\s()]/.test(path.basename(file))) {
      warnings.push(`${rel}: file name contains spaces or parentheses`);
    }
  }
}

for (const warning of warnings) console.warn(`warning  ${warning}`);

if (problems.length > 0) {
  console.error(`\n${problems.length} image problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error('\nRun "npm run images:optimize" to fix them, then build again.');
  process.exit(1);
}

console.log('Image check passed.');
