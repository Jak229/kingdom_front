/* Renders the portal covers from cover.html: covers/<concept>-<lang>-<w>x<h>.png.
   Usage: node cover.mjs [concept] (default: all three). Needs a static server on the repo root at port 8767. */
import {chromium} from 'playwright';
import fs from 'node:fs';

const SIZES = [[1920, 1080], [800, 1200], [800, 470], [512, 512]];
const CONCEPTS = process.argv[2] ? [process.argv[2]] : ['night', 'dusk', 'boss'];
const LANGS = (process.argv[3] || 'ru,en').split(',');
fs.mkdirSync('covers', {recursive: true});
const b = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
for (const c of CONCEPTS)
  for (const lang of LANGS)
    for (const [w, h] of SIZES) {
      const p = await b.newPage({viewport: {width: w, height: h}});
      await p.goto(`http://127.0.0.1:8767/art/cover.html?c=${c}&w=${w}&h=${h}&lang=${lang}`);
      await p.waitForFunction(() => document.title === 'ready');
      await p.screenshot({path: `covers/${c}-${lang}-${w}x${h}.png`});
      await p.close();
    }
await b.close();
