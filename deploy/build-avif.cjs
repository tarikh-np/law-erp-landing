#!/usr/bin/env node
/*
 * Encode the hero image to AVIF at the same three widths as the WebP set.
 * AVIF encoding is done with sharp because Pillow cannot write AVIF here.
 * Run with sharp available, e.g.:
 *     NODE_PATH=/path/to/node_modules node deploy/build-avif.cjs [source.png]
 */
const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.error('sharp is not resolvable. Re-run with NODE_PATH pointing at a node_modules that has it.');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const source = process.argv[2] || path.join(root, 'assets', 'images', 'tarikh-law-erp-dashboard.png');
const outDir = path.join(root, 'assets', 'images');
const widths = [640, 960, 1536];
const aspect = 1536 / 1024;

if (!fs.existsSync(source)) {
  console.error('source image not found: ' + source);
  process.exit(1);
}

(async () => {
  for (const w of widths) {
    const h = Math.round(w / aspect);
    const out = path.join(outDir, `tarikh-law-erp-dashboard-${w}.avif`);
    await sharp(source)
      .resize(w, h, { kernel: 'lanczos3' })
      .avif({ quality: 55, effort: 6 })
      .toFile(out);
    const kb = Math.round(fs.statSync(out).size / 1024);
    console.log(`wrote ${path.basename(out)} ${kb} KB`);
  }
})();
