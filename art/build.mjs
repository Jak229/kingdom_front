// Paints every sprite from art/*.js in headless Chromium and writes assets/sprites.png + assets/sprites.json.
// Run after changing any sprite:  cd art && npm install && npm run build
// (set CHROMIUM=/path/to/chrome to use an installed browser instead of Playwright's own)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets');
const ATLAS_W = 2048, GAP = 2;

// a tiny static server, so the browser can load the art modules from the repo
const TYPES = {'.html': 'text/html', '.js': 'text/javascript'};
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, {'content-type': TYPES[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
const page = await browser.newPage();
page.on('pageerror', e => { console.error(e); process.exitCode = 1; });
await page.goto(`http://127.0.0.1:${server.address().port}/art/build.html`);
const {spr, sheets} = await page.waitForFunction(() => window.result).then(h => h.jsonValue());
await browser.close();
server.close();

// shelf packing: tallest strips first, rows of ATLAS_W pixels
const strips = sheets.map(s => ({...s, w: s.fw * s.frames, h: s.fh, rgba: Buffer.from(s.rgba, 'base64')}));
strips.sort((a, b) => b.h - a.h || b.w - a.w || (a.key < b.key ? -1 : 1));
let x = 0, y = 0, rowH = 0;
for (const s of strips) {
  if (x + s.w > ATLAS_W) { x = 0; y += rowH + GAP; rowH = 0; }
  s.x = x; s.y = y; x += s.w + GAP; rowH = Math.max(rowH, s.h);
}
const W = ATLAS_W, H = y + rowH;
const img = Buffer.alloc(W * H * 4);
const frames = {};
for (const s of strips) {
  for (let r = 0; r < s.h; r++) s.rgba.copy(img, ((s.y + r) * W + s.x) * 4, r * s.w * 4, (r + 1) * s.w * 4);
  for (let f = 0; f < s.frames; f++)
    frames[s.key + ':' + f] = {
      frame: {x: s.x + f * s.fw, y: s.y, w: s.fw, h: s.fh},
      rotated: false, trimmed: false,
      spriteSourceSize: {x: 0, y: 0, w: s.fw, h: s.fh}, sourceSize: {w: s.fw, h: s.fh}
    };
}

// PNG, written by hand so pixels land in the file exactly as painted
const crcT = Array.from({length: 256}, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4), tc = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4);
  len.writeUInt32BE(data.length); c.writeUInt32BE(crc(tc));
  return Buffer.concat([len, tc, c]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((W * 4 + 1) * H);
for (let r = 0; r < H; r++) img.copy(raw, r * (W * 4 + 1) + 1, r * W * 4, (r + 1) * W * 4);
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, {level: 9})), chunk('IEND', Buffer.alloc(0))]);

fs.mkdirSync(OUT, {recursive: true});
fs.writeFileSync(path.join(OUT, 'sprites.png'), png);
// Phaser "JSON hash" atlas; spr carries each sprite's size and anchor for the game
fs.writeFileSync(path.join(OUT, 'sprites.json'),
  JSON.stringify({frames, meta: {image: 'sprites.png', format: 'RGBA8888', size: {w: W, h: H}, scale: 1}, spr}));
console.log(`assets/sprites.png ${W}x${H}, ${strips.length} sprites, ${Object.keys(frames).length} frames, ${(png.length / 1024).toFixed(0)} KB`);
