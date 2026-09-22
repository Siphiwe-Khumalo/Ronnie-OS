// Generates PWA icons + favicon from the Alerta brand mark SVG.
// Run with: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const iconsDir = join(root, 'public', 'icons');
mkdirSync(iconsDir, { recursive: true });

const markSvg = `
<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="96" height="96" rx="24" fill="#123736" />
  <circle cx="50" cy="42" r="26" stroke="#7cadaa" stroke-width="3" opacity="0.45" />
  <circle cx="50" cy="42" r="17" stroke="#adcdc9" stroke-width="3.5" opacity="0.75" />
  <circle cx="50" cy="42" r="9" fill="#f7f8f7" />
  <circle cx="50" cy="42" r="4" fill="#123736" />
</svg>
`;

// Maskable version needs extra safe-area padding since OS may crop to a circle.
const maskableSvg = `
<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#123736" />
  <circle cx="50" cy="46" r="20" stroke="#7cadaa" stroke-width="2.4" opacity="0.45" />
  <circle cx="50" cy="46" r="13" stroke="#adcdc9" stroke-width="2.8" opacity="0.75" />
  <circle cx="50" cy="46" r="7" fill="#f7f8f7" />
  <circle cx="50" cy="46" r="3.2" fill="#123736" />
</svg>
`;

const targets = [
  { file: 'icon-192.png', svg: markSvg, size: 192 },
  { file: 'icon-512.png', svg: markSvg, size: 512 },
  { file: 'icon-512-maskable.png', svg: maskableSvg, size: 512 },
  { file: 'apple-touch-icon.png', svg: markSvg, size: 180 },
];

for (const t of targets) {
  const buf = Buffer.from(t.svg);
  await sharp(buf).resize(t.size, t.size).png().toFile(join(iconsDir, t.file));
  console.log('Generated', t.file);
}

// favicon.svg at project public root (also used directly by index.html)
writeFileSync(join(root, 'public', 'favicon.svg'), markSvg.trim());
console.log('Generated favicon.svg');

console.log('Done.');
