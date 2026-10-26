/* Paint jobs for the commander's vehicles: the atlas frames are repainted once into a canvas texture per skin.
   Only the paint is touched (sand and olive hues); outlines, tyres, glass and the garrison flag keep their colours. */
import {ATLAS, SPR, fname} from '../sprites.js';
import {SKINS} from '../meta.js';

const KEYS = ['v_jeep', 'v_moto', 'v_armored', 'v_tank'];

function rgb2hsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b),
    l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn,
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hsl2rgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s,
    hp = (((h % 360) + 360) % 360) / 60,
    x = c * (1 - Math.abs((hp % 2) - 1)),
    m = l - c / 2;
  const [r, g, b] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
const paint = (h, s, l) => h > 25 && h < 115 && s > 0.12 && l > 0.13 && l < 0.82;
// blotchy camouflage: hashed cells of two sizes in art pixels, stable between animation frames
function cell(x, y, w, h, seed) {
  const cx = Math.floor((x + seed * 3) / w),
    cy = Math.floor(y / h);
  let q = Math.imul(cx * 374761393 + cy * 668265263 + seed * 2246822519, 1274126177);
  q ^= q >>> 15;
  return ((q >>> 0) % 1000) / 1000;
}
function camoIdx(x, y, n) {
  const v = cell(x, y, 7, 4, 1) * 0.65 + cell(x + 2, y + 1, 3, 3, 2) * 0.35;
  if (n === 1) return v > 0.56 ? 1 : 0;
  return v > 0.66 ? 1 : v < 0.3 ? 2 : 0;
}

function repaint(data, w, h, skin) {
  let sum = 0,
    n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const [hh, s, l] = rgb2hsl(data[i], data[i + 1], data[i + 2]);
    if (paint(hh, s, l)) {
      sum += l;
      n++;
    }
  }
  const mean = n ? sum / n : 0.5,
    cols = [skin.c, ...(skin.camo || [])];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!data[i + 3]) continue;
      const [hh, s, l] = rgb2hsl(data[i], data[i + 1], data[i + 2]);
      if (!paint(hh, s, l)) continue;
      // texel -> art pixel, so patches line up with the pixel art
      const c = cols[skin.camo ? camoIdx(x >> 1, y >> 1, skin.camo.length) : 0];
      let L = c[2] + (l - mean) * (skin.shine ? 1.5 : 1.05);
      if (skin.shine && ((x >> 1) + (y >> 1)) % 9 === 0) L += 0.12;
      const o = hsl2rgb(c[0], c[1], Math.max(0.04, Math.min(0.95, L)));
      data[i] = o[0];
      data[i + 1] = o[1];
      data[i + 2] = o[2];
    }
}

// texture key for a skin, built on first use; null for the factory paint
export function skinTex(scene, id) {
  if (!id || id === 'base') return null;
  const key = 'skin_' + id;
  if (scene.textures.exists(key)) return key;
  const skin = SKINS.find(s => s.id === id);
  if (!skin) return null;
  const at = scene.textures.get(ATLAS),
    src = at.getSourceImage(),
    frames = [];
  let tw = 0,
    th = 0;
  for (const k of KEYS)
    for (let f = 0; f < SPR[k].frames; f++) {
      const fr = at.get(fname(k, f));
      frames.push({name: fname(k, f), fr, x: tw});
      tw += fr.cutWidth + 2;
      th = Math.max(th, fr.cutHeight);
    }
  const ct = scene.textures.createCanvas(key, tw, th),
    ctx = ct.getContext();
  for (const o of frames) {
    ctx.drawImage(
      src,
      o.fr.cutX,
      o.fr.cutY,
      o.fr.cutWidth,
      o.fr.cutHeight,
      o.x,
      0,
      o.fr.cutWidth,
      o.fr.cutHeight
    );
    const id2 = ctx.getImageData(o.x, 0, o.fr.cutWidth, o.fr.cutHeight);
    repaint(id2.data, o.fr.cutWidth, o.fr.cutHeight, skin);
    ctx.putImageData(id2, o.x, 0);
    ct.add(o.name, 0, o.x, 0, o.fr.cutWidth, o.fr.cutHeight);
  }
  ct.refresh();
  ct.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return key;
}

// a small picture of the MaxxPro in a skin, for the shop card
const previews = {};
export function skinPreview(scene, id) {
  if (previews[id]) return previews[id];
  const at = scene.textures.get(ATLAS),
    fr = at.get(fname('v_jeep', 0)),
    cv = document.createElement('canvas');
  cv.width = fr.cutWidth;
  cv.height = fr.cutHeight;
  const ctx = cv.getContext('2d');
  ctx.drawImage(
    at.getSourceImage(),
    fr.cutX,
    fr.cutY,
    fr.cutWidth,
    fr.cutHeight,
    0,
    0,
    fr.cutWidth,
    fr.cutHeight
  );
  const skin = SKINS.find(s => s.id === id);
  if (skin && skin.c) {
    const d = ctx.getImageData(0, 0, cv.width, cv.height);
    repaint(d.data, cv.width, cv.height, skin);
    ctx.putImageData(d, 0, 0);
  }
  return (previews[id] = cv.toDataURL());
}
