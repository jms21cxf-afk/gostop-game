import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '../public/cards/allcard.png');
const dir = path.join(__dirname, '../public/cards/hwatu');
const W = 186;
const H = 290;

fs.mkdirSync(dir, { recursive: true });

for (let i = 0; i < 48; i++) {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const dest = path.join(dir, `fallback-${String(i).padStart(2, '0')}.png`);
  await sharp(src)
    .extract({ left: col * W, top: row * H, width: W, height: H })
    .png()
    .toFile(dest);
  console.log('split', dest);
}
