/* Sprite source code. The game does not run this: art/build.mjs paints every sprite here in a browser,
   then packs them into assets/sprites.png + assets/sprites.json, which the game loads like any image. */
/* ---------- pixel sprites ----------
   Art is laid out on a coarse grid (one art pixel = SP world units) and rasterised at R texels per art pixel:
   curves and lines resolve at half-pixel steps and fine details (faces, rivets, seams) go in at texel level.
   A post pass adds rim light, ground shade, light grain, snow caps and a thin outline tinted by what it borders. */
export const PAL = {
  ol: '#16140f',
  skin: '#d9a57c',
  skinD: '#b07e5a',
  hair: '#3a2a1c',
  boot: '#2a2620',
  olive: '#5b6f33',
  oliveD: '#3f4f22',
  oliveL: '#7a9343',
  khaki: '#a8956a',
  khakiD: '#7c6c48',
  khakiL: '#c7b487',
  brown: '#6f5439',
  brownD: '#4b3826',
  brownL: '#8f6e4a',
  sand: '#bba878',
  sandD: '#8e7d53',
  sandL: '#d6c798',
  grey: '#8e8c82',
  greyD: '#68665d',
  greyL: '#b5b3a6',
  metal: '#4b504b',
  metalD: '#2c302d',
  metalL: '#78807a',
  con: '#9d9b8f',
  conD: '#77756b',
  conL: '#c0beb1',
  red: '#a8322c',
  redL: '#d0503f',
  gold: '#e2b94b',
  goldD: '#a8842e',
  rob: '#3a3540',
  robD: '#221f27',
  robL: '#5c5466',
  eye: '#ff4030',
  glass: '#4f6b76',
  glassL: '#9cbcc4',
  wood: '#7b5a37',
  woodD: '#55402a',
  woodL: '#9a7650',
  canvas: '#606c3b',
  canvasD: '#48522b',
  canvasL: '#7b894d',
  tire: '#1e1e1c',
  hub: '#6c6c64',
  white: '#e8e4d2',
  black: '#151513',
  blue: '#4d6e8e',
  blueL: '#7096b4',
  earth: '#5a4630',
  earthL: '#7a6342',
  grass: '#5b7a33',
  grassL: '#7e9e45',
  rust: '#8a4a2a',
  fire: '#ffb040',
  fireL: '#ffe08a',
  brick: '#86523e',
  brickD: '#63392b',
  brickL: '#a2694f',
  plaster: '#b3a88f',
  plasterD: '#8c836d',
  char: '#2b2724',
  charL: '#4a433d'
};
export const FAC = {m: '#2f6e6a', d: '#1d4744', l: '#4f938c'}; // neutral garrison «Перевал»: teal field, white band, gold diamond
export const SPR = {}; // key -> {w,h,frames,ox,oy}
export const SHEETS = []; // finished strips: {key, fw, fh, frames, rgba}
export const R = 2; // texels per art pixel
const SNOWC = [
    [244, 247, 249],
    [226, 234, 240],
    [204, 215, 224]
  ],
  N4 = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ];
