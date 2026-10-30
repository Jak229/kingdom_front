/* The Phaser scene: creates the world and HUD, runs step() every frame and draws everything. */
import {
  C,
  GY,
  H,
  K,
  SEASONS,
  SEASON_DAYS,
  SHOPS,
  VEH,
  W,
  WILD,
  WORLD,
  dayLen,
  nightLen,
  season,
  seasonIdx
} from './config.js';
import {LANG, tokN, tr} from './i18n/index.js';
import {clamp, lerp, lerpColor, rnd, rng, roman} from './util.js';
import {S, input, newState, setS} from './state.js';
import {canUpgrade, fuelNeed, guardSides, inForest, reqFor} from './logic/rules.js';
import {TUT} from './logic/tutorial.js';
import {darkness, step} from './logic/step.js';
import {
  EYE,
  LIT,
  SPOT_KEY,
  bossBar,
  drawPortal,
  drawScaffold,
  eframe,
  ekey,
  flame,
  glow,
  lit,
  pipY,
  spc,
  spx,
  spy
} from './render/helpers.js';
import {ATLAS, SP, SPR, SPT, fname, initSprites, loadSprites} from './sprites.js';
import {AU} from './audio.js';
import {CG} from './crazygames.js';
import {LAYERS, SEASON_TINT, makeLayers} from './render/layers.js';
import {$} from './ui/dom.js';
import {TOUCH, buzz, touch} from './ui/touch.js';
import {TUT_BOTTOM, syncTut} from './ui/tutorial.js';
import {toggleSound} from './ui/settings.js';
import {syncAdButton} from './ui/adbutton.js';
import {PROF} from './meta.js';
import {skinTex} from './render/skins.js';
import {syncAwards} from './ui/meta.js';

// Text.setColor redraws the text and re-uploads its texture even when nothing changed, so skip same-colour calls
function recolor(t, c) {
  if (t.style.color !== c) t.setColor(c);
}

