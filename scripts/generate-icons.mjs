import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const svg = readFileSync(join(publicDir, 'favicon.svg'));

const sizes = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(join(publicDir, name));
  console.log(`Created ${name} (${size}x${size})`);
}

// Maskable icon: same art scaled to 80% with solid background padding
const maskableSize = 512;
const inner = Math.round(maskableSize * 0.72);
const padded = await sharp(svg)
  .resize(inner, inner)
  .extend({
    top: Math.floor((maskableSize - inner) / 2),
    bottom: Math.ceil((maskableSize - inner) / 2),
    left: Math.floor((maskableSize - inner) / 2),
    right: Math.ceil((maskableSize - inner) / 2),
    background: '#1a472a',
  })
  .png()
  .toFile(join(publicDir, 'icon-512-maskable.png'));

console.log('Created icon-512-maskable.png (512x512)');
