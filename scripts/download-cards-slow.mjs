import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '../public/cards/hwatu');
const files = JSON.parse(fs.readFileSync(path.join(__dirname, 'card-file-list.json'), 'utf8'));
const UA = 'GoStopGame/1.0 (https://github.com; educational hwatu game)';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpGet(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function getFileUrl(filename) {
  const title = encodeURIComponent(`File:${filename}`);
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${title}&prop=imageinfo&iiprop=url&format=json`;
  const { data } = await httpGet(api);
  const json = JSON.parse(data);
  const page = Object.values(json.query.pages)[0];
  return page.imageinfo?.[0]?.url;
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

const missing = files.filter((f) => !fs.existsSync(path.join(dir, f)));
let ok = 0;
for (const name of missing) {
  try {
    await sleep(2500);
    const url = await getFileUrl(name);
    if (!url) { console.error('NO URL', name); continue; }
    await downloadFile(url, path.join(dir, name));
    console.log('OK', name);
    ok++;
  } catch (err) {
    console.error('FAIL', name, err.message);
  }
}
console.log(`Downloaded ${ok}/${missing.length}`);