export class Main extends Phaser.Scene {
  constructor() {
    super('main');
  }
  preload() {
    loadSprites(this);
  }
  create() {
    const webgl = this.renderer.type === Phaser.WEBGL;
    this.WY = GY + 16;
    this.RH = 150;
    const world = [];
    const A = o => {
      world.push(o);
      return o;
    };
    this.sky = A(this.add.graphics().setScrollFactor(0).setDepth(0));
    makeLayers(this);
    this.layers = LAYERS.map((L, i) =>
      A(
        this.add
          .tileSprite(0, GY + 2 - L.h, W, L.h, L.key)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(1 + i)
          .setTileScale(1 / L.kx, 1 / L.ky)
      )
    );
    this.fog = A(this.add.graphics().setScrollFactor(0).setDepth(3.5));
    // ground bank at the water's edge
    const gr = (this.gr = A(this.add.graphics().setDepth(5)));
    gr.fillStyle(0x3b3a26, 1);
    gr.fillRect(0, GY, WORLD, 16);
    gr.fillStyle(0x56603a, 1);
    gr.fillRect(0, GY, WORLD, 3);
    gr.fillStyle(0x2c2b1c, 1);
    for (let x = 0; x < WORLD; x += 7) gr.fillRect(x, GY + 8 + ((x * 13) % 5), 3, 2);
    gr.fillStyle(0x6b7a44, 1);
    for (let x = 0; x < WORLD; x += 5) {
      const h = 2 + ((x * 7) % 5);
      gr.fillRect(x, GY - h, 1, h);
    }
    initSprites(this);
    {
      const r = rng(7);
      for (let x = 0; x < WORLD; x += 20 + r() * 60) {
        gr.fillStyle(r() < 0.5 ? 0x46442c : 0x332f20, 1);
        gr.fillRect(x, GY + 3 + r() * 7, 6 + r() * 18, 2);
      }
      for (let x = 0; x < WORLD; x += 9 + r() * 30) {
        gr.fillStyle(r() < 0.5 ? 0x7a7462 : 0x5e5a4a, 1);
        gr.fillRect(x, GY + 2 + r() * 11, 2, 1.5);
      }
    }
    // scenery: trees, props and landmark ruins (rebuilt per front, see buildDecor); tall grass in front of the units
    this.decoG = A(this.add.graphics().setDepth(5.3));
    this.decoC = A(this.add.container(0, 0).setDepth(5.5));
    this.frontC = A(this.add.container(0, 0).setDepth(6.4));
    this.crows = [];
    this.smokers = [];
    this.smoke = [];
    // buildings and units are pooled pixel sprites, refilled every frame in draw order
    this.bldC = A(this.add.container(0, 0).setDepth(6.1));
    this.unitC = A(this.add.container(0, 0).setDepth(6.3));
    this.pools = [this.bldC, this.unitC].map(c => ({c, list: [], n: 0}));
    this.seasonG = A(this.add.graphics().setDepth(5.2));
    this.seasonShown = -1;
    this.leaves = [];
    this.g = A(this.add.graphics().setDepth(6.5));
    this.fx = A(this.add.graphics().setDepth(7));
    this.light = A(this.add.graphics().setDepth(7.5).setBlendMode(Phaser.BlendModes.ADD));
    // water with a rippling reflection of everything above the bank
    this.water = A(this.add.graphics().setScrollFactor(0).setDepth(8));
    // the reflection is soft and half transparent, so it renders at a lower resolution than the scene (RK) and every other frame
    const RK = (this.RK = Math.min(K, 1.25));
    this.reflTex = this.textures.addDynamicTexture('refl', Math.round(W * RK), Math.round(this.RH * RK));
    this.reflTex.camera.setOrigin(0, 0).setZoom(RK);
    this.reflN = 0;
    const rtH = H - this.WY,
      n = Math.ceil(rtH / 3);
    this.strips = [];
    for (let i = 0; i < n; i++) {
      const im = A(
        this.add
          .image(0, this.WY + rtH, 'refl')
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(8.2)
          .setScale(1 / RK, -rtH / this.RH / RK)
          .setAlpha(0.5)
      );
      const r0 = (this.RH - ((i + 1) * this.RH) / n) * RK;
      im.setCrop(0, r0, W * RK, (this.RH / n + 1) * RK);
      im.k = i / n;
      this.strips.push(im);
    }
    this.waterFx = A(this.add.graphics().setScrollFactor(0).setDepth(8.5));
    this.rainG = A(this.add.graphics().setScrollFactor(0).setDepth(8.7));
    this.darkCv = document.createElement('canvas');
    this.darkCv.width = 192;
    this.darkCv.height = 108;
    this.darkCtx = this.darkCv.getContext('2d');
    this.darkTex = this.textures.addCanvas('dark', this.darkCv);
    this.darkOn = true;
    this.tutG = A(this.add.graphics().setDepth(9.6));
    this.overlay = A(
      this.add.image(0, 0, 'dark').setOrigin(0, 0).setScrollFactor(0).setDepth(9).setDisplaySize(W, H)
    );
    this.worldList = world;
    // HUD (separate camera, not pixelated)
    const ui = [];
    const U = o => {
      ui.push(o);
      return o;
    };
    const PF =
      '"Pixelify Sans", Rubik, "PingFang SC","Microsoft YaHei","Noto Sans CJK SC","WenQuanYi Zen Hei", system-ui, sans-serif';
    const tf = {fontFamily: PF, color: '#f1ecd6', stroke: '#14120c', strokeThickness: 4, resolution: K};
    this.hud = U(this.add.graphics().setScrollFactor(0).setDepth(10));
    this.coinTxt = U(
      this.add
        .text(40, 14, '', {...tf, fontSize: '22px'})
        .setScrollFactor(0)
        .setDepth(11)
    );
    this.crTxt = U(
      this.add
        .text(40, 44, '', {...tf, fontSize: '16px', color: '#bdeffa'})
        .setScrollFactor(0)
        .setDepth(11)
    );
    this.dayTxt = U(
      this.add
        .text(W - 16, 12, '', {...tf, fontSize: '18px', align: 'right'})
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(11)
    );
    this.hintTxt = U(
      this.add
        .text(W / 2, H - 14, '', {...tf, fontSize: '17px', align: 'center', wordWrap: {width: W - 100}})
        .setOrigin(0.5, 1)
        .setScrollFactor(0)
        .setDepth(11)
    );
    this.toastTxt = U(
      this.add
        .text(W / 2, 78, '', {...tf, fontSize: '18px', align: 'center', wordWrap: {width: W - 120}})
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(11)
    );
    this.bannerTxt = U(
      this.add
        .text(W / 2, 150, '', {...tf, fontSize: '54px', strokeThickness: 7, align: 'center'})
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(11)
        .setAlpha(0)
    );
    this.uiList = ui;
    this.cameras.main.setOrigin(0, 0).setZoom(K);
    this.uiCam = this.cameras
      .add(0, 0, Math.round(W * K), Math.round(H * K))
      .setOrigin(0, 0)
      .setZoom(K);
    this.cameras.main.ignore(ui);
    this.uiCam.ignore(world);
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,DOWN,A,D,S,SHIFT,M');
    this.input.keyboard.addCapture('LEFT,RIGHT,DOWN,UP,SPACE');
    this.camX = C - W / 2;
    this.flies = [];
    this.birds = [];
    this.drops = [];
    this.clouds = [];
    this.banner = null;
    this.rain = false;
    for (let i = 0; i < 5; i++)
      this.clouds.push({x: rnd(0, W * 2), y: rnd(30, 170), w: rnd(80, 180), s: rnd(4, 10)});
    for (let i = 0; i < 140; i++) this.drops.push({x: rnd(0, W), y: rnd(0, H), v: rnd(500, 700)});
    setS(newState());
    this.prev = {night: false, coins: S.coins, day: 1};
    window.__kg = {
      get S() {
        return S;
      },
      step,
      scene: this,
      input,
      AU,
      CG
    };
    CG.onHush(h => AU.setHush(h));
    CG.loaded();
  }
  // tex: another texture with the same frame names (a vehicle skin)
  spr(pool, key, frame, x, y, flip, tint, alpha, fill, tex) {
    if (this.winter && SPR[key].snow) key += '_w';
    const fr = fname(key, frame),
      tk = tex || ATLAS;
    let im = pool.list[pool.n++];
    if (!im) {
      im = new Phaser.GameObjects.Image(this, 0, 0, tk, fr);
      pool.c.add(im);
      pool.list.push(im);
    }
    if (im.texture.key !== tk) im.setTexture(tk, fr);
    else if (im.frame.name !== fr) im.setFrame(fr);
    const s = SPR[key];
    im.rotation = 0;
    im.setOrigin(s.ox, s.oy)
      .setScale(SPT)
      .setFlipX(!!flip)
      .setVisible(true)
      .setAlpha(alpha == null ? 1 : alpha);
    im.x = Math.round(x * K) / K;
    im.y = Math.round(y * K) / K;
    if (tint != null) {
      im.setTint(tint);
      im.tintFill = !!fill;
    } else if (im.isTinted) {
      im.clearTint();
      im.tintFill = false;
    }
    return im;
  }
  drawDark(dk, cx, now) {
    if (dk <= 0 && !this.darkOn) return;
    const c = this.darkCtx,
      sx = this.darkCv.width / W,
      sy = this.darkCv.height / H;
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, this.darkCv.width, this.darkCv.height);
    if (dk > 0) {
      c.fillStyle = 'rgba(6,10,22,' + (0.6 * dk).toFixed(3) + ')';
      c.fillRect(0, 0, this.darkCv.width, this.darkCv.height);
      c.globalCompositeOperation = 'destination-out';
      const hole = (wx, wy, r, a) => {
        const x = (wx - cx) * sx,
          y = wy * sy,
          R = r * sx;
        if (x < -R * 1.5 || x > this.darkCv.width + R * 1.5 || a <= 0) return;
        c.save();
        c.translate(x, y);
        c.scale(1.5, 1);
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, R);
        gr.addColorStop(0, 'rgba(0,0,0,' + a + ')');
        gr.addColorStop(0.5, 'rgba(0,0,0,' + a * 0.55 + ')');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gr;
        c.fillRect(-R, -R, R * 2, R * 2);
        c.restore();
      };
      const p = S.player,
        fl = 1 + Math.sin(now * 7) * 0.02;
      hole(p.x + p.dir * 30, GY - 40, 170 * fl, 0.82);
      hole(S.hq.x, GY - 50, 150 + S.hq.level * 25, 0.55);
      for (const cp of S.camps) hole(cp - 8, GY - 20, 95 * (1 + Math.sin(now * 9 + cp) * 0.05), 0.5);
      for (const sp of S.spots)
        if (sp.type === 'turret' && sp.level > 0) hole(sp.x + sp.aim * 60, GY - 30, 90, 0.3);
      if (S.squad) hole(S.squad.x, GY - 30, 90, 0.3);
      if (S.launch.level === 2) hole(S.launch.x, GY - 60, 140, 0.45);
      for (const b of S.booms) hole(b.x, GY - 30, 170, Math.min(0.9, b.life * 1.8));
      for (const m of S.missiles) hole(m.x, m.y, 50, 0.4);
    }
    this.darkTex.refresh();
    this.darkOn = dk > 0;
  }
  // signs belong to one game state: a new front mirrors the wild objects and a loaded save brings its own, so rebuild them
  makeSigns() {
    if (this.signsFor === S && this.signsLang === LANG) return;
    this.signsFor = S;
    this.signsLang = LANG;
    if (this.signs) for (const o of this.signs) o.destroy();
    const st = {
      fontFamily:
        '"Pixelify Sans", Rubik, "PingFang SC","Microsoft YaHei","Noto Sans CJK SC","WenQuanYi Zen Hei", sans-serif',
      fontSize: '12px',
      color: '#e8e2c4',
      stroke: '#1a1810',
      strokeThickness: 3,
      resolution: K
    };
    this.signs = [];
    const add = (x, y, t, s) => {
      const o = this.add
        .text(x, y, t, s || st)
        .setOrigin(0.5, 1)
        .setDepth(10.5)
        .setScrollFactor(0);
      o.wx = x;
      this.cameras.main.ignore(o);
      this.signs.push(o);
    };
    for (const sh of S.shops) add(sh.x, GY - SPR.shop_gun.h * SP - 6, SHOPS[sh.kind].sign);
    for (const cx of S.camps) add(cx + 4, GY - 24 * SP - 10, tr('campSign'), {...st, fontSize: '11px'});
    for (const w of S.wild) {
      const sg = WILD[w.type].sign;
      if (sg) {
        add(w.x, GY - SPR[w.type].h * SP - 6, sg, {...st, fontSize: '11px'});
        this.signs[this.signs.length - 1].wild = w;
      }
    }
  }
  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    const k = this.keys;
    input.left = k.LEFT.isDown || k.A.isDown || touch.left;
    input.right = k.RIGHT.isDown || k.D.isDown || touch.right;
    input.pay = k.DOWN.isDown || k.S.isDown || touch.pay;
    input.fast = k.SHIFT.isDown || touch.fast || touch.dash;
    if (Phaser.Input.Keyboard.JustDown(k.M)) toggleSound();
    step(dt);
    CG.setPlaying(S.running && !S.paused && !S.over && !S.won && $('menu').hidden);
    syncAdButton();
    syncTut();
    syncAwards();
    this.events_(dt);
    this.makeSigns();
    this.render(dt);
  }
  events_(dt) {
    const pv = this.prev;
    if (S.coins > pv.coins) AU.pickup();
    else if (S.coins < pv.coins) AU.coin();
    pv.coins = S.coins;
    if (S.night !== pv.night) {
      const se = season();
      this.rain = Math.random() < se.rain;
      this.snow = !!se.snow && Math.random() < se.snow;
      if (S.night) AU.horn();
      else {
        AU.bugle();
        this.showBanner(S.day);
      }
      pv.night = S.night;
    }
    if (pv.restart !== S) {
      pv.restart = S;
      pv.night = S.night;
      pv.coins = S.coins;
      this.rain = false;
      this.snow = !!season().snow;
    }
    AU.cx = this.camX + W / 2;
    if (S.sfx) {
      for (const e of S.sfx) {
        AU.play(e);
        if (e.k === 'hitPlayer') buzz(70);
        else if (e.k === 'collapse') buzz(35);
      }
      S.sfx.length = 0;
    }
    for (const b of S.booms)
      if (!b.heard) {
        b.heard = true;
        AU.play({k: 'boom', x: b.x});
      }
    const bm = S.people.find(m => m.working && m.role === 'builder' && Math.abs(m.x - AU.cx) < W);
    if (bm && AU.ctx && !AU.muted) {
      if (bm.task && !bm.task.type) AU.chop(bm.x);
      else AU.build(bm.x);
    }
    AU.update(dt, S, darkness(), this.rain, AU.cx);
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }
  }
  // tutorial arrow: a bobbing chevron over the target, or an arrow at the screen edge when it is off screen; a gold tick on the strip map
  tutMarks(cx, now, mmx, my) {
    const g = this.tutG;
    g.clear();
    const t = S.tut,
      st = t && TUT[t.i];
    if (!st || !st.at || $('tut').hidden) return;
    const a = st.at();
    if (!a) return;
    const b = Math.sin(now * 5) * 4;
    this.hud.fillStyle(0xe8c24a, 1);
    this.hud.fillRect(mmx(a.x) - 1, my - 3, 3, 5);
    if (a.x > cx + 14 && a.x < cx + W - 14) {
      const x = a.x,
        y = a.y - 4 + b;
      g.fillStyle(0x14120c, 0.9);
      g.fillTriangle(x - 10, y - 12, x + 10, y - 12, x, y + 3);
      g.fillRect(x - 4, y - 26, 8, 15);
      g.fillStyle(0xe8c24a, 1);
      g.fillTriangle(x - 7, y - 10, x + 7, y - 10, x, y);
      g.fillRect(x - 2, y - 24, 4, 14);
    } else {
      const s = a.x < cx ? -1 : 1,
        x = (s < 0 ? cx + 22 : cx + W - 22) + s * Math.abs(b),
        y = GY - 150;
      g.fillStyle(0x14120c, 0.9);
      g.fillTriangle(x + s * 13, y, x - s * 5, y - 13, x - s * 5, y + 13);
      g.fillRect(s < 0 ? x + 2 : x - 19, y - 5, 17, 10);
      g.fillStyle(0xe8c24a, 1);
      g.fillTriangle(x + s * 9, y, x - s * 3, y - 9, x - s * 3, y + 9);
      g.fillRect(s < 0 ? x + 4 : x - 17, y - 3, 13, 6);
    }
  }
  // the banner keeps only the day, so a language switch re-labels it
  showBanner(day) {
    this.banner = {day, t: 4.5};
  }
  bannerLabel(day) {
    const first = (day - 1) % SEASON_DAYS === 0;
    const dl = !!(S && S.daily && day === 1),
      nf = !!(S && S.front > 1 && day === 1);
    return (
      (dl ? tr('mod_' + S.daily.m) + ' · ' : nf ? tr('hudFront', roman(S.front), S.front) + ' · ' : '') +
      tr('hudDay', roman(day), day) +
      (first && !nf && !dl ? ' · ' + SEASONS[seasonIdx(day)].name : '')
    );
  }
  /* scenery for the current front: landmark groups (seeded by front), telegraph line, trees, props, grass */
  buildDecor() {
    // the operation of the day looks like the front whose robots it borrows
    const front = S.foe || S.front || 1;
    this.decoFront = front;
    this.seasonShown = -1;
    const dc = this.decoC,
      fc = this.frontC,
      dg = this.decoG;
    dc.removeAll(true);
    fc.removeAll(true);
    dg.clear();
    this.smokers = [];
    this.crows = [];
    const rn = rng(front * 7919 + 101),
      list = [];
    // everything is queued with a layer number and added back to front: far trees, landmarks, trees, props, grass
    const add = (z, key, f, x, o) => list.push({z, key, f, x, o: o || {}});
    const occ = [],
      block = (a, b) => occ.push([a, b]),
      free = (a, b) => a > 30 && b < WORLD - 30 && !occ.some(o => o[0] < b && o[1] > a),
      inner = x => Math.abs(x - C) < 1420;
    for (const sp of S.spots) {
      const r =
        sp.type === 'hq'
          ? 110
          : sp.type === 'launch' || sp.type === 'farm'
            ? 70
            : sp.type === 'barracks'
              ? 50
              : 34;
      block(sp.x - r, sp.x + r);
    }
    for (const sh of S.shops) block(sh.x - 42, sh.x + 42);
    for (const t of S.trees) block(t.x - 16, t.x + 16);
    for (const c of S.camps) block(c - 80, c + 80);
    for (const q of S.portals) block(q - 64, q + 64);
    for (const w of S.wild) {
      const r = w.type === 'depot' ? 72 : w.type === 'hermit' ? 50 : w.type === 'radar' ? 40 : 30;
      block(w.x - r, w.x + r);
    }
    const crater = (x, w) => {
      dg.fillStyle(0x2c271c, 1);
      dg.fillRect(x - w / 2, GY, w, 4);
      dg.fillRect(x - w * 0.35, GY + 4, w * 0.7, 2);
      dg.fillStyle(0x4a4432, 1);
      dg.fillRect(x - w / 2 - 4, GY - 1, 6, 2);
      dg.fillRect(x + w / 2 - 2, GY - 1, 6, 2);
    };
    const sag = (x0, x1, y, drop, col, a) => {
      dg.lineStyle(1, col, a);
      dg.beginPath();
      dg.moveTo(x0, y);
      for (let i = 1; i <= 14; i++) {
        const t = i / 14;
        dg.lineTo(x0 + (x1 - x0) * t, y + Math.sin(t * Math.PI) * drop);
      }
      dg.strokePath();
    };
    // landmark groups: [key, frame, centre (art px from the group's left edge), flip]; extras draw rails, wires, craters, smoke
    const G = {
      village: {
        items: [
          ['fence', 0, -13],
          ['house', 0, 32],
          ['house', 1, 110, 1],
          ['chapel', 0, 172],
          ['fence', 1, 208]
        ],
        smoke: [[40, 30]]
      },
      crash: {
        items: [
          ['heli', 0, 29],
          ['crates', 1, 70],
          ['rock', 0, 84]
        ],
        crater: [[26, 70]],
        smoke: [[22, 16]]
      },
      rail: {
        items: [
          ['wagon', 0, 28],
          ['wagon', 1, 87],
          ['wtower', 0, 136]
        ],
        rails: [-12, 152]
      },
      gas: {
        items: [
          ['billboard', 0, 20],
          ['station', 0, 94],
          ['wreck_car', 0, 158, 1],
          ['tires', 0, 180]
        ]
      },
      farm: {
        items: [
          ['hay', 0, 7],
          ['hay', 0, 21],
          ['barn', 0, 58],
          ['silo', 0, 108],
          ['fence', 0, 140],
          ['fence', 1, 164]
        ]
      },
      yard: {
        items: [
          ['crates', 0, 7],
          ['container', 0, 40],
          ['container', 1, 92],
          ['barrels', 0, 125],
          ['tires', 0, 140]
        ]
      },
      battle: {
        items: [
          ['wire', 0, 12],
          ['hulk', 0, 38],
          ['wreck_tank', 0, 84],
          ['hulk', 0, 130, 1],
          ['wire', 0, 158]
        ],
        crater: [
          [60, 46],
          [120, 30]
        ],
        smoke: [[80, 16]]
      },
      power: {
        items: [
          ['pylon', 0, 15],
          ['bush', 1, 60],
          ['pylon', 0, 175]
        ],
        pylons: [15, 175]
      },
      road: {
        items: [
          ['bus', 0, 33],
          ['pole', 0, 78],
          ['wreck_car', 0, 108, 1],
          ['barrels', 1, 136]
        ],
        smoke: [[14, 10]]
      }
    };
    const keys = Object.keys(G);
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(rn() * (i + 1));
      [keys[i], keys[j]] = [keys[j], keys[i]];
    }
    let placed = 0,
      sides = [0, 0];
    for (const gk of keys) {
      if (placed >= 6) break;
      const g = G[gk];
      let e0 = 1e9,
        e1 = -1e9;
      for (const [k, , cx] of g.items) {
        const hw = SPR[k].w / 2;
        e0 = Math.min(e0, cx - hw);
        e1 = Math.max(e1, cx + hw);
      }
      for (let tries = 0; tries < 80; tries++) {
        const side = sides[0] < sides[1] ? -1 : sides[1] < sides[0] ? 1 : rn() < 0.5 ? -1 : 1,
          x0 =
            side < 0
              ? 60 + rn() * (C - 1560 - (e1 - e0) * SP)
              : C + 1500 + rn() * (C - 1560 - (e1 - e0) * SP);
        const a = x0 + e0 * SP - 36,
          b = x0 + e1 * SP + 36;
        if (!free(a, b) || inner(a) || inner(b)) continue;
        block(a, b);
        placed++;
        sides[side < 0 ? 0 : 1]++;
        if (g.rails) {
          const r0 = x0 + g.rails[0] * SP,
            r1 = x0 + g.rails[1] * SP;
          dg.fillStyle(0x3a2c20, 1);
          for (let x = r0; x < r1; x += 10) dg.fillRect(x, GY, 6, 3);
          dg.fillStyle(0x6a6a62, 1);
          dg.fillRect(r0, GY - 1.5, r1 - r0, 1.5);
          dg.fillStyle(0x3a3a34, 1);
          dg.fillRect(r0, GY, r1 - r0, 1);
        }
        for (const [cx, w] of g.crater || []) crater(x0 + cx * SP, w);
        for (const [k, f, cx, fl] of g.items) add(1, k, f, x0 + cx * SP, {flip: !!fl, seas: k === 'bush'});
        if (g.pylons) {
          const [p0, p1] = g.pylons.map(v => x0 + v * SP);
          for (const [yy, dx] of [
            [74, -13],
            [74, 12.5],
            [64, -13],
            [64, 12.5]
          ])
            sag(p0 + dx * SP, p1 + dx * SP, GY - yy * SP + 2, 26, 0x26262a, 0.75);
        }
        for (const [cx, hh] of g.smoke || []) this.smokers.push({x: x0 + cx * SP, y: GY - hh * SP});
        break;
      }
    }
    // telegraph line along the road outside the walls
    for (const sd of [-1, 1]) {
      let last = null;
      for (let x = C + sd * 1480; x > 60 && x < WORLD - 60; x += sd * (170 + rn() * 40)) {
        if (!free(x - 8, x + 8)) {
          last = null;
          continue;
        }
        add(3, 'pole', 0, x);
        block(x - 8, x + 8);
        if (last !== null && Math.abs(last - x) < 260)
          for (const dx of [-3, 3]) sag(last + dx * SP, x + dx * SP, GY - 43 * SP, 10, 0x2a2620, 0.7);
        last = x;
      }
    }
    const tree = (z, x, o) => {
      const v = rn();
      o.flip = rn() < 0.5;
      if (v < 0.4) add(z, 'pine', 0, x, o);
      else if (v < 0.7) add(z, 'tree', 0, x, {...o, seas: true});
      else if (v < 0.95) add(z, 'tree', 1, x, {...o, seas: true});
      else add(z, 'pine', 1, x, o);
    };
    // far row: darker trees behind everything, sparse inside the walls and clear of the HQ
    for (let x = 20; x < WORLD - 20; x += (inner(x) ? 120 : 34) + rn() * (inner(x) ? 200 : 70)) {
      if (Math.abs(x - C) < 330) continue;
      tree(0, x, {far: 1});
    }
    // near trees in clusters outside the walls, keeping interactive objects clear
    for (let x = 40; x < WORLD - 40; ) {
      if (!inner(x) && free(x - 14, x + 14) && rn() < 0.62) {
        const n = 1 + Math.floor(rn() * 3);
        let xx = x;
        for (let i = 0; i < n && free(xx - 12, xx + 12); i++) {
          tree(2, xx, {});
          block(xx - 10, xx + 10);
          xx += 14 + rn() * 22;
        }
        if (rn() < 0.55 && free(xx - 6, xx + 14))
          add(3, 'bush', rn() < 0.5 ? 0 : 1, xx + 4, {seas: true, flip: rn() < 0.5});
        x = xx + 20 + rn() * 70;
        continue;
      }
      if (!inner(x) && free(x - 12, x + 12)) {
        const v = rn();
        if (v < 0.38) add(3, 'bush', rn() < 0.5 ? 0 : 1, x, {seas: true, flip: rn() < 0.5});
        else if (v < 0.52) add(3, 'rock', rn() < 0.5 ? 0 : 1, x, {flip: rn() < 0.5});
        else if (v < 0.62) add(3, 'stump', rn() < 0.6 ? 0 : 1, x, {flip: rn() < 0.5});
        else if (v < 0.68) add(3, 'hedgehog', 0, x);
        else if (v < 0.74) crater(x, 30 + rn() * 20);
      } else if (inner(x) && Math.abs(x - C) > 140 && free(x - 14, x + 14) && rn() < 0.35) {
        const v = rn();
        if (v < 0.28) add(3, 'crates', rn() < 0.5 ? 0 : 1, x, {flip: rn() < 0.5});
        else if (v < 0.46) add(3, 'barrels', rn() < 0.5 ? 0 : 1, x, {flip: rn() < 0.5});
        else if (v < 0.56) add(3, 'tires', 0, x);
        else if (v < 0.7) add(3, 'rock', 1, x);
        else add(3, 'bush', rn() < 0.5 ? 0 : 1, x, {seas: true, flip: rn() < 0.5});
        block(x - 14, x + 14);
      }
      x += 24 + rn() * 60;
    }
    for (let x = 10; x < WORLD; x += 10 + rn() * 30)
      add(4, 'grass', Math.floor(rn() * 3), x, {seas: true, flip: rn() < 0.5});
    for (let x = 0; x < WORLD; x += 40 + rn() * 100) {
      if (inner(x) && rn() < 0.5) continue;
      add(5, 'fgrass', Math.floor(rn() * 3), x, {seas: true, flip: rn() < 0.5, c: fc, y: 13});
    }
    list.sort((a, b) => a.z - b.z);
    for (const {key, f, x, o} of list) {
      const s = SPR[key],
        im = new Phaser.GameObjects.Image(
          this,
          Math.round(x * K) / K,
          GY + (o.y || 0),
          ATLAS,
          fname(o.seas ? key + '_s1' : key, f)
        )
          .setOrigin(s.ox, s.oy)
          .setScale(SPT)
          .setFlipX(!!o.flip);
      if (o.far) im.setTint(0x828c7e);
      im.base = key;
      im.fr = f;
      im.seas = !!o.seas;
      im.cull = (s.w * SP) / 2 + 30;
      (o.c || dc).add(im);
    }
  }
  applySeason(si) {
    this.seasonShown = si;
    this.winter = si === 3;
    for (const ct of [this.decoC, this.frontC])
      for (const im of ct.list) {
        const k = im.seas ? im.base + '_s' + si : this.winter && SPR[im.base].snow ? im.base + '_w' : im.base;
        const fr = fname(k, im.fr);
        if (im.frame.name !== fr) im.setFrame(fr);
      }
    const g = this.seasonG;
    g.clear();
    if (si === 0) {
      g.fillStyle(0x6f9a3e, 1);
      g.fillRect(0, GY, WORLD, 2);
      for (let x = 3; x < WORLD; x += 11) {
        const c = (x * 7) % 3;
        g.fillStyle(c === 0 ? 0xe8e070 : c === 1 ? 0xf0eee0 : 0x8ab84e, 1);
        g.fillRect(x, GY - 2 - ((x * 13) % 3), 2, 2);
      }
    } else if (si === 2) {
      g.fillStyle(0x8a7434, 1);
      g.fillRect(0, GY, WORLD, 2);
      for (let x = 2; x < WORLD; x += 6) {
        const c = (x * 7) % 3;
        g.fillStyle(c === 0 ? 0xc0702a : c === 1 ? 0x9a5a24 : 0xd8a040, 1);
        g.fillRect(x, GY + ((x * 13) % 5), 3, 2);
      }
    } else if (si === 3) {
      g.fillStyle(0xdfe6ea, 1);
      g.fillRect(0, GY - 2, WORLD, 6);
      g.fillStyle(0xf2f6f8, 1);
      g.fillRect(0, GY - 2, WORLD, 2);
      for (let x = 0; x < WORLD; x += 37) {
        const w = 14 + ((x * 7) % 22);
        g.fillStyle(0xeef2f5, 1);
        g.fillRect(x, GY - 4, w, 2);
        g.fillRect(x + 3, GY - 5, w - 6, 1);
      }
      g.fillStyle(0xc8d2d8, 1);
      for (let x = 5; x < WORLD; x += 9) g.fillRect(x, GY + 5 + ((x * 11) % 7), 2, 1);
    }
  }
  render(dt) {
    const g = this.g,
      fx = this.fx,
      L = this.light,
      hud = this.hud,
      dk = darkness(),
      p = S.player,
      now = performance.now() / 1000;
    const want = clamp(p.x - W / 2 + p.dir * 70, 0, WORLD - W);
    this.camX = lerp(this.camX, want, 0.08);
    const cx = Math.round(this.camX * K) / K;
    this.cameras.main.scrollX = cx;
    if (this.decoFront !== (S.foe || S.front || 1)) this.buildDecor();
    const si = seasonIdx(S.day);
    if (si !== this.seasonShown) this.applySeason(si);
    const wint = si === 3 ? 1 : 0;
    for (const ct of [this.decoC, this.frontC])
      for (const im of ct.list) im.visible = im.x > cx - im.cull && im.x < cx + W + im.cull;
    const dusk = dk > 0 && dk < 1 ? Math.sin(dk * Math.PI) : 0,
      rainK = this.rain ? 1 : 0;
    // sky
    const sky = this.sky;
    sky.clear();
    const top = lerpColor(lerpColor(0x7f9fb4, 0x0a0e1c, dk), 0x6a7078, rainK * 0.5 * (1 - dk)),
      bot = lerpColor(lerpColor(0xdcd9c2, 0x26304a, dk), 0xa0a4a6, rainK * 0.5 * (1 - dk));
    for (let i = 0; i < 24; i++) {
      const t = i / 23;
      let c = lerpColor(top, bot, t * t);
      c = lerpColor(c, 0xe08a50, dusk * t * 0.7);
      c = lerpColor(c, 0xc4ccd4, wint * 0.35 * (1 - dk));
      sky.fillStyle(c, 1);
      sky.fillRect(0, (i * GY) / 24, W, GY / 24 + 1);
    }
    if (dk > 0.4) {
      for (let i = 0; i < 70; i++) {
        const sx = (i * 137.3) % W,
          sy = (i * 71.7) % (GY - 160),
          tw = 0.5 + 0.5 * Math.sin(now * 2 + i);
        sky.fillStyle(0xffffff, (dk - 0.4) * 1.6 * tw * (1 - rainK * 0.8));
        sky.fillRect(sx, sy, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
      }
    }
    const dayT = S.night ? S.phaseT / nightLen() : S.phaseT / dayLen(),
      arcX = W * 0.08 + dayT * W * 0.84,
      arcY = 330 - Math.sin(dayT * Math.PI) * 260;
    if (S.night) {
      sky.fillStyle(0xf3efd6, 0.9 * (1 - rainK * 0.7));
      sky.fillCircle(arcX, arcY, 18);
      sky.fillStyle(lerpColor(top, bot, 0.3), 1);
      sky.fillCircle(arcX + 7, arcY - 4, 15);
    } else {
      sky.fillStyle(0xfff3c4, 0.25 * (1 - rainK * 0.8));
      sky.fillCircle(arcX, arcY, 42);
      sky.fillStyle(0xfff3c4, 1 - rainK * 0.8);
      sky.fillCircle(arcX, arcY, 22);
    }
    for (const cl of this.clouds) {
      cl.x -= cl.s * dt;
      if (cl.x + cl.w < -200) cl.x = W * 2;
      const x = cl.x - cx * 0.03;
      sky.fillStyle(lerpColor(lerpColor(0xf4f1e4, 0x2a3048, dk), 0x8a8e94, rainK * 0.6), 0.55 + rainK * 0.3);
      sky.fillEllipse(x, cl.y, cl.w, cl.w * 0.28);
      sky.fillEllipse(x + cl.w * 0.25, cl.y - 8, cl.w * 0.6, cl.w * 0.3);
      sky.fillEllipse(x - cl.w * 0.25, cl.y + 3, cl.w * 0.5, cl.w * 0.2);
    }
    // birds in daytime
    if (!S.night && dk < 0.3 && !this.rain && si < 3 && this.birds.length < 2 && Math.random() < dt * 0.15)
      this.birds.push({x: -30, y: rnd(60, 200), vx: rnd(30, 55), n: 3 + ((Math.random() * 4) | 0), ph: 0});
    for (const b of this.birds) {
      b.x += b.vx * dt;
      b.ph += dt * 8;
      for (let i = 0; i < b.n; i++) {
        const bx = b.x - i * 14,
          by = b.y + Math.abs(i - b.n / 2) * 7,
          f = Math.sin(b.ph + i) * 3;
        sky.lineStyle(1.5, 0x2a2c2a, 0.8);
        sky.lineBetween(bx - 4, by - f, bx, by);
        sky.lineBetween(bx, by, bx + 4, by - f);
      }
    }
    this.birds = this.birds.filter(b => b.x < W + 120);
    // parallax tints
    LAYERS.forEach((Ld, i) => {
      const im = this.layers[i];
      im.tilePositionX = cx * Ld.f * Ld.kx;
      let c = lerpColor(Ld.day, Ld.night, dk);
      c = lerpColor(c, Ld.dusk, dusk * 0.6);
      c = lerpColor(c, 0x8a9098, rainK * 0.3 * (1 - dk));
      const st = SEASON_TINT[si];
      if (st) c = lerpColor(c, dk > 0.5 ? st.n : st.c, st.w[i] * (dk > 0.5 ? 0.5 : 1));
      im.setTint(c);
    });
    // fog
    const fg = this.fog;
    fg.clear();
    const fc = lerpColor(0xe9ece6, 0x4a5672, dk);
    for (let i = 0; i < 7; i++) {
      const x = ((i * 260 - cx * 0.5 + now * (8 + i * 3)) % (W + 600)) - 300;
      fg.fillStyle(fc, 0.045 + rainK * 0.04);
      fg.fillEllipse(x, GY - 30 - (i % 3) * 22, 420, 46);
    }
    g.clear();
    fx.clear();
    L.clear();
    const vx0 = cx - 220,
      vx1 = cx + W + 220,
      vis = x => x > vx0 && x < vx1;
    const B = this.pools[0],
      U = this.pools[1],
      wave = ((now * 3) | 0) % 2;
    B.n = 0;
    U.n = 0;
    for (const c of S.camps)
      if (vis(c)) {
        const fxx = spx('camp', c, 29);
        this.spr(B, 'camp', 0, c, GY);
        flame(fx, fxx, spy('camp', GY, 20), now, c);
        glow(L, fxx, GY - 16, 80, 0xff9a40, (0.05 + 0.12 * dk) * (1 + 0.15 * Math.sin(now * 9 + c)));
        if (Math.random() < dt * 6)
          S.puffs.push({
            x: fxx + rnd(-3, 3),
            y: GY - 24,
            vx: rnd(-6, 6),
            vy: rnd(-40, -25),
            life: rnd(0.6, 1.2),
            color: 0xffa040
          });
      }
    S.portals.forEach((px, i) => {
      if (vis(px)) {
        drawPortal(fx, px, dk, i);
        if (!S.portalDead[i]) glow(L, px, GY - 42, 110, 0x9b4dff, 0.05 + 0.1 * dk);
      }
    });
    // the forest round the base: standing, marked for felling (ribbon), being chopped (shakes), falling, stump
    for (const t of S.trees) {
      if (!vis(t.x)) continue;
      const key = t.pine ? 'pine' : 'tree_s' + si;
      if (t.st === 2) {
        this.spr(B, 'stump', t.f, t.x, GY, t.flip);
        if (t.fall != null && t.fall < 1) {
          t.fall = Math.min(1, t.fall + dt * 1.4);
          const k = t.fall,
            im = this.spr(B, key, t.f, t.x, GY, t.flip, null, k > 0.8 ? (1 - k) * 5 : 1);
          im.rotation = (t.x < C ? -1 : 1) * k * k * 1.5;
        }
        continue;
      }
      const shake = t.st === 1 && t.chop !== t.pc ? Math.sin(now * 45) * 0.6 : 0;
      t.pc = t.chop;
      this.spr(B, key, t.f, t.x + shake, GY, t.flip);
      if (t.st === 1) {
        const ry = GY - 16 - 2 * Math.sin(now * 3 + t.x);
        fx.fillStyle(0x14120c, 0.8);
        fx.fillRect(t.x - 4, ry - 1, 9, 5);
        fx.fillStyle(0xe8c24a, 1);
        fx.fillRect(t.x - 3, ry, 7, 3);
        fx.fillTriangle(t.x + 4, ry, t.x + 9, ry + 4 + Math.sin(now * 4 + t.x), t.x + 4, ry + 3);
      }
    }
    for (const sh of S.shops)
      if (vis(sh.x)) {
        const open = S.hq.level >= sh.minHq;
        this.spr(B, 'shop_' + sh.kind, 0, sh.x, GY, false, open ? null : 0x8a8a80);
        for (let i = 0; i < sh.tools; i++)
          this.spr(B, 'item_' + sh.kind, 0, sh.x + (i * 5 - 7.5) * SP, GY - 2 * SP);
        if (!open) this.spr(B, 'boards', 0, sh.x, GY - 3 * SP);
      }
    for (const sp of S.spots) {
      if (!vis(sp.x)) continue;
      const x = sp.x;
      if (sp.type === 'hq') {
        const key = 'hq' + sp.level;
        this.spr(B, key, wave, x, GY);
        lit(fx, key, x, GY, LIT[key], 0xffd27a, 0.65 * dk);
        glow(L, x, GY - 30, 170, 0xffc070, 0.12 * dk);
        if (sp.level === 1)
          glow(
            L,
            spx(key, x, 48) + 1,
            spy(key, GY, 13),
            40,
            0xff5040,
            0.04 + 0.1 * dk * (Math.sin(now * 3) > 0 ? 1 : 0.3)
          );
        if (sp.level === 4) {
          const bl = Math.sin(now * 3) > 0;
          fx.fillStyle(0xff3b3b, bl ? 1 : 0.3);
          fx.fillRect(spx(key, x, 80), spy(key, GY, 0) - SP, SP, SP);
          if (bl) glow(L, spx(key, x, 80), spy(key, GY, 0), 20, 0xff3030, 0.25);
        }
      } else if (sp.level > 0) {
        const t = sp.type,
          key = SPOT_KEY[t](sp.level),
          fl = sp.aim < 0;
        if (t === 'wall') {
          this.spr(B, key, 0, x, GY);
          if (sp.level === 3 && S.night) lit(fx, key, x, GY, LIT.wall3, 0xffb030, 0.35 + 0.3 * Math.random());
          if (sp.hp < sp.maxHp) {
            const w = 32,
              yy = GY - SPR[key].h * SP - 14;
            g.fillStyle(0x000000, 0.6);
            g.fillRect(x - w / 2, yy, w, 4);
            g.fillStyle(sp.hp / sp.maxHp > 0.4 ? 0x8fd16a : 0xff5a5a, 1);
            g.fillRect(x - w / 2, yy, (w * sp.hp) / sp.maxHp, 4);
          }
        } else if (t === 'turret') {
          this.spr(B, key, 0, x, GY, fl);
          if (dk > 0.2) {
            const a = sp.aim,
              sw = Math.sin(now / 1.4 + x) * 0.35,
              len = 360,
              ang = (a > 0 ? 0 : Math.PI) + (a > 0 ? 1 : -1) * (0.18 + sw * 0.3),
              x2 = x + Math.cos(ang) * len,
              y2 = GY - 80 + Math.abs(Math.sin(ang)) * len * 0.5 + 40;
            const ly = spy(key, GY, 8);
            fx.fillStyle(0xfff6c8, 0.09 * dk);
            fx.fillTriangle(x + a * 4 * SP, ly, x2, y2 - 26, x2, y2 + 26);
            glow(L, x + a * 5 * SP, ly, 26, 0xfff0c0, 0.18 * dk);
          }
        } else if (t === 'mortar') this.spr(B, key, 0, x - (sp.aim || 1) * (sp.recoil || 0) * 4, GY, fl);
        else if (t === 'atgm') this.spr(B, key, 0, x, GY, fl);
        else if (t === 'sniper') {
          this.spr(B, key, 0, x, GY, fl);
          if (sp.flash > 0) {
            const mx = spc(key, x, 21, fl),
              my = spy(key, GY, 10);
            fx.fillStyle(0xfff3c0, 1);
            fx.fillRect(mx - 2, my - 2, 4, 4);
            glow(L, mx, my, 20, 0xffe0a0, 0.4);
          }
        } else if (t === 'bank') {
          this.spr(B, key, 0, x, GY);
          const n = Math.min(8, sp.saved || 0);
          for (let i = 0; i < n; i++) this.spr(B, 'bar', 0, x + 19 * SP, GY - i * 2 * SP);
        } else if (t === 'launch') {
          const up = sp.level >= 2 || S.won;
          this.spr(B, key, up ? 1 : 0, x, GY);
          const ry = S.won ? S.rocketY : 0,
            rx = spx('launch', x, 8),
            rc = rx + SP / 2,
            ty = spy('launch', GY, 60);
          if (sp.level === 2 && !S.won && dk > 0.2) glow(L, x, GY - 30 * SP, 130, 0xfff0c0, 0.22 * dk);
          if (sp.level === 2 && !S.won) {
            const w = 46,
              yy = ty - SPR.rocket.h * SP - 14,
              need = fuelNeed(),
              f = Math.min(need, sp.fuel || 0);
            g.fillStyle(0x000000, 0.6);
            g.fillRect(rc - w / 2, yy, w, 4);
            g.fillRect(rc - w / 2, yy + 6, w, 3);
            g.fillStyle(sp.hp / sp.maxHp > 0.4 ? 0x8fd16a : 0xff5a5a, 1);
            g.fillRect(rc - w / 2, yy, (w * Math.max(0, sp.hp)) / sp.maxHp, 4);
            g.fillStyle(0x7fc8ff, 1);
            g.fillRect(rc - w / 2, yy + 6, (w * f) / need, 3);
          }
          if (up && ry < 700) {
            const by = ty - ry;
            this.spr(B, 'rocket', 0, rx, by);
            if (S.won) {
              fx.fillStyle(0xffb347, 0.9);
              fx.fillRect(rc - 6, by, 12, 22 + Math.random() * 24);
              fx.fillStyle(0xfff3b0, 0.95);
              fx.fillRect(rc - 3, by, 6, 12 + Math.random() * 8);
              glow(L, rc, by + 16, 90, 0xffa040, 0.35);
            }
          }
        } else this.spr(B, key, 0, x, GY);
      }
      if (sp.paid) drawScaffold(g, sp);
      else if (sp.level === 0) {
        const near = Math.abs(sp.x - p.x) < 160;
        if (near && canUpgrade(sp))
          this.spr(B, SPOT_KEY[sp.type](1), 0, x, GY, sp.aim < 0, 0xf0ecd0, 0.28, true);
        // a position still in the forest gets the grey stake until the trees around it are down
        this.spr(B, 'stake', S.hq.level >= reqFor(sp, 1) && !inForest(sp.x) ? 0 : 1, x, GY);
      }
    }
    for (const w of S.wild)
      if (vis(w.x)) {
        const x = w.x;
        if (w.type === 'cache') {
          this.spr(B, w.done ? 'cache_open' : 'cache', 0, x, GY);
          if (!w.done) {
            fx.fillStyle(0xffe27a, 0.5 + 0.5 * Math.sin(now * 4));
            fx.fillRect(x - SP / 2, GY - 12 * SP, SP, SP);
            glow(L, x, GY - 14, 30, 0xffd84a, 0.06 + 0.04 * Math.sin(now * 4));
          }
        } else if (w.type === 'depot') {
          if (S.player.veh !== w.veh) this.spr(B, 'e_' + w.veh, 0, x, GY, false, w.done ? null : 0x77776e);
          this.spr(B, 'depot', 0, x, GY);
        } else if (w.type === 'tower') {
          this.spr(B, 'tower', w.done ? wave : 0, x, GY);
          if (w.done) {
            const tx = spx('tower', x, 10) + SP / 2,
              ty = spy('tower', GY, 0);
            glow(L, tx, ty, 24, 0xff3030, 0.12 + 0.12 * Math.sin(now * 3));
            fx.lineStyle(1, 0x9fe0ff, 0.4 * (1 + Math.sin(now * 5)));
            fx.strokeCircle(tx, ty + 4, 8 + ((now * 25) % 20));
          }
        } else if (w.type === 'dog') {
          if (!w.done) {
            this.spr(B, 'dog', ((now * 1.5) | 0) % 3 === 0 ? 6 : 4, x, GY, true);
          }
        } else if (w.type === 'radar') this.spr(B, 'radar', w.done ? ((now * 5) | 0) % 3 : 1, x, GY);
        else if (w.type === 'hermit') {
          this.spr(B, 'hermit', 0, x, GY);
          if (!w.done) {
            glow(L, spx('hermit', x, 12), spy('hermit', GY, 18), 36, 0xffc070, 0.05 + 0.12 * dk);
            if (Math.random() < 0.04)
              S.puffs.push({
                x: spx('hermit', x, 29),
                y: spy('hermit', GY, 0),
                vx: rnd(-4, 4),
                vy: -24,
                life: 1.4,
                color: 0x9a9a92
              });
          }
        }
      }
    if (S.dog && vis(S.dog.x)) {
      const d = S.dog,
        f = d.mode === 'dig' ? 5 + (((d.anim * 8) | 0) % 2) : d.moving ? ((d.anim * 12) | 0) % 4 : 4;
      this.spr(U, 'dog', f, d.x, GY, d.dir < 0);
      if (d.bark > 0) {
        const bx = d.x + d.dir * 12,
          by = spy('dog', GY, 0) - 6;
        fx.fillStyle(0xfff3c0, 1);
        fx.fillRect(bx - 1, by - 8, 3, 6);
        fx.fillRect(bx - 1, by, 3, 2);
      }
    }
    for (const r of S.rabbits)
      if (vis(r.x)) {
        this.spr(U, 'recon', ((r.anim * 20) | 0) % 2, r.x, r.y + 2 * SP);
        const on = Math.sin(r.anim * 8) > 0;
        fx.fillStyle(0xff3030, on ? 1 : 0.25);
        fx.fillRect(spx('recon', r.x, 8), r.y + SP, SP, SP);
      }
    for (const m of S.people)
      if (vis(m.x)) {
        let f = 0;
        if (m.working && m.role === 'builder') f = 4 + (((m.anim * 5) | 0) % 2);
        else if (m.moving) f = ((m.anim * 8) | 0) % 4;
        const hurt = m.hurt > 0;
        this.spr(U, 'p_' + m.role, f, m.x, GY, m.dir < 0, hurt ? 0xffa090 : null);
        if (m.vet) {
          // specialists wear a gold chevron
          const vy = spy('p_guard', GY, 0) - (hurt ? 14 : 5);
          fx.fillStyle(0x14120c, 0.85);
          fx.fillTriangle(m.x - 5, vy - 1, m.x + 5, vy - 1, m.x, vy + 4);
          fx.fillStyle(0xe8c24a, 1);
          fx.fillTriangle(m.x - 3.5, vy - 0.5, m.x + 3.5, vy - 0.5, m.x, vy + 3);
        }
        if (hurt) {
          const hy = spy('p_guard', GY, 0) - 8;
          fx.fillStyle(0xffffff, 1);
          fx.fillRect(m.x - 3, hy - 2, 7, 6);
          fx.fillStyle(0x2f8a4a, 1);
          fx.fillRect(m.x - 1, hy - 1, 3, 4);
          fx.fillRect(m.x - 2, hy, 5, 2);
        }
      }
    for (const e of S.enemies)
      if (vis(e.x)) {
        if (e.kind === 'hive') {
          const by = e.y + 11 * SP,
            fl = e.dir < 0;
          this.spr(U, 'hive', ((e.anim * 20) | 0) % 2, e.x, by, fl);
          glow(L, spc('hive', e.x, 41, fl), spy('hive', by, 9) + SP / 2, 22, 0xff3030, 0.35);
          glow(L, e.x, spy('hive', by, 19), 34, 0xb06cff, 0.22 + 0.12 * Math.sin(now * 4));
          if (e.hp < e.maxHp) bossBar(g, e, by - SPR.hive.h * SP - 10, 60);
          continue;
        }
        if (e.fly) {
          const by = e.y + 6 * SP;
          if (e.cargo) this.spr(U, 'robot', 0, e.x, by + 15 * SP, e.dir < 0);
          this.spr(U, 'carrier', ((e.anim * 20) | 0) % 2, e.x, by, e.dir < 0);
          const on = Math.sin(e.anim * 7) > 0;
          fx.fillStyle(0xff3030, on ? 1 : 0.3);
          fx.fillRect(e.x - SP / 2, by, SP, SP);
          glow(L, spc('carrier', e.x, 17, e.dir < 0), spy('carrier', by, 4) + SP / 2, 12, 0xff3030, 0.3);
          continue;
        }
        const face = e.flee ? (e.x < C ? -1 : 1) : Math.sign(C - e.x) || 1,
          key = ekey(e),
          ey = GY - (e.fall || 0) - (e.air || 0),
          fl = face < 0;
        this.spr(U, key, eframe(e), e.x, ey, fl, e.shHit > 0 ? 0xd8f4ff : null);
        const eye = EYE[key];
        if (e.kind === 'bomber') {
          const on = Math.sin(now * 16 + e.anim) > 0,
            lx = spx(key, e.x, 5, fl),
            ly = spy(key, ey, 0);
          fx.fillStyle(0xff3030, on ? 1 : 0.25);
          fx.fillRect(lx, ly - SP / 2, SP, SP);
          if (on) glow(L, lx + SP / 2, ly, 12, 0xff3030, 0.45);
        } else
          glow(
            L,
            spc(key, e.x, eye[0], fl) + (e.brute ? SP : 0) * face,
            spy(key, ey, eye[1]) + SP / 2,
            eye[2],
            0xff3030,
            0.3
          );
        if (e.kind === 'jammer' && !(e.fall > 0)) {
          const ex = spc(key, e.x, 10, fl),
            ey2 = spy(key, ey, 2);
          glow(L, ex, ey2, 16, 0x5fd6d0, 0.25 + 0.2 * Math.sin(now * 9));
          for (let i = 0; i < 2; i++) {
            const r = (now * 26 + i * 12 + e.anim * 7) % 24;
            fx.lineStyle(1, 0x9ff6ff, 0.55 * (1 - r / 24));
            fx.strokeCircle(ex, ey2, r + 2);
          }
        }
        if (e.kind === 'colossus')
          glow(
            L,
            spc(key, e.x, 8, fl),
            spy(key, ey, 5),
            28,
            0x5fd6d0,
            0.12 + (e.empT < 1.5 ? 0.5 * (1 - e.empT / 1.5) : 0)
          );
        if (e.kind === 'howitzer' && e.flash > 0) {
          const mx = spc(key, e.x, 40.5, fl),
            my = spy(key, ey, 1);
          fx.fillStyle(0xfff3c0, 1);
          fx.fillRect(mx - 4, my - 4, 8, 8);
          glow(L, mx, my, 34, 0xffd080, 0.55);
        }
        if (e.boss) {
          if ((key === 'walker' || key === 'colossus') && Math.random() < dt * 3)
            S.puffs.push({
              x: spx(key, e.x, 1, fl),
              y: spy(key, GY, 10),
              vx: -face * 20,
              vy: -30,
              life: 1,
              color: 0x5a5650
            });
          if (e.hp < e.maxHp) bossBar(g, e, ey - SPR[key].h * SP - 12, key === 'colossus' ? 80 : 60);
        }
        if (e.loot > 0) {
          fx.fillStyle(0xe8c24a, 1);
          fx.fillRect(e.x - 3, ey - SPR[key].h * SP - 10, 6, 6);
          fx.fillStyle(0xfff0a0, 1);
          fx.fillRect(e.x - 2, ey - SPR[key].h * SP - 9, 2, 2);
        }
      }
    for (const z of S.emps) {
      const k = Math.min(1, z.age / 0.6);
      if (k < 1) {
        fx.lineStyle(3, 0x9ff6ff, (1 - k) * 0.7);
        fx.strokeCircle(z.x, GY - 40, z.r * k);
        glow(L, z.x, GY - 40, z.r * k * 0.6, 0x5fd6d0, 0.12 * (1 - k));
      }
    }
    for (const sp of S.spots)
      if (sp.jam && sp.level > 0 && vis(sp.x) && Math.random() < 0.45) {
        fx.fillStyle(Math.random() < 0.5 ? 0x9ff6ff : 0xffffff, 1);
        fx.fillRect(sp.x + rnd(-14, 14), GY - rnd(14, 80), 2, 2);
      }
    if (S.convoy && vis(S.convoy.x)) {
      const v = S.convoy;
      this.spr(U, 'truck', ((v.anim * 8) | 0) % 2, v.x, GY, v.dir < 0);
      if (dk > 0.3) {
        const hx = spc('truck', v.x, 54, v.dir < 0),
          hy = spy('truck', GY, 19);
        fx.fillStyle(0xfff3b0, 0.18 * dk);
        fx.fillTriangle(hx, hy, hx + v.dir * 130, hy - 26, hx + v.dir * 130, hy + 20);
      }
    }
    if (S.squad && vis(S.squad.x)) {
      const q = S.squad,
        d = q.dir || 1;
      this.spr(U, 'btr', q.moving ? ((q.anim * 8) | 0) % 2 : 0, q.x, GY, d < 0);
      if (dk > 0.3) {
        const hx = spc('btr', q.x, 53, d < 0),
          hy = spy('btr', GY, 17);
        fx.fillStyle(0xfff3b0, 0.18 * dk);
        fx.fillTriangle(hx, hy, hx + d * 136, hy - 28, hx + d * 136, hy + 22);
      }
      if (q.hp < q.maxHp) {
        g.fillStyle(0x000000, 0.6);
        const by = GY - SPR.btr.h * SP - 14;
        g.fillRect(q.x - 25, by, 50, 4);
        g.fillStyle(q.hp / q.maxHp > 0.4 ? 0x8fd16a : 0xff5a5a, 1);
        g.fillRect(q.x - 25, by, (50 * q.hp) / q.maxHp, 4);
      }
    }
    {
      const moving = this.lastPX != null && Math.abs(p.x - this.lastPX) > 0.01;
      this.lastPX = p.x;
      const d = p.dir,
        key = 'v_' + p.veh,
        hl = {jeep: [47, 20], moto: [24, 11], armored: [42, 19], tank: [56, 17]}[p.veh],
        hx = spc(key, p.x, hl[0], d < 0),
        hy = spy(key, GY, hl[1]) + SP / 2;
      const hit = p.hitCd > 0 && Math.floor(p.hitCd * 10) % 2 === 0;
      this.spr(
        U,
        key,
        moving ? ((p.anim * 8) | 0) % 2 : 0,
        p.x - d * (p.recoil || 0) * 6,
        GY,
        d < 0,
        hit ? 0xff7060 : null,
        null,
        false,
        skinTex(this, PROF.skin)
      );
      if (dk > 0.3) {
        fx.fillStyle(0xfff3b0, 0.22 * dk);
        fx.fillTriangle(hx, hy, hx + d * 140, hy - 28, hx + d * 140, hy + 22);
        glow(L, hx, hy, 18, 0xfff3b0, 0.3 * dk);
      }
      if (dk > 0) glow(L, p.x, GY - 40, 150, 0xffd590, 0.07 * dk);
    }
    // crows sit on open ground and take off when the commander drives up; smouldering wrecks
    if (dk < 0.45 && !this.rain && this.crows.length < 6 && Math.random() < dt * 0.4) {
      const side = Math.random() < 0.5,
        x = side ? cx - 60 : cx + W + 60;
      if (Math.abs(x - C) > 650)
        for (let i = 0, n = 1 + ((Math.random() * 3) | 0); i < n; i++)
          this.crows.push({
            x: x + rnd(-40, 40),
            y: GY,
            vx: 0,
            vy: 0,
            fly: false,
            t: rnd(0, 9),
            dir: Math.random() < 0.5 ? 1 : -1
          });
    }
    for (const b of this.crows) {
      b.t += dt;
      if (!b.fly) {
        if (Math.abs(b.x - p.x) < 170 || dk > 0.6 || S.enemies.some(e => Math.abs(e.x - b.x) < 120)) {
          b.fly = true;
          b.vx = (b.x < p.x ? -1 : 1) * rnd(80, 120);
          b.vy = rnd(-90, -60);
          b.dir = Math.sign(b.vx);
          AU.caw();
        } else if (Math.random() < dt * 0.25) b.dir *= -1;
      } else {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vy = Math.min(b.vy + 12 * dt, -20);
      }
      if (vis(b.x))
        this.spr(
          U,
          'crow',
          b.fly ? 2 + (((b.t * 9) | 0) % 2) : ((b.t * 1.4) | 0) % 4 === 0 ? 1 : 0,
          b.x,
          b.y,
          b.dir < 0
        );
    }
    this.crows = this.crows.filter(b => b.y > -40 && b.x > cx - 500 && b.x < cx + W + 500);
    for (const sm of this.smokers)
      if (vis(sm.x) && Math.random() < dt * 4)
        this.smoke.push({
          x: sm.x + rnd(-3, 3),
          y: sm.y,
          vx: rnd(3, 9),
          vy: rnd(-20, -13),
          t: 0,
          max: rnd(3, 4.5),
          c: Math.random() < 0.5 ? 0x3a3834 : 0x5a5650
        });
    for (const q of this.smoke) {
      q.t += dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      const k = q.t / q.max;
      g.fillStyle(lerpColor(q.c, 0x8a8a86, k), 0.38 * (1 - k) * Math.min(1, q.t * 3));
      g.fillCircle(q.x, q.y, 3 + k * 13);
    }
    this.smoke = this.smoke.filter(q => q.t < q.max);
    for (const pl of this.pools) for (let i = pl.n; i < pl.list.length; i++) pl.list[i].setVisible(false);
    for (const m of S.missiles) {
      fx.fillStyle(0xffe08a, 1);
      fx.fillCircle(m.x, m.y, 2.5);
      glow(L, m.x, m.y, 14, 0xffb050, 0.25);
    }
    for (const c of S.ground)
      if (vis(c.x)) {
        g.fillStyle(0xe8c24a, 1);
        g.fillRect(c.x - 3, c.y - 3, 6, 6);
        g.fillStyle(0xfff0a0, 1);
        g.fillRect(c.x - 2, c.y - 2, 2, 2);
        glow(L, c.x, c.y, 10, 0xffd84a, 0.06 + 0.12 * dk);
      }
    for (const t of S.tracers) {
      fx.lineStyle(2, t.color, Math.min(1, t.life * 10));
      fx.lineBetween(t.x1, t.y1, t.x2, t.y2);
      glow(L, t.x1, t.y1, 16, 0xffd080, 0.3 * Math.min(1, t.life * 8));
    }
    for (const s of S.eshells) {
      const k = s.t / s.dur,
        sx = lerp(s.x0, s.x1, k),
        sy = lerp(s.y0, GY - 6, k) - Math.sin(k * Math.PI) * 300;
      fx.fillStyle(0xffb080, 1);
      fx.fillCircle(sx, sy, 3);
      glow(L, sx, sy, 12, 0xff7040, 0.35);
    }
    for (const s of S.shells) {
      const k = s.t / s.dur,
        sx = lerp(s.x0, s.x1, k),
        sy = lerp(s.y0, GY - 6, k) - Math.sin(k * Math.PI) * 260;
      fx.fillStyle(0xffe08a, 1);
      fx.fillCircle(sx, sy, 2.5);
    }
    for (const b of S.booms) {
      fx.fillStyle(0xffb347, b.life * 1.6);
      fx.fillCircle(b.x, GY - 12, (0.5 - b.life) * 90 + 10);
      glow(L, b.x, GY - 20, 110, 0xff9040, b.life * 0.7);
    }
    for (const q of S.puffs) {
      g.fillStyle(q.color, Math.min(1, q.life * 1.6));
      g.fillRect(q.x - 1.5, q.y - 1.5, 3, 3);
    }
    // fireflies at night
    if (dk > 0.5 && si < 2) {
      while (this.flies.length < 26)
        this.flies.push({x: cx + rnd(-100, W + 100), y: GY - rnd(10, 120), ph: rnd(0, 6)});
      for (const f of this.flies) {
        f.ph += dt;
        f.x += Math.sin(f.ph * 0.7) * 10 * dt;
        f.y += Math.cos(f.ph * 1.1) * 8 * dt;
        if (f.x < cx - 150 || f.x > cx + W + 150) {
          f.x = cx + rnd(0, W);
        }
        const a = (0.5 + 0.5 * Math.sin(f.ph * 3)) * (dk - 0.5) * 2 * (1 - rainK);
        L.fillStyle(0xd8ff7a, 0.5 * a);
        L.fillRect(f.x - 1, f.y - 1, 2, 2);
        L.fillStyle(0xd8ff7a, 0.08 * a);
        L.fillCircle(f.x, f.y, 7);
      }
    } else this.flies.length = 0;
    if (S.target && S.targetInfo && S.targetInfo.payable && S.target.kind !== 'vagrant') {
      const o = S.target.obj,
        n = S.targetInfo.cost,
        yy =
          S.target.kind === 'wild'
            ? GY - SPR[o.type].h * SP - 16
            : S.target.kind === 'tree'
              ? GY - SPR[o.pine ? 'pine' : 'tree_s0'].h * SP - 10
              : o.type
                ? pipY(o)
                : GY - 74;
      for (let i = 0; i < n; i++) {
        const xx = o.x - (n - 1) * 6 + i * 12;
        fx.lineStyle(1.5, 0xe8c24a, 1);
        fx.strokeRect(xx - 3, yy - 3, 6, 6);
        if (i < o.pending) {
          fx.fillStyle(0xe8c24a, 1);
          fx.fillRect(xx - 3, yy - 3, 6, 6);
        }
      }
    }
    // water + reflection
    const wt = this.water,
      WY = this.WY;
    wt.clear();
    const wc = wint
      ? lerpColor(0x9eb0ba, 0x1a2234, dk)
      : lerpColor(lerpColor(0x50626a, 0x0b1220, dk), 0x404850, rainK * 0.4);
    wt.fillStyle(wc, 1);
    wt.fillRect(0, WY, W, H - WY);
    const rt = this.reflTex,
      y0 = -(WY - this.RH);
    if (this.reflN++ % 2 === 0) {
      rt.clear();
      rt.draw(this.sky, 0, y0);
      for (const im of this.layers) rt.draw(im, 0, y0);
      rt.draw(this.fog, 0, y0);
      rt.draw(this.gr, -cx, y0);
      rt.draw(this.seasonG, -cx, y0);
      rt.draw(this.decoG, -cx, y0);
      rt.draw(this.decoC, -cx, y0);
      rt.draw(this.bldC, -cx, y0);
      rt.draw(this.unitC, -cx, y0);
      rt.draw(this.frontC, -cx, y0);
      rt.draw(this.g, -cx, y0);
      rt.draw(this.fx, -cx, y0);
      rt.draw(this.light, -cx, y0);
    }
    for (const im of this.strips) {
      const k = im.k;
      im.x = wint ? 0 : Math.sin(now * 1.1 + k * 16) * (0.5 + k * 2.2) * (1 + rainK * 0.5);
      im.setAlpha(wint ? 0.28 - k * 0.15 : 0.5 - k * 0.25);
    }
    const wf = this.waterFx;
    wf.clear();
    if (wint) {
      wf.fillStyle(lerpColor(0xf4f8fa, 0x6a7ca0, dk), 0.35);
      for (let i = 0; i < 22; i++) {
        const yy = WY + 5 + ((i * 37) % (H - WY - 8)),
          xx = ((((i * 211 - cx) % (W + 120)) + W + 120) % (W + 120)) - 60,
          len = 18 + (i % 5) * 14;
        wf.fillRect(xx, yy, len, 1);
        if (i % 3 === 0) wf.fillRect(xx + len * 0.4, yy + 1, len * 0.3, 1);
      }
    } else
      for (let i = 0; i < 26; i++) {
        const yy = WY + 4 + ((i * 37) % (H - WY - 6)),
          xx = ((i * 173 - cx * 1.0 + now * (10 + (i % 5) * 6)) % (W + 80)) - 40,
          len = 10 + (i % 4) * 8;
        wf.fillStyle(lerpColor(0xdfe8ea, 0x6a7ca0, dk), 0.18);
        wf.fillRect(xx, yy, len, 1);
      }
    wf.fillStyle(0x000000, 0.18);
    wf.fillRect(0, WY, W, 2);
    // rain
    const rg = this.rainG;
    rg.clear();
    if (this.snow) {
      rg.fillStyle(0xf2f6f8, 0.85);
      for (const d of this.drops) {
        d.y += d.v * 0.09 * dt;
        d.x += Math.sin(now * 1.3 + d.v) * 14 * dt - 8 * dt;
        if (d.y > H) {
          d.y = rnd(-20, 0);
          d.x = rnd(0, W + 60);
        }
        if (d.x < -10) d.x = W + 10;
        rg.fillRect(d.x, d.y, d.v > 600 ? 2 : 1.5, d.v > 600 ? 2 : 1.5);
      }
    }
    if (si === 2 && dk < 0.8) {
      if (this.leaves.length < 14 && Math.random() < dt * 3)
        this.leaves.push({
          x: rnd(-40, W),
          y: -10,
          vx: rnd(10, 40),
          vy: rnd(30, 55),
          ph: rnd(0, 6),
          c: [0xc0702a, 0x9a5a24, 0xd8a040][(Math.random() * 3) | 0]
        });
      for (const l of this.leaves) {
        l.ph += dt * 3;
        l.x += (l.vx + Math.sin(l.ph) * 30) * dt;
        l.y += l.vy * dt;
        rg.fillStyle(l.c, 0.9 * (1 - dk));
        rg.fillRect(l.x, l.y, Math.cos(l.ph) > 0 ? 3 : 2, 2);
      }
      this.leaves = this.leaves.filter(l => l.y < GY + 4 && l.x < W + 20);
    } else this.leaves.length = 0;
    if (this.rain) {
      rg.lineStyle(1, 0xc8d0d8, 0.22);
      for (const d of this.drops) {
        d.y += d.v * dt;
        d.x -= d.v * 0.18 * dt;
        if (d.y > H) {
          d.y = rnd(-40, 0);
          d.x = rnd(0, W + 100);
          if (Math.random() < 0.5) {
            rg.fillStyle(0xc8d0d8, 0.4);
            rg.fillRect(d.x - 2, rnd(WY, H), 4, 1);
          }
        }
        rg.lineBetween(d.x, d.y, d.x + 3, d.y - 12);
      }
    }
    this.drawDark(dk, cx, now);
    if (this.signs)
      for (const o of this.signs) {
        const hw = o.displayWidth / 2;
        o.x = Math.round((o.wx - cx - hw) * K) / K + hw;
        o.setVisible(o.x > -80 && o.x < W + 80 && !(o.wild && o.wild.type === 'dog' && o.wild.done));
        o.setAlpha(1 - dk * 0.45);
      }
    // minimal HUD: purse, day numeral, faint strip map
    hud.clear();
    hud.fillStyle(0x2a2214, 0.9);
    hud.fillRoundedRect(12, 12, 22, 26, 6);
    hud.fillStyle(0x8a6a32, 1);
    hud.fillRoundedRect(14, 16, 18, 20, 5);
    hud.fillStyle(0x5a4420, 1);
    hud.fillRect(17, 14, 12, 4);
    hud.fillStyle(0xe8c24a, 1);
    hud.fillRect(20, 22, 6, 6);
    hud.fillStyle(0xfff0a0, 1);
    hud.fillRect(21, 23, 2, 2);
    this.coinTxt.setText(String(S.coins));
    // crystals: kept between operations, spent in the shop
    hud.fillStyle(0x14120c, 0.9);
    hud.fillTriangle(23, 44, 33, 53, 23, 62);
    hud.fillTriangle(23, 44, 13, 53, 23, 62);
    hud.fillStyle(0x6fd8f0, 1);
    hud.fillTriangle(23, 46, 31, 53, 23, 60);
    hud.fillTriangle(23, 46, 15, 53, 23, 60);
    hud.fillStyle(0xd8f8ff, 1);
    hud.fillTriangle(23, 46, 19, 51, 23, 53);
    this.crTxt.setText(String(PROF.cr));
    this.dayTxt.setText(
      (S.daily
        ? tr('mod_' + S.daily.m) + ' · '
        : S.front > 1
          ? tr('hudFront', roman(S.front), S.front) + ' · '
          : '') +
        tr('hudDay', roman(S.day), S.day) +
        ' · ' +
        SEASONS[si].name +
        (this.rain ? '  ☂' : this.snow ? '  ❄' : '')
    );
    const mx = W / 2 - 160,
      my = 14,
      mw = 320,
      mmx = x => mx + (x / WORLD) * mw;
    hud.fillStyle(0xf1ecd6, 0.25);
    hud.fillRect(mx, my + 6, mw, 1);
    S.portals.forEach((px, i) => {
      hud.fillStyle(S.portalDead[i] ? 0x55554a : 0xc77dff, 0.8);
      hud.fillRect(mmx(px) - 1, my + 1, 3, 11);
    });
    for (const w of S.wild) {
      if (w.type === 'cache' && w.done) continue;
      hud.fillStyle(w.type === 'cache' ? 0xe8c24a : w.done ? 0x8fd16a : 0xb4b49c, 0.8);
      hud.fillRect(mmx(w.x) - 1, my + 9, 2, 2);
    }
    for (const sp of S.spots) {
      if (sp.type === 'wall' && sp.level > 0) {
        hud.fillStyle(0xd8cfa8, 0.8);
        hud.fillRect(mmx(sp.x), my + 2, 1, 9);
      }
      if (sp.type === 'hq') {
        hud.fillStyle(0xb5262b, 1);
        hud.fillRect(mmx(sp.x) - 2, my + 3, 4, 7);
      }
    }
    if (S.squad) {
      hud.fillStyle(0x6ec3ff, 1);
      hud.fillRect(mmx(S.squad.x) - 2, my + 4, 4, 4);
    }
    hud.fillStyle(0xff4a3a, 0.9);
    for (const e of S.enemies) hud.fillRect(mmx(e.x) - 1, my + 5, 2, 3);
    hud.fillStyle(0xffffff, 1);
    hud.fillTriangle(mmx(p.x) - 3, my + 16, mmx(p.x) + 3, my + 16, mmx(p.x), my + 11);
    this.tutMarks(cx, now, mmx, my);
    const ti = S.targetInfo;
    if (ti && S.running && !S.won && !S.over) {
      let t = ti.payable
        ? (TOUCH ? '★ ' : '↓ ') + ti.text + (ti.cost ? '  ·  ' + tokN(ti.cost) : '')
        : ti.text;
      if (S.target.kind === 'spot' && S.target.obj.type === 'hq') {
        const cnt = r => S.people.filter(m => m.role === r).length;
        const gs = guardSides(S.people),
          ng = gs[0] + gs[1];
        t +=
          '\n' +
          tr(
            'hqCount',
            ng ? ng + ' (←' + gs[0] + ' ' + gs[1] + '→)' : 0,
            cnt('builder'),
            cnt('farmer'),
            cnt('idle'),
            VEH[p.veh].name
          );
      }
      this.hintTxt.setText(t).setVisible(true);
      recolor(this.hintTxt, ti.payable ? '#f1ecd6' : '#bdb79e');
    } else this.hintTxt.setVisible(false);
    this.toastTxt.y = TUT_BOTTOM ? Math.max(78, TUT_BOTTOM + 10) : 78;
    this.bannerTxt.y = TUT_BOTTOM ? Math.max(150, TUT_BOTTOM + 66) : 150;
    if (S.toast) {
      this.toastTxt
        .setText(TOUCH ? S.toast.text.replace(/↓/g, '★') : S.toast.text)
        .setVisible(true)
        .setAlpha(Math.min(1, S.toast.t * 2));
      recolor(this.toastTxt, S.toast.warn ? '#ffb3a0' : '#f1ecd6');
    } else this.toastTxt.setVisible(false);
    if (this.banner) {
      const b = this.banner,
        a = b.t > 3.7 ? (4.5 - b.t) / 0.8 : b.t < 1.2 ? b.t / 1.2 : 1;
      this.bannerTxt.setText(this.bannerLabel(b.day)).setAlpha(a);
    } else this.bannerTxt.setAlpha(0);
  }
}