function hexRGB(h) {
  return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
}
export function tone(h, k) {
  return (
    '#' +
    hexRGB(h)
      .map(v =>
        Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
}
export function hash2(x, y) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function pxSprite(key, w, h, frames, draw, opt) {
  opt = opt || {};
  const fw = w * R + 2,
    fh = h * R + 2,
    cv = document.createElement('canvas');
  cv.width = fw * frames;
  cv.height = fh;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  for (let f = 0; f < frames; f++) {
    const ox = f * fw + 1,
      oy = 1,
      fill = (x, y, ww, hh, col) => {
        if (ww > 0 && hh > 0) {
          c.fillStyle = col;
          c.fillRect(ox + x, oy + y, ww, hh);
        }
      };
    const P = {
      /* coarse grid: art pixels; fractional coordinates land on half pixels */
      r(x, y, ww, hh, col) {
        const x0 = Math.round(x * R),
          y0 = Math.round(y * R);
        fill(x0, y0, Math.round((x + ww) * R) - x0, Math.round((y + hh) * R) - y0, col);
      },
      p(x, y, col) {
        this.r(x, y, 1, 1, col);
      },
      clr(x, y, ww, hh) {
        c.clearRect(
          ox + Math.round(x * R),
          oy + Math.round(y * R),
          Math.round((ww || 1) * R),
          Math.round((hh || 1) * R)
        );
      },
      tri(cx, top, half, hh, col) {
        const n = hh * R,
          m = (cx + 0.5) * R;
        for (let j = 0; j < n; j++) {
          const hw = ((half * (j + 1)) / n + 0.5) * R,
            a = Math.round(m - hw);
          fill(a, top * R + j, Math.round(m + hw) - a, 1, col);
        }
      },
      ell(cx, cy, rx, ry, col) {
        this.blob((cx + 0.5) * R, (cy + 0.5) * R, (rx + 0.5) * R, (ry + 0.5) * R, col);
      },
      half(cx, by, rx, ry, col) {
        const mx = (cx + 0.5) * R,
          b = (by + 1) * R,
          ax = (rx + 0.5) * R,
          ay = (ry + 0.5) * R;
        for (let j = b - 1; j >= b - (ry + 1) * R; j--) {
          const dy = Math.max(0, b - R / 2 - (j + 0.5)) / ay;
          if (dy >= 1) continue;
          const hw = ax * Math.sqrt(1 - dy * dy),
            a = Math.round(mx - hw);
          fill(a, j, Math.round(mx + hw) - a, 1, col);
        }
      },
      line(x0, y0, x1, y1, col) {
        this.tl(x0 * R, y0 * R, x1 * R, y1 * R, col, R);
      },
      speck(x, y, ww, hh, col, seed) {
        let q = seed || 7;
        for (let j = 0; j < hh * R; j++)
          for (let i = 0; i < ww * R; i++) {
            q = (q * 1103515245 + 12345) & 0x7fffffff;
            if (q % 19 === 0) fill(x * R + i, y * R + j, 1, 1, col);
          }
      },
      dith(x, y, ww, hh, col, ph) {
        for (let j = 0; j < hh * R; j++)
          for (let i = 0; i < ww * R; i++)
            if ((i + j + (ph || 0)) % 2 === 0) fill(x * R + i, y * R + j, 1, 1, col);
      },
      /* texel grid */
      t(x, y, ww, hh, col) {
        fill(
          Math.round(x),
          Math.round(y),
          ww == null ? 1 : Math.round(ww),
          hh == null ? 1 : Math.round(hh),
          col
        );
      },
      tl(x0, y0, x1, y1, col, th) {
        th = th || 1;
        x0 = Math.round(x0);
        y0 = Math.round(y0);
        x1 = Math.round(x1);
        y1 = Math.round(y1);
        const dx = Math.abs(x1 - x0),
          sx = x0 < x1 ? 1 : -1,
          dy = -Math.abs(y1 - y0),
          sy = y0 < y1 ? 1 : -1;
        let e = dx + dy;
        for (let n = 0; n < 999; n++) {
          fill(x0, y0, th, th, col);
          if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * e;
          if (e2 >= dy) {
            e += dy;
            x0 += sx;
          }
          if (e2 <= dx) {
            e += dx;
            y0 += sy;
          }
        }
      },
      blob(cx, cy, rx, ry, col) {
        for (let j = Math.floor(cy - ry); j < Math.ceil(cy + ry); j++) {
          const dy = (j + 0.5 - cy) / ry;
          if (dy * dy >= 1) continue;
          const hw = rx * Math.sqrt(1 - dy * dy),
            a = Math.round(cx - hw);
          fill(a, j, Math.round(cx + hw) - a, 1, col);
        }
      },
      /* paint only over what is already drawn inside a coarse rect */
      atop(x, y, ww, hh, fn) {
        c.save();
        c.globalCompositeOperation = 'source-atop';
        c.beginPath();
        c.rect(ox + x * R, oy + y * R, ww * R, hh * R);
        c.clip();
        fn();
        c.restore();
      },
      camo(x, y, ww, hh, cols, seed, n) {
        let q = seed || 5;
        const rn = () => {
          q = (q * 1103515245 + 12345) & 0x7fffffff;
          return (q >> 8) / 8388608;
        };
        this.atop(x, y, ww, hh, () => {
          for (let i = 0; i < (n || Math.ceil((ww * hh) / 4)); i++) {
            const bx = Math.round((x + rn() * ww) * R),
              by = Math.round((y + rn() * hh) * R),
              bw = 2 + Math.round(rn() * 4),
              col = cols[i % cols.length];
            fill(bx, by, bw, 2, col);
            fill(bx + 1, by - 1, Math.max(1, bw - 2), 4, col);
          }
        });
      },
      wheel(cx, cy, rr, f) {
        const mx = (cx + 0.5) * R,
          my = (cy + 0.5) * R,
          ro = (rr + 0.5) * R,
          ri = ro * 0.55,
          rot = ((f % 2) * Math.PI) / 4;
        for (let j = Math.floor(my - ro); j < Math.ceil(my + ro); j++)
          for (let i = Math.floor(mx - ro); i < Math.ceil(mx + ro); i++) {
            const dx = i + 0.5 - mx,
              dy = j + 0.5 - my,
              d = Math.hypot(dx, dy);
            if (d > ro) continue;
            const a = Math.atan2(dy, dx) + rot;
            let col = PAL.tire;
            if (d > ro - 1.3) col = Math.floor((a + 7) / (Math.PI / 5)) % 2 ? '#34332e' : PAL.tire;
            else if (d <= ri) {
              col = dx + dy < -ri * 0.6 ? '#9a9a8e' : PAL.hub;
              if (d < 1.3) col = PAL.metalD;
              else if (Math.abs(Math.sin(2 * a)) < 0.28) col = '#4e4e48';
            } else if (d <= ri + 1) col = '#121210';
            fill(i, j, 1, 1, col);
          }
      },
      bags(x, by, n, rows) {
        for (let rI = 0; rI < rows; rI++)
          for (let i = 0; i < n - rI; i++) {
            const bx = (x + rI * 3 + i * 6) * R,
              yy = (by - 3 - rI * 3) * R,
              base = rI % 2 ? PAL.sand : PAL.sandD,
              lt = rI % 2 ? PAL.sandL : PAL.sand;
            fill(bx + 1, yy, 10, 6, base);
            fill(bx, yy + 1, 12, 4, base);
            fill(bx + 2, yy + 1, 7, 1, lt);
            fill(bx + 1, yy + 2, 2, 1, lt);
            fill(bx + 2, yy + 5, 8, 1, tone(base, -0.22));
            fill(bx + 10, yy + 2, 1, 3, tone(base, -0.16));
            fill(bx + 5 + (i % 2), yy + 3, 2, 1, tone(base, -0.12));
          }
      },
      ins(x, y, r) {
        r = r || 2;
        const cx = Math.round(x * R),
          cy = Math.round(y * R);
        for (let j = -r; j <= r; j++)
          for (let i = -r; i <= r; i++) {
            const m = Math.abs(i) + Math.abs(j);
            if (m <= r) fill(cx + i, cy + j, 1, 1, m === r ? FAC.d : m === 0 ? PAL.gold : FAC.l);
          }
      },
      flag(x, y, f, len) {
        len = len || 14;
        const px = Math.round(x * R),
          py = Math.round(y * R);
        fill(px, py, 2, 2, PAL.gold);
        fill(px, py + 2, 1, len * R - 2, PAL.greyL);
        fill(px + 1, py + 2, 1, len * R - 2, PAL.grey);
        const FW = 18,
          FH = 9;
        for (let i = 0; i < FW; i++) {
          const ph = (i / FW) * Math.PI * 1.6 + (f % 2) * Math.PI,
            dy = Math.round(Math.sin(ph) * (0.4 + i / FW) * 1.3),
            sh = Math.cos(ph) * 0.13;
          for (let j = 0; j < FH; j++) {
            const ex = Math.abs(i - 5),
              ey = Math.abs(j - 3);
            let col = j === 6 ? PAL.white : j > 6 ? FAC.d : FAC.m;
            if (ex + ey <= 2) col = ex + ey === 0 ? FAC.d : PAL.gold;
            fill(px + 2 + i, py + 2 + j + dy, 1, 1, tone(col, sh));
          }
        }
      }
    };
    draw(P, f);
  }
  const W2 = cv.width,
    H2 = cv.height,
    out = spritePost(c.getImageData(0, 0, W2, H2).data, W2, H2, {
      ...opt,
      snow: opt.winter || SNOWY.test(key)
    });
  SPR[key] = {w, h, frames, ox: (R * Math.floor(w / 2) + 1) / fw, oy: (R * h + 1) / fh};
  const reg = (k, rgba) => SHEETS.push({key: k, fw, fh, frames, rgba});
  if (opt.winter) reg(key, out[1]);
  else {
    reg(key, out[0]);
    if (out[1]) {
      reg(key + '_w', out[1]);
      SPR[key + '_w'] = SPR[key];
      SPR[key].snow = true;
    }
  }
}
/* seasonal sprites: one texture per season (key_s0..key_s3), winter gets snow caps */
export function pxSeason(key, w, h, frames, draw, opt) {
  for (let si = 0; si < 4; si++)
    pxSprite(key + '_s' + si, w, h, frames, (P, f) => draw(P, f, si), {...opt, winter: si === 3});
  SPR[key] = SPR[key + '_s1'];
}
function spritePost(d, W2, H2, opt) {
  const on = (a, x, y) => x >= 0 && y >= 0 && x < W2 && y < H2 && a[(y * W2 + x) * 4 + 3] > 200;
  if (opt.shade !== false) {
    const src = new Uint8ClampedArray(d),
      gr = opt.grain == null ? 0.06 : opt.grain,
      rim = opt.rim == null ? 0.18 : opt.rim;
    for (let y = 0; y < H2; y++)
      for (let x = 0; x < W2; x++) {
        const i = (y * W2 + x) * 4;
        if (src[i + 3] <= 200) continue;
        let k = (hash2(x, y) - 0.5) * gr;
        if (!on(src, x, y - 1)) k += rim;
        else if (!on(src, x, y - 2)) k += rim * 0.3;
        if (!on(src, x - 1, y)) k += rim * 0.35;
        if (!on(src, x, y + 1)) k -= 0.16;
        if (!on(src, x + 1, y)) k -= 0.1;
        for (let ch = 0; ch < 3; ch++) {
          const v = src[i + ch];
          d[i + ch] = k > 0 ? v + (255 - v) * k : v * (1 + k);
        }
      }
  }
  const out = [d];
  if (opt.snow) {
    const s = new Uint8ClampedArray(d);
    for (let x = 0; x < W2; x++) {
      let y = 0;
      while (y < H2 && s[(y * W2 + x) * 4 + 3] <= 200) y++;
      for (let k = 0; k < 3 && y < H2; k++, y++) {
        const i = (y * W2 + x) * 4;
        if (s[i + 3] <= 200) break;
        s.set(SNOWC[k], i);
      }
    }
    out.push(s);
  }
  if (opt.outline !== false)
    for (const a of out) {
      const s = new Uint8ClampedArray(a);
      for (let y = 0; y < H2; y++)
        for (let x = 0; x < W2; x++) {
          const i = (y * W2 + x) * 4;
          if (s[i + 3] > 200) continue;
          let r = 0,
            g = 0,
            b = 0,
            n = 0;
          for (const [dx, dy] of N4)
            if (on(s, x + dx, y + dy)) {
              const j = ((y + dy) * W2 + x + dx) * 4;
              r += s[j];
              g += s[j + 1];
              b += s[j + 2];
              n++;
            }
          if (n) {
            a[i] = 14 + (r / n) * 0.3;
            a[i + 1] = 12 + (g / n) * 0.3;
            a[i + 2] = 9 + (b / n) * 0.3;
            a[i + 3] = 240;
          }
        }
    }
  return out;
}
const SNOWY =
  /^(medic|sniper|hq|wall|turret|mortar|atgm|bank|barracks|supply|launch|shop_|camp|depot|tower|radar|hermit|cache|e_|pine|hedgehog|boards|stake|truck|rock|stump|pole|fence|wire|barrels|crates|tires|wreck|hulk|house|chapel|heli|wagon|wtower|station|bus(?!h)|container|silo|barn|pylon|billboard|hay)/;
