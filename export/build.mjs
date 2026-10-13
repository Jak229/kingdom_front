/* Builds the portal version of the game: export/dist/ (open index.html from any static host)
   and export/kingdom-front-v<VERSION>.zip with index.html at the root of the archive.
   The ES modules become one minified classic script, so the game also runs inside portal iframes
   and needs no network: Phaser, fonts and sprites are all local files. */
import {build} from 'esbuild';
import {zipSync} from 'fflate';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)),
  root = path.resolve(here, '..'),
  dist = path.join(here, 'dist');
const VERSION = /VERSION = (\d+)/.exec(fs.readFileSync(path.join(root, 'js/config.js'), 'utf8'))[1];

fs.rmSync(dist, {recursive: true, force: true});
fs.mkdirSync(dist, {recursive: true});

await build({
  entryPoints: [path.join(root, 'js/main.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2019',
  legalComments: 'none',
  outfile: path.join(dist, 'js/game.js'),
  logLevel: 'warning'
});

for (const d of ['css', 'fonts', 'assets', 'vendor'])
  fs.cpSync(path.join(root, d), path.join(dist, d), {recursive: true});

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mod = '<script type="module" src="js/main.js"></script>';
if (!html.includes(mod)) throw new Error('index.html: module script tag not found');
html = html.replace(mod, '<script src="js/game.js"></script>');
const ext = html.match(/(src|href)="(https?:)?\/\/[^"]+"/g);
if (ext) throw new Error('index.html still loads from the network: ' + ext.join(', '));
fs.writeFileSync(path.join(dist, 'index.html'), html);

// zip: every file of dist/ with paths relative to it, index.html at the top
const files = {};
(function walk(dir) {
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else files[path.relative(dist, p).split(path.sep).join('/')] = fs.readFileSync(p);
  }
})(dist);
const zipPath = path.join(here, `kingdom-front-v${VERSION}.zip`);
fs.writeFileSync(zipPath, zipSync(files, {level: 9}));
const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log(`dist/: ${Object.keys(files).length} files, ${kb(Object.values(files).reduce((a, b) => a + b.length, 0))}`);
console.log(`${path.relative(root, zipPath)}: ${kb(fs.statSync(zipPath).size)}`);
