// Generates the PWA icon set referenced in public/manifest.json from icon-source.svg.
// Run once (and whenever the source SVG changes): npm run generate:icons
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '..', 'public', 'icon-source.svg');
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const svg = fs.readFileSync(SRC);
  for (const size of SIZES) {
    const out = path.join(OUT_DIR, `icon-${size}x${size}.png`);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.log(`wrote ${out}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
