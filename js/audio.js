import {C, W, WORLD, seasonIdx} from './config.js';
import {clamp} from './util.js';
import {input} from './state.js';

/* ---------- sound: everything is synthesized in the browser ----------
   sfx bus (spatial around the camera, muffled while paused) + music bus (step-sequenced tracks that crossfade),
   both into a gentle compressor. No constant noise beds: loops are tonal and only sound while something is there. */
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const CH = {
  Am: [57, 60, 64],
  F: [53, 57, 60],
  C: [48, 52, 55],
  G: [55, 59, 62],
  Em: [52, 55, 59],
  Dm: [50, 53, 57],
  Bb: [46, 50, 53],
  D: [50, 54, 57],
  B: [47, 51, 54]
};
// engine voices per vehicle: base pitch, filter, firing-rate wobble idle/moving, loudness
const ENG = {
  jeep: {f: 38, lp: 420, r: 16, rm: 26, v: 0.05},
  moto: {f: 52, lp: 950, r: 22, rm: 40, v: 0.045},
  armored: {f: 44, lp: 480, r: 18, rm: 27, v: 0.05},
  tank: {f: 31, lp: 330, r: 12, rm: 20, v: 0.06},
  aux: {f: 42, lp: 440, r: 17, rm: 25, v: 0.045}
};
// radio chatter without words: lines of [syllables, voice pitch, speed]
const RADIO = {
  night: [
    [8, 132, 1],
    [4, 104, 1]
  ],
  dawn: [
    [6, 118, 1],
    [5, 140, 1]
  ],
  order: [
    [5, 128, 1.05],
    [3, 108, 1]
  ],
  alert: [
    [9, 172, 1.25],
    [3, 120, 1.1]
  ],
  convoy: [
    [6, 100, 1],
    [3, 130, 1]
  ],
  rocket: [
    [7, 148, 1.1],
    [4, 118, 1]
  ]
};
const VOW = [
  [730, 1090],
  [270, 2290],
  [530, 1840],
  [570, 840],
  [440, 1020],
  [300, 870],
  [660, 1700]
];
export const AU = {
  ctx: null,
  master: null,
  muted: false,
  hush: false, // silenced by the platform (an ad, or CrazyGames' mute setting)
  music: true,
  musicVol: 0.7,
  sfxVol: 0.8,
  last: {},
  voices: 0,
  cx: C,
  init() {
    if (this.ctx) {
      if (this.ctx.state !== 'running' && this.ctx.resume) this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = (this.ctx = new AC());
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.25;
    comp.connect(c.destination);
    this.master = c.createGain();
    this.master.gain.value = 0;
    this.master.gain.setTargetAtTime(this.level(), c.currentTime + 0.2, 1.2);
    this.master.connect(comp);
    this.sfxLP = c.createBiquadFilter();
    this.sfxLP.type = 'lowpass';
    this.sfxLP.frequency.value = 18000;
    this.sfxLP.connect(this.master);
    this.sfx = c.createGain();
    this.sfx.gain.value = this.sfxVol;
    this.sfx.connect(this.sfxLP);
    this.mus = c.createGain();
    this.mus.gain.value = this.music ? this.musicVol : 0;
    this.mus.connect(this.master);
    const len = c.sampleRate * 2,
      buf = c.createBuffer(1, len, c.sampleRate),
      d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    // rain: a soft low rumble that fades in only while it rains
    const bb = c.createBuffer(1, len, c.sampleRate),
      bd = bb.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      bd[i] = last * 3.5;
    }
    for (let i = 0; i < 2000; i++) {
      const k = i / 2000;
      bd[i] *= k;
      bd[len - 1 - i] *= k;
    }
    const s = c.createBufferSource();
    s.buffer = bb;
    s.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 600;
    f.Q.value = 0.4;
    const g = c.createGain();
    g.gain.value = 0;
    s.connect(f);
    f.connect(g);
    g.connect(this.sfx);
    s.start();
    this.rain = {f, g};
    const cv = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) cv[i] = Math.tanh((i / 511.5 - 1) * 3);
    this.drive = cv;
    this.loops = {};
    this.ks = {};
    this.trkName = '';
    this.tg = null;
    this.nextT = 0;
    this.stepN = 0;
    this.hold = 0;
    this.battleT = 0;
    this.jingled = false;
    this.trackT = 0;
  },
  level() {
    return this.muted || this.hush ? 0 : 0.8;
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(this.level(), this.ctx.currentTime, 0.05);
  },
  setHush(h) {
    this.hush = h;
    if (this.master) this.master.gain.setTargetAtTime(this.level(), this.ctx.currentTime, 0.05);
  },
  setMusic(on, vol) {
    this.music = on;
    if (vol != null) this.musicVol = vol;
    if (this.mus) this.mus.gain.setTargetAtTime(on ? this.musicVol : 0, this.ctx.currentTime, 0.08);
  },
  setSfx(vol) {
    this.sfxVol = vol;
    if (this.sfx) this.sfx.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
  },
  ok(key, gap) {
    if (!this.ctx || this.muted) return false;
    const t = this.ctx.currentTime;
    if (this.last[key] && t - this.last[key] < gap) return false;
    this.last[key] = t;
    return true;
  },
  count(src) {
    this.voices++;
    src.onended = () => {
      this.voices--;
    };
  },
  // a world position becomes pan + distance fade around the camera centre; null when it is too far to hear
  at(x, vol) {
    const c = this.ctx,
      g = c.createGain();
    let k = 1,
      pan = 0;
    if (x != null) {
      const dd = x - this.cx,
        ad = Math.abs(dd);
      k = ad < W * 0.55 ? 1 : Math.max(0, 1 - (ad - W * 0.55) / 650);
      if (k <= 0.03) return null;
      pan = clamp(dd / (W * 0.75), -1, 1) * 0.85;
    }
    g.gain.value = (vol == null ? 1 : vol) * k;
    if (pan && c.createStereoPanner) {
      const p = c.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      p.connect(this.sfx);
    } else g.connect(this.sfx);
    return g;
  },
  tone(freq, dur, type, vol, attack, delay, slideTo, dest) {
    const c = this.ctx,
      t = c.currentTime + (delay || 0),
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + (attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || this.sfx);
    o.start(t);
    o.stop(t + dur + 0.05);
    this.count(o);
  },
  burst(dur, type, freq, vol, delay, dest, q, freqTo) {
    const c = this.ctx,
      t = c.currentTime + (delay || 0),
      s = c.createBufferSource();
    s.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (q) f.Q.value = q;
    if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(dest || this.sfx);
    s.loop = dur > 1.4;
    s.start(t, Math.random() * Math.max(0.01, 1.9 - dur));
    s.stop(t + dur + 0.05);
    this.count(s);
  },
  play(e) {
    if (!this.ctx || this.muted || this.voices > 60) return;
    const f = this.fx[e.k];
    if (f) f.call(this, e.x, e.a || {});
  },
  // ---------- effects ----------
  fx: {
    rifle(x) {
      if (!this.ok('rifle', 0.05)) return;
      const o = this.at(x, 0.9);
      if (!o) return;
      this.burst(0.05, 'bandpass', 1800, 0.09, 0, o, 0.8);
      this.burst(0.16, 'lowpass', 700, 0.06, 0, o);
      this.tone(160, 0.08, 'triangle', 0.05, 0.002, 0, 70, o);
    },
    mg(x) {
      if (!this.ok('mg', 0.2)) return;
      const o = this.at(x, 0.85);
      if (!o) return;
      for (let i = 0; i < 3; i++) {
        const d = i * 0.075;
        this.burst(0.045, 'bandpass', 1500, 0.08, d, o, 0.9);
        this.burst(0.12, 'lowpass', 600, 0.06, d, o);
        this.tone(140, 0.07, 'triangle', 0.05, 0.002, d, 65, o);
      }
    },
    turret(x) {
      if (!this.ok('turret', 0.2)) return;
      const o = this.at(x, 0.85);
      if (!o) return;
      for (let i = 0; i < 2; i++) {
        const d = i * 0.06;
        this.burst(0.04, 'bandpass', 2200, 0.08, d, o, 1);
        this.burst(0.1, 'lowpass', 800, 0.05, d, o);
        this.tone(2400, 0.02, 'square', 0.012, 0.001, d, null, o);
      }
    },
    sniper(x) {
      if (!this.ok('sniper', 0.2)) return;
      const o = this.at(x, 1);
      if (!o) return;
      this.burst(0.04, 'highpass', 2500, 0.12, 0, o);
      this.burst(0.35, 'lowpass', 500, 0.08, 0, o);
      this.tone(120, 0.2, 'triangle', 0.06, 0.002, 0, 45, o);
      this.burst(0.06, 'bandpass', 1200, 0.035, 0.2, o, 1.2);
      this.burst(0.08, 'bandpass', 900, 0.018, 0.42, o, 1.2);
    },
    kpvt(x) {
      if (!this.ok('kpvt', 0.12)) return;
      const o = this.at(x, 1);
      if (!o) return;
      this.burst(0.04, 'bandpass', 1200, 0.07, 0, o, 0.9);
      this.burst(0.22, 'lowpass', 400, 0.12, 0, o);
      this.tone(90, 0.15, 'triangle', 0.09, 0.002, 0, 45, o);
    },
    cannon(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.burst(0.06, 'highpass', 1500, 0.12, 0, o);
      this.burst(0.9, 'lowpass', 300, 0.3, 0, o);
      this.tone(55, 0.7, 'sine', 0.3, 0.004, 0, 28, o);
    },
    mortar(x) {
      if (!this.ok('mortar', 0.3)) return;
      const o = this.at(x, 1);
      if (!o) return;
      this.tone(1800, 0.03, 'triangle', 0.02, 0.001, 0, null, o);
      this.tone(140, 0.22, 'sine', 0.16, 0.003, 0.12, 60, o);
      this.burst(0.25, 'lowpass', 500, 0.08, 0.12, o);
    },
    whistle(x) {
      const o = this.at(x, 0.9);
      if (!o) return;
      this.tone(1700, 0.7, 'sine', 0.022, 0.15, 0.5, 620, o);
    },
    atgm(x) {
      if (!this.ok('atgm', 0.3)) return;
      const o = this.at(x, 1);
      if (!o) return;
      this.burst(0.08, 'lowpass', 800, 0.1, 0, o);
      this.burst(0.9, 'bandpass', 600, 0.05, 0.04, o, 1.2, 2400);
      this.tone(300, 0.6, 'sawtooth', 0.012, 0.05, 0.04, 900, o);
    },
    boom(x) {
      if (!this.ok('boom', 0.08)) return;
      const o = this.at(x, 1);
      if (!o) return;
      this.burst(0.7, 'lowpass', 260, 0.3, 0, o);
      this.tone(70, 0.5, 'sine', 0.22, 0.005, 0, 35, o);
      for (let i = 0; i < 4; i++)
        this.burst(0.03, 'bandpass', 1500 + Math.random() * 2000, 0.025, 0.08 + Math.random() * 0.4, o, 2);
    },
    robotDie(x) {
      if (!this.ok('rdie', 0.06)) return;
      const o = this.at(x, 0.9);
      if (!o) return;
      this.tone(1200, 0.18, 'square', 0.03, 0.002, 0, 150, o);
      this.burst(0.08, 'bandpass', 3000, 0.04, 0, o, 1.5);
      [700, 1150, 1730].forEach((f, i) =>
        this.tone(f * (0.9 + Math.random() * 0.2), 0.06, 'triangle', 0.022, 0.001, 0.06 + i * 0.05, null, o)
      );
    },
    bruteDie(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.tone(700, 0.3, 'square', 0.035, 0.002, 0, 90, o);
      this.burst(0.5, 'lowpass', 350, 0.14, 0, o);
      [420, 690, 1040, 1500].forEach((f, i) =>
        this.tone(f, 0.08, 'triangle', 0.025, 0.001, 0.08 + i * 0.06, null, o)
      );
    },
    droneDie(x) {
      if (!this.ok('ddie', 0.06)) return;
      const o = this.at(x, 0.9);
      if (!o) return;
      this.tone(230, 0.5, 'sawtooth', 0.025, 0.002, 0, 50, o);
      this.burst(0.3, 'lowpass', 500, 0.09, 0.05, o);
    },
    walkerDie(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.burst(1.2, 'lowpass', 240, 0.35, 0, o);
      this.tone(60, 1, 'sine', 0.3, 0.005, 0, 25, o);
      this.tone(95, 1.4, 'sawtooth', 0.04, 0.05, 0.2, 38, o);
      this.burst(0.8, 'lowpass', 400, 0.2, 0.35, o);
    },
    walkerSpawn(x) {
      const o = this.at(x == null ? null : x, 1) || this.at(null, 0.5);
      this.tone(72, 1.6, 'sawtooth', 0.06, 0.3, 0, 52, o);
      this.tone(36, 1.6, 'sine', 0.14, 0.2, 0, 30, o);
      this.tone(144, 1.2, 'square', 0.012, 0.3, 0.3, 98, o);
    },
    walkerStep(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.tone(62, 0.28, 'sine', 0.13, 0.004, 0, 34, o);
      this.burst(0.12, 'lowpass', 300, 0.06, 0, o);
      this.tone(310, 0.07, 'triangle', 0.02, 0.002, 0.05, null, o);
    },
    bruteStep(x) {
      const o = this.at(x, 0.8);
      if (!o) return;
      this.tone(80, 0.16, 'sine', 0.06, 0.004, 0, 45, o);
    },
    chatter(x) {
      const o = this.at(x, 0.7);
      if (!o) return;
      const f = 600 + Math.random() * 700;
      this.tone(f, 0.05, 'square', 0.012, 0.002, 0, null, o);
      this.tone(f * (Math.random() < 0.5 ? 1.5 : 0.75), 0.06, 'square', 0.01, 0.002, 0.07, null, o);
    },
    clang(x) {
      if (!this.ok('clang', 0.2)) return;
      const o = this.at(x, 0.9);
      if (!o) return;
      this.burst(0.12, 'lowpass', 400, 0.07, 0, o);
      this.tone(520 + Math.random() * 80, 0.08, 'triangle', 0.03, 0.001, 0, null, o);
    },
    collapse(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.burst(1.2, 'lowpass', 500, 0.16, 0, o);
      for (let i = 0; i < 5; i++)
        this.tone(90 + Math.random() * 60, 0.2, 'sine', 0.08, 0.003, i * 0.13 + Math.random() * 0.05, 45, o);
    },
    hitPlayer(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.burst(0.2, 'lowpass', 500, 0.14, 0, o);
      this.tone(240, 0.12, 'triangle', 0.06, 0.002, 0, 120, o);
      this.tone(880, 0.08, 'square', 0.025, 0.002, 0.12, null, o);
      this.tone(880, 0.08, 'square', 0.025, 0.002, 0.3, null, o);
    },
    hurt(x) {
      const o = this.at(x, 0.9);
      if (!o) return;
      this.burst(0.1, 'lowpass', 450, 0.07, 0, o);
      this.tone(300, 0.15, 'triangle', 0.03, 0.01, 0.03, 170, o);
    },
    hammer(x) {
      const o = this.at(x, 0.8);
      if (!o) return;
      const f = (this.hamF = this.hamF === 880 ? 720 : 880);
      this.tone(f, 0.05, 'triangle', 0.04, 0.001, 0, f * 0.8, o);
      this.burst(0.015, 'bandpass', 2600, 0.03, 0, o, 1.5);
    },
    built(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.burst(0.15, 'lowpass', 400, 0.08, 0, o);
      this.tone(784, 0.6, 'sine', 0.04, 0.01, 0.08, null, o);
      this.tone(1047, 0.7, 'sine', 0.035, 0.01, 0.2, null, o);
    },
    hqUp(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.burst(0.15, 'lowpass', 400, 0.08, 0, o);
      [523, 659, 784, 1047].forEach((f, i) =>
        this.tone(f, i === 3 ? 0.9 : 0.35, 'triangle', 0.05, 0.02, 0.1 + i * 0.14, null, o)
      );
    },
    order(x) {
      const o = this.at(x, 0.8);
      if (!o) return;
      this.burst(0.06, 'lowpass', 900, 0.05, 0, o);
      this.tone(196, 0.1, 'triangle', 0.04, 0.003, 0, 150, o);
    },
    recruit(x) {
      const o = this.at(x, 1);
      if (!o) return;
      [67, 71, 74].forEach((m, i) => this.pluck(mtof(m), this.ctx.currentTime + i * 0.09, 0.07, o, 1));
    },
    equip(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.tone(1400, 0.03, 'triangle', 0.04, 0.001, 0, null, o);
      this.tone(900, 0.06, 'triangle', 0.035, 0.001, 0.05, null, o);
      this.burst(0.06, 'lowpass', 1200, 0.04, 0.05, o);
    },
    unlock(x) {
      const o = this.at(x, 1);
      if (!o) return;
      [72, 76, 79, 84].forEach((m, i) => this.pluck(mtof(m), this.ctx.currentTime + i * 0.07, 0.06, o, 1.4));
    },
    swap(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.burst(0.1, 'lowpass', 300, 0.1, 0, o);
      this.tone(180, 0.1, 'triangle', 0.06, 0.002, 0, 120, o);
      this.tone(60, 0.5, 'sawtooth', 0.03, 0.05, 0.15, 110, o);
    },
    cache(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.tone(400, 0.25, 'sawtooth', 0.012, 0.02, 0, 300, o);
      [0, 0.08, 0.16].forEach(d =>
        this.tone(1975 * (1 + Math.random() * 0.06), 0.3, 'sine', 0.06, 0.002, 0.2 + d, null, o)
      );
    },
    bark(x) {
      if (!this.ok('bark', 0.5)) return;
      const o = this.at(x, 1);
      if (!o) return;
      for (const d of [0, 0.16]) {
        this.tone(420, 0.09, 'square', 0.035, 0.004, d, 230, o);
        this.burst(0.06, 'bandpass', 900, 0.05, d, o);
      }
    },
    shieldHit(x) {
      if (!this.ok('shieldHit', 0.06)) return;
      const o = this.at(x, 0.8);
      if (!o) return;
      this.tone(1900 + Math.random() * 500, 0.06, 'triangle', 0.02, 0.001, 0, null, o);
      this.tone(2900, 0.04, 'sine', 0.008, 0.001, 0.01, null, o);
    },
    shieldBreak(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.burst(0.3, 'bandpass', 2500, 0.07, 0, o, 2);
      for (let i = 0; i < 4; i++)
        this.tone(1200 + Math.random() * 1600, 0.12, 'triangle', 0.018, 0.001, i * 0.04, null, o);
      this.tone(300, 0.2, 'square', 0.018, 0.002, 0, 120, o);
    },
    jump(x) {
      if (!this.ok('jump', 0.12)) return;
      const o = this.at(x, 0.8);
      if (!o) return;
      this.tone(170, 0.26, 'triangle', 0.04, 0.003, 0, 560, o);
      this.tone(90, 0.1, 'sine', 0.05, 0.002, 0, 60, o);
    },
    ramRev(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.tone(52, 1, 'sawtooth', 0.05, 0.06, 0, 118, o);
      this.tone(104, 0.9, 'square', 0.01, 0.06, 0, 236, o);
    },
    ramHit(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.burst(0.5, 'lowpass', 320, 0.24, 0, o);
      this.tone(46, 0.6, 'sine', 0.3, 0.003, 0, 28, o);
      this.tone(240, 0.25, 'triangle', 0.05, 0.001, 0, 140, o);
    },
    howitzer(x) {
      const o = this.at(x, 1);
      if (!o) return;
      this.burst(0.08, 'highpass', 1200, 0.1, 0, o);
      this.burst(1.1, 'lowpass', 220, 0.3, 0, o);
      this.tone(40, 0.9, 'sine', 0.32, 0.004, 0, 24, o);
    },
    bombBeep(x) {
      if (!this.ok('beep', 0.32)) return;
      const o = this.at(x, 0.7);
      if (!o) return;
      this.tone(2200, 0.05, 'square', 0.007, 0.001, 0, null, o);
    },
    jam(x) {
      if (!this.ok('jam', 1.6)) return;
      const o = this.at(x, 0.7);
      if (!o) return;
      for (let i = 0; i < 6; i++)
        this.tone(i % 2 ? 740 : 980, 0.07, 'square', 0.007, 0.002, i * 0.07, null, o);
    },
    emp(x) {
      const o = this.at(x, 1) || this.at(null, 0.6);
      this.tone(1600, 0.9, 'sine', 0.05, 0.005, 0, 60, o);
      this.tone(800, 0.6, 'sawtooth', 0.014, 0.005, 0, 40, o);
      this.burst(0.4, 'lowpass', 600, 0.08, 0, o);
    },
    drop(x) {
      const o = this.at(x, 0.9);
      if (!o) return;
      this.tone(900, 0.05, 'square', 0.015, 0.002, 0, null, o);
      this.tone(1200, 0.5, 'sine', 0.015, 0.05, 0.05, 500, o);
    },
    portalDie(x) {
      const o = this.at(x, 1) || this.at(null, 0.4);
      this.burst(1.2, 'bandpass', 3000, 0.08, 0, o, 1.5, 200);
      this.tone(220, 1.2, 'sine', 0.1, 0.02, 0, 40, o);
      this.tone(440, 0.9, 'triangle', 0.03, 0.02, 0, 90, o);
    },
    truckHorn(x) {
      const o = this.at(x, 1);
      if (!o) return;
      for (const f of [220, 277]) {
        const c = this.ctx,
          t = c.currentTime,
          s = c.createOscillator(),
          fl = c.createBiquadFilter(),
          g = c.createGain();
        s.type = 'sawtooth';
        s.frequency.value = f;
        fl.type = 'lowpass';
        fl.frequency.value = 1400;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.035, t + 0.04);
        g.gain.setValueAtTime(0.035, t + 0.55);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
        s.connect(fl);
        fl.connect(g);
        g.connect(o);
        s.start(t);
        s.stop(t + 0.8);
        this.count(s);
      }
    },
    siren(x) {
      const o = this.at(x, 0.9) || this.at(null, 0.5),
        c = this.ctx,
        t = c.currentTime + 0.3,
        s = c.createOscillator(),
        s2 = c.createOscillator(),
        fl = c.createBiquadFilter(),
        g = c.createGain();
      s.type = 'triangle';
      s2.type = 'square';
      fl.type = 'lowpass';
      fl.frequency.value = 1200;
      for (const k of [s, s2]) {
        const fr = k.frequency,
          m = k === s2 ? 1.005 : 1;
        fr.setValueAtTime(260 * m, t);
        fr.linearRampToValueAtTime(640 * m, t + 2.4);
        fr.setValueAtTime(640 * m, t + 3.4);
        fr.linearRampToValueAtTime(380 * m, t + 5);
        fr.linearRampToValueAtTime(640 * m, t + 6.6);
        fr.linearRampToValueAtTime(240 * m, t + 9);
      }
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 1.2);
      g.gain.setValueAtTime(0.05, t + 7.5);
      g.gain.linearRampToValueAtTime(0, t + 9);
      const g2 = c.createGain();
      g2.gain.value = 0.25;
      s.connect(fl);
      s2.connect(g2);
      g2.connect(fl);
      fl.connect(g);
      g.connect(o);
      s.start(t);
      s2.start(t);
      s.stop(t + 9.1);
      s2.stop(t + 9.1);
      this.count(s);
    },
    rocket(x) {
      const o = this.at(x, 1) || this.at(null, 0.6);
      this.burst(0.12, 'lowpass', 900, 0.2, 0, o);
      this.burst(4.5, 'lowpass', 380, 0.22, 0.05, o, null, 140);
      this.tone(42, 4.5, 'sine', 0.18, 0.3, 0.05, 30, o);
      this.burst(3, 'bandpass', 1400, 0.03, 0.1, o, 0.8, 500);
    },
    radio(x, a) {
      this.radio(a.v, a.d || 0);
    },
    ui() {
      if (!this.ok('ui', 0.04)) return;
      this.tone(1400, 0.03, 'triangle', 0.03, 0.001, 0, null, this.at(null, 0.8));
    }
  },
  // plucked string (Karplus-Strong), buffers cached per pitch; used by music and a few cheerful effects
  ksBuf(f) {
    const key = Math.round(f * 2);
    let b = this.ks[key];
    if (b) return b;
    const c = this.ctx,
      sr = c.sampleRate,
      len = Math.floor(sr * 2.4),
      N = Math.max(2, Math.round(sr / f));
    b = this.ks[key] = c.createBuffer(1, len, sr);
    const d = b.getChannelData(0);
    let pv = 0;
    for (let i = 0; i < N; i++) {
      pv = pv * 0.55 + (Math.random() * 2 - 1) * 0.45;
      d[i] = pv;
    }
    d[N] = d[0];
    for (let i = N + 1; i < len; i++) d[i] = (d[i - N] + d[i - N - 1]) * 0.4972;
    for (let i = 0; i < 4000; i++) d[len - 1 - i] *= i / 4000;
    return b;
  },
  pluck(f, t, vol, dest, dur) {
    const c = this.ctx,
      s = c.createBufferSource();
    s.buffer = this.ksBuf(f);
    const g = c.createGain();
    g.gain.value = vol;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(6000, f * 6);
    s.connect(lp);
    lp.connect(g);
    g.connect(dest);
    s.start(t);
    s.stop(t + (dur || 2.3));
  },
  osc(type, f, t, end, dest) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.connect(dest);
    o.start(t);
    o.stop(end + 0.05);
    return o;
  },
  env(t, a, peak, end, dest, release) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, Math.max(t + a, end - (release || 0.3)));
    g.gain.linearRampToValueAtTime(0, end);
    g.connect(dest);
    return g;
  },
  pad(ms, t, dur, vol, dest, bright) {
    const c = this.ctx,
      lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = bright || 800;
    const g = this.env(t, dur * 0.3, vol, t + dur, dest, dur * 0.35);
    lp.connect(g);
    for (const m of ms) {
      const f = mtof(m);
      this.osc('sawtooth', f * 1.003, t, t + dur, lp);
      this.osc('triangle', f * 0.997, t, t + dur, lp);
    }
  },
  bass(m, t, dur, vol, dest) {
    const c = this.ctx,
      g = c.createGain(),
      lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(g);
    g.connect(dest);
    this.osc('triangle', mtof(m), t, t + dur, lp);
    this.osc('sine', mtof(m) / 2, t, t + dur, lp);
  },
  bell(m, t, vol, dest) {
    const f = mtof(m);
    for (const [k, v, d] of [
      [1, 1, 1.8],
      [2.76, 0.35, 0.9],
      [5.4, 0.12, 0.4]
    ]) {
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      g.connect(dest);
      this.osc('sine', f * k, t, t + d, g);
    }
  },
  flute(m, t, dur, vol, dest) {
    const c = this.ctx,
      f = mtof(m),
      g = this.env(t, 0.08, vol, t + dur, dest, 0.2),
      o = this.osc('sine', f, t, t + dur, g),
      l = c.createOscillator(),
      lg = c.createGain();
    l.frequency.value = 5;
    lg.gain.value = f * 0.006;
    l.connect(lg);
    lg.connect(o.frequency);
    l.start(t);
    l.stop(t + dur + 0.05);
  },
  brass(ms, t, dur, vol, dest) {
    const c = this.ctx,
      lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(400, t);
    lp.frequency.linearRampToValueAtTime(2200, t + 0.06);
    lp.frequency.linearRampToValueAtTime(1200, t + dur);
    const g = this.env(t, 0.05, vol, t + dur, dest, 0.12);
    lp.connect(g);
    for (const m of ms) {
      const f = mtof(m);
      this.osc('sawtooth', f, t, t + dur, lp);
      this.osc('sawtooth', f * 1.004, t, t + dur, lp);
    }
  },
  noiseHit(t, dur, type, freq, vol, dest, q) {
    const c = this.ctx,
      s = c.createBufferSource();
    s.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q) f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(dest);
    s.loop = dur > 1.4;
    s.start(t, Math.random() * Math.max(0.01, 1.9 - dur));
    s.stop(t + dur + 0.05);
  },
  kick(t, vol, dest) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    g.connect(dest);
    const o = this.osc('sine', 110, t, t + 0.3, g);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
  },
  snare(t, vol, dest) {
    this.noiseHit(t, 0.13, 'bandpass', 1800, vol, dest, 0.7);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol * 0.6, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    g.connect(dest);
    this.osc('triangle', 190, t, t + 0.08, g);
  },
  tom(f, t, vol, dest) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    g.connect(dest);
    const o = this.osc('sine', f, t, t + 0.4, g);
    o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.35);
  },
  hat(t, vol, dest) {
    this.noiseHit(t, 0.03, 'highpass', 7000, vol, dest);
  },
  // ---------- music tracks: step(n,t,sd,out) is called for every eighth note ----------
  tracks: {
    menu: {
      bpm: 64,
      step(n, t, sd, o) {
        const prog = ['Dm', 'Bb', 'F', 'C'],
          bar = (n >> 3) % 4,
          s = n % 8,
          ch = CH[prog[bar]],
          cyc = n >> 5;
        if (s === 0) {
          this.pad(ch, t, 8 * sd + 0.6, 0.02, o, 700);
          this.bass(ch[0] - 12, t, sd * 6, 0.06, o);
        }
        const ar = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24],
          ord = [0, 1, 2, 3, 2, 1, 2, 1];
        this.pluck(mtof(ar[ord[s]]), t, s === 0 ? 0.075 : 0.055, o);
        const mel = [
          [74, 0, 72, 0],
          [70, 0, 69, 67],
          [69, 0, 0, 65],
          [67, 0, 64, 0]
        ][bar];
        if (cyc % 2 === 1 && s % 2 === 0 && mel[s >> 1]) this.bell(mel[s >> 1], t, 0.03, o);
      }
    },
    day: {
      bpm: 84,
      step(n, t, sd, o) {
        const si = this.season,
          prog = si === 2 ? ['Am', 'F', 'C', 'G'] : ['C', 'G', 'Am', 'F'],
          bar = (n >> 3) % 4,
          s = n % 8,
          ch = CH[prog[bar]],
          cyc = n >> 5;
        if (s === 0) this.pad(ch, t, 8 * sd + 0.4, 0.014, o, 900);
        if (s === 0 || s === 4) this.pluck(mtof(ch[0] - 12), t, 0.07, o);
        else if (s === 2 || s === 6) this.pluck(mtof(ch[2] - 12), t, 0.05, o);
        else this.pluck(mtof([ch[1] + 12, ch[2] + 12, ch[0] + 24, ch[1] + 12][s >> 1]), t, 0.055, o);
        if (cyc % 2 === 1) {
          const pent = si === 2 ? [69, 72, 74, 76, 79, 81] : [72, 74, 76, 79, 81, 84],
            k = (n * 7 + cyc * 3) % 11;
          if ((s === 0 || s === 3 || s === 4 || s === 6) && k < 7)
            this.flute(pent[(k + bar) % 6], t, sd * (s === 4 ? 3 : 1.6), 0.026, o);
        }
      }
    },
    winter: {
      bpm: 70,
      step(n, t, sd, o) {
        const prog = ['Am', 'Em', 'F', 'Em'],
          bar = (n >> 3) % 4,
          s = n % 8,
          ch = CH[prog[bar]];
        if (s === 0) {
          this.pad(ch, t, 8 * sd + 0.6, 0.022, o, 1100);
          this.bass(ch[0] - 12, t, sd * 7, 0.05, o);
        }
        if (s === 1 || s === 5) this.bell(ch[(n >> 2) % 3] + 12, t, 0.022, o);
        if (s === 3 && bar % 2 === 1) this.bell(ch[2] + 24, t, 0.012, o);
      }
    },
    night: {
      bpm: 60,
      step(n, t, sd, o) {
        const s = n % 8,
          bar = n >> 3;
        if (n % 16 === 0) this.pad([40, 47], t, 16 * sd + 1, 0.035, o, 450);
        if (s === 0) this.kick(t, 0.09, o);
        if (s === 1) this.kick(t, 0.055, o);
        if (bar % 2 === 0) {
          const mot = {2: 52, 3: 55, 5: 53, 7: 52};
          if (mot[s]) this.pluck(mtof(mot[s]), t, 0.05, o);
        }
        if (s === 6 && bar % 2 === 1) this.tom(92, t, 0.05, o);
        if (n % 32 === 12) this.bell(76, t, 0.012, o);
        if (n % 32 === 28) this.bell(82, t, 0.009, o);
      }
    },
    battle: {
      bpm: 108,
      step(n, t, sd, o) {
        const prog = ['Em', 'C', 'D', 'B'],
          roots = [40, 36, 38, 35],
          bar = (n >> 3) % 4,
          s = n % 8,
          ch = CH[prog[bar]];
        this.bass(roots[bar] + [0, 0, 12, 0, 3, 0, -2, 0][s], t, sd * 0.8, 0.075, o);
        if (s === 0 || s === 3 || s === 4) this.kick(t, 0.1, o);
        if (s === 2 || s === 6) this.snare(t, 0.05, o);
        this.hat(t + sd * 0.5, 0.012, o);
        if (s === 0) this.brass(ch, t, sd * 1.6, 0.022, o);
        if (s === 4 && bar % 2 === 1) this.brass(ch, t, sd * 0.8, 0.016, o);
        if (bar === 3 && s >= 6) {
          this.snare(t + sd * 0.5, 0.035, o);
          this.tom(120 - (s - 6) * 25, t, 0.06, o);
        }
      }
    }
  },
  setTrack(name) {
    if (name === this.trkName) return;
    const c = this.ctx,
      now = c.currentTime;
    if (this.tg) {
      const old = this.tg;
      old.gain.setTargetAtTime(0, now, 0.7);
      setTimeout(() => {
        try {
          old.disconnect();
        } catch (e) {}
      }, 5000);
    }
    this.trkName = name;
    this.tg = c.createGain();
    this.tg.gain.setValueAtTime(0, now);
    this.tg.gain.setTargetAtTime(1, now, 0.6);
    this.tg.connect(this.mus);
    this.stepN = 0;
    this.nextT = Math.max(now + 0.05, this.hold);
  },
  runMusic() {
    const c = this.ctx,
      now = c.currentTime,
      T = this.tracks[this.trkName];
    if (!T || !this.music || now < this.hold - 0.3) return;
    const sd = 60 / T.bpm / 2;
    if (this.nextT < now - 0.5) this.nextT = now + 0.05;
    while (this.nextT < now + 0.3) {
      T.step.call(this, this.stepN, this.nextT, sd, this.tg);
      this.nextT += sd;
      this.stepN++;
    }
  },
  // short fanfare on victory, slow fall on defeat; the menu theme returns afterwards
  jingle(won) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx,
      t = c.currentTime + 0.1,
      o = c.createGain();
    o.gain.value = 1;
    o.connect(this.mus);
    if (this.tg) this.tg.gain.setTargetAtTime(0, c.currentTime, 0.25);
    this.jingled = true;
    if (won) {
      [67, 72, 76, 79].forEach((m, i) => this.brass([m], t + i * 0.18, i === 3 ? 0.3 : 0.16, 0.05, o));
      this.brass([72, 76, 79], t + 0.72, 1.8, 0.045, o);
      this.pad([48, 55, 64], t + 0.72, 2.6, 0.03, o, 1200);
      for (let i = 0; i < 8; i++) this.snare(t + i * 0.07, 0.02 + i * 0.004, o);
      this.kick(t + 0.72, 0.14, o);
      this.noiseHit(t + 0.72, 1.8, 'highpass', 5000, 0.035, o);
      this.hold = t + 4.5;
    } else {
      [
        [64, 0],
        [62, 0.7],
        [60, 1.4],
        [59, 2.1]
      ].forEach(([m, d], i) => this.brass([m, m - 12], t + d, i === 3 ? 1.8 : 0.6, 0.035, o));
      this.pad([45, 52, 57], t, 4, 0.025, o, 600);
      [0, 1.4, 2.1].forEach(d => this.tom(70, t + d, 0.08, o));
      this.hold = t + 5.5;
    }
  },
  // radio chatter: formant-filtered buzz through a narrow, slightly overdriven band, squelch at both ends
  radio(kind, delay) {
    const lines = RADIO[kind];
    if (!lines || !this.ctx || this.muted || !this.ok('radio', 3)) return;
    const c = this.ctx;
    let t = c.currentTime + 0.05 + (delay || 0);
    const out = c.createGain();
    out.gain.value = 0.55;
    out.connect(this.sfx);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1500;
    bp.Q.value = 0.8;
    bp.connect(out);
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 380;
    hp.connect(bp);
    const sh = c.createWaveShaper();
    sh.curve = this.drive;
    sh.connect(hp);
    lines.forEach(([n, p, sp], li) => {
      this.noiseHit(t, 0.05, 'bandpass', 2400, 0.06, sh, 1.2);
      t += 0.07;
      const o = c.createOscillator();
      o.type = 'sawtooth';
      const vg = c.createGain();
      vg.gain.setValueAtTime(0, t);
      const f1 = c.createBiquadFilter(),
        f2 = c.createBiquadFilter();
      for (const f of [f1, f2]) {
        f.type = 'bandpass';
        f.Q.value = 5;
        o.connect(f);
        f.connect(vg);
      }
      vg.connect(sh);
      let pitch = p;
      o.frequency.setValueAtTime(pitch, t);
      const t0 = t;
      for (let i = 0; i < n; i++) {
        const d = (0.07 + Math.random() * 0.09) / sp,
          gap = (0.02 + Math.random() * 0.05) / sp,
          v = VOW[(Math.random() * VOW.length) | 0];
        f1.frequency.setValueAtTime(v[0], t);
        f2.frequency.setValueAtTime(v[1], t);
        pitch = i === n - 1 ? p * 0.85 : clamp(pitch * (0.9 + Math.random() * 0.2), p * 0.8, p * 1.3);
        o.frequency.linearRampToValueAtTime(pitch, t + d);
        vg.gain.setValueAtTime(0, t);
        vg.gain.linearRampToValueAtTime(0.5, t + 0.015);
        vg.gain.setValueAtTime(0.5, t + d - 0.02);
        vg.gain.linearRampToValueAtTime(0, t + d);
        t += d + gap;
      }
      o.start(t0);
      o.stop(t + 0.05);
      this.count(o);
      this.noiseHit(t, 0.09, 'bandpass', 2000, 0.05, sh, 1);
      if (li === lines.length - 1)
        this.tone(1250, 0.06, 'square', 0.012, 0.002, t - c.currentTime + 0.1, null, this.sfx);
      t += 0.35;
    });
  },
  horn() {
    if (!this.ctx || this.muted) return;
    for (const [f, d] of [
      [98, 0],
      [147, 0.02]
    ]) {
      const c = this.ctx,
        t = c.currentTime + d,
        o = c.createOscillator(),
        fl = c.createBiquadFilter(),
        g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.value = f;
      fl.type = 'lowpass';
      fl.frequency.value = 520;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.09, t + 0.5);
      g.gain.linearRampToValueAtTime(0.07, t + 1.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
      o.connect(fl);
      fl.connect(g);
      g.connect(this.sfx);
      o.start(t);
      o.stop(t + 3);
    }
  },
  bugle() {
    if (!this.ctx || this.muted) return;
    [392, 523, 659, 784].forEach((f, i) =>
      this.tone(f, i === 3 ? 0.9 : 0.3, 'triangle', 0.07, 0.02, i * 0.22)
    );
  },
  coin() {
    if (!this.ok('coin', 0.05)) return;
    const p = 1 + Math.random() * 0.06;
    this.tone(1975 * p, 0.35, 'sine', 0.09);
    this.tone(2960 * p, 0.22, 'sine', 0.05);
    this.tone(4100 * p, 0.1, 'triangle', 0.02);
  },
  pickup() {
    if (!this.ok('pick', 0.06)) return;
    this.tone(2350, 0.18, 'sine', 0.07);
    this.tone(3520, 0.14, 'sine', 0.04, 0, 0.05);
  },
  caw() {
    if (!this.ok('caw', 1.2)) return;
    for (const d of [0, 0.3]) {
      this.tone(560, 0.16, 'sawtooth', 0.01, 0.01, d, 430);
      this.burst(0.14, 'bandpass', 1200, 0.018, d);
    }
  },
  build(x) {
    if (!this.ok('build', 0.34)) return;
    this.fx.hammer.call(this, x);
  },
  // ---------- continuous voices: engines, drone buzz, portal hum ----------
  mkEngine() {
    const c = this.ctx,
      o = c.createOscillator(),
      o2 = c.createOscillator(),
      am = c.createGain(),
      lfo = c.createOscillator(),
      lg = c.createGain(),
      f = c.createBiquadFilter(),
      g = c.createGain();
    o.type = 'sawtooth';
    o2.type = 'triangle';
    am.gain.value = 0.6;
    lg.gain.value = 0.4;
    lfo.connect(lg);
    lg.connect(am.gain);
    f.type = 'lowpass';
    f.Q.value = 1.5;
    g.gain.value = 0;
    o.connect(am);
    o2.connect(am);
    am.connect(f);
    f.connect(g);
    let p = null;
    if (c.createStereoPanner) {
      p = c.createStereoPanner();
      g.connect(p);
      p.connect(this.sfx);
    } else g.connect(this.sfx);
    o.start();
    o2.start();
    lfo.start();
    return {o, o2, lfo, f, g, p, still: 9};
  },
  drive_(L, e, x, moving, fast, dt, k) {
    const t = this.ctx.currentTime,
      m = moving ? (fast ? 1.7 : 1.35) : 1;
    L.still = moving ? 0 : L.still + dt;
    const v = moving ? e.v * (fast ? 1.25 : 1) : L.still < 1.5 ? e.v * 0.35 : 0;
    L.o.frequency.setTargetAtTime(e.f * m, t, 0.15);
    L.o2.frequency.setTargetAtTime(e.f * m * 0.5, t, 0.15);
    L.lfo.frequency.setTargetAtTime(moving ? e.rm * (fast ? 1.4 : 1) : e.r, t, 0.2);
    L.f.frequency.setTargetAtTime(e.lp * (moving ? (fast ? 1.5 : 1.2) : 1), t, 0.2);
    L.g.gain.setTargetAtTime(v * k, t, moving ? 0.12 : 0.5);
    if (L.p) L.p.pan.setTargetAtTime(clamp((x - this.cx) / (W * 0.75), -1, 1) * 0.85, t, 0.1);
  },
  mkBuzz() {
    const c = this.ctx,
      a = c.createOscillator(),
      b = c.createOscillator(),
      bp = c.createBiquadFilter(),
      am = c.createGain(),
      l = c.createOscillator(),
      lg = c.createGain(),
      g = c.createGain();
    a.type = b.type = 'sawtooth';
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 2;
    am.gain.value = 0.7;
    l.frequency.value = 33;
    lg.gain.value = 0.3;
    l.connect(lg);
    lg.connect(am.gain);
    g.gain.value = 0;
    a.connect(bp);
    b.connect(bp);
    bp.connect(am);
    am.connect(g);
    let p = null;
    if (c.createStereoPanner) {
      p = c.createStereoPanner();
      g.connect(p);
      p.connect(this.sfx);
    } else g.connect(this.sfx);
    a.start();
    b.start();
    l.start();
    return {a, b, g, p};
  },
  mkHum() {
    const c = this.ctx,
      a = c.createOscillator(),
      b = c.createOscillator(),
      lp = c.createBiquadFilter(),
      l = c.createOscillator(),
      lg = c.createGain(),
      g = c.createGain();
    a.type = 'sine';
    a.frequency.value = 55;
    b.type = 'sawtooth';
    b.frequency.value = 110.6;
    lp.type = 'lowpass';
    lp.frequency.value = 300;
    lp.Q.value = 6;
    l.frequency.value = 0.21;
    lg.gain.value = 180;
    l.connect(lg);
    lg.connect(lp.frequency);
    g.gain.value = 0;
    a.connect(g);
    b.connect(lp);
    lp.connect(g);
    let p = null;
    if (c.createStereoPanner) {
      p = c.createStereoPanner();
      g.connect(p);
      p.connect(this.sfx);
    } else g.connect(this.sfx);
    a.start();
    b.start();
    l.start();
    return {g, p};
  },
  loops_(dt, s) {
    const t = this.ctx.currentTime,
      L = this.loops,
      run = s.running && !s.paused && !s.over;
    const fade = x => {
      const ad = Math.abs(x - this.cx);
      return ad < W * 0.55 ? 1 : Math.max(0, 1 - (ad - W * 0.55) / 650);
    };
    // player's vehicle
    const pl = s.player,
      pe = L.eng || (L.eng = this.mkEngine()),
      dir = (input.right ? 1 : 0) - (input.left ? 1 : 0),
      mv = run && dir !== 0 && pl.x > 41 && pl.x < WORLD - 41;
    this.drive_(pe, ENG[pl.veh] || ENG.jeep, pl.x, mv, mv && input.fast, dt, run ? 1 : 0);
    if (run && mv && pl.veh === 'tank') {
      this.trackT += dt * (input.fast ? 1.6 : 1);
      if (this.trackT > 0.11) {
        this.trackT = 0;
        const o = this.at(pl.x, 0.8);
        if (o) {
          this.tone(1300 + Math.random() * 500, 0.025, 'triangle', 0.008, 0.001, 0, null, o);
          this.tone(700, 0.03, 'square', 0.004, 0.001, 0.01, null, o);
        }
      }
    }
    // squad BTR or supply convoy, whichever is closer
    const ae = L.aux || (L.aux = this.mkEngine());
    let ax = null,
      amv = false;
    if (run && s.squad && s.squad.moving) {
      ax = s.squad.x;
      amv = true;
    }
    if (run && s.convoy && (ax === null || Math.abs(s.convoy.x - this.cx) < Math.abs(ax - this.cx))) {
      ax = s.convoy.x;
      amv = s.convoy.state !== 'unload';
    }
    this.drive_(ae, ENG.aux, ax === null ? this.cx : ax, amv, false, dt, ax === null ? 0 : fade(ax));
    // drone propellers: the nearest flier sets pitch, loudness and side
    const bz = L.buzz || (L.buzz = this.mkBuzz());
    let nf = null,
      nd = 1e9,
      small = false;
    if (run) {
      for (const e of s.enemies)
        if (e.fly && !e.dead) {
          const d = Math.abs(e.x - this.cx);
          if (d < nd) {
            nd = d;
            nf = e;
          }
        }
      for (const r of s.rabbits)
        if (!r.dead) {
          const d = Math.abs(r.x - this.cx);
          if (d < nd) {
            nd = d;
            nf = r;
            small = true;
          }
        }
    }
    const bk = nf ? fade(nf.x) : 0,
      bf = small ? 300 : nf && nf.kind === 'hive' ? 64 : nf && nf.cargo ? 118 : 150;
    bz.a.frequency.setTargetAtTime(bf, t, 0.2);
    bz.b.frequency.setTargetAtTime(bf * 1.031, t, 0.2);
    bz.g.gain.setTargetAtTime((small ? 0.016 : nf && nf.kind === 'hive' ? 0.05 : 0.03) * bk, t, 0.25);
    if (nf && bz.p) bz.p.pan.setTargetAtTime(clamp((nf.x - this.cx) / (W * 0.75), -1, 1) * 0.85, t, 0.1);
    // portals hum when the camera is near a live one
    const hm = L.hum || (L.hum = this.mkHum());
    let hk = 0,
      hx = this.cx;
    if (s.running)
      s.portals.forEach((px, i) => {
        if (s.portalDead[i]) return;
        const k = Math.max(0, 1 - (Math.abs(px - this.cx) - 200) / 900);
        if (k > hk) {
          hk = k;
          hx = px;
        }
      });
    hm.g.gain.setTargetAtTime(0.04 * Math.min(1, hk) * (s.night ? 1.3 : 1) * (s.paused ? 0 : 1), t, 0.4);
    if (hm.p) hm.p.pan.setTargetAtTime(clamp((hx - this.cx) / (W * 0.75), -1, 1) * 0.85, t, 0.2);
    if (!run) return;
    // walker and brute footsteps, robot chatter
    for (const e of s.enemies) {
      if (e.dead || e.fly || e.fall > 0) continue;
      const d = Math.abs(e.x - this.cx);
      if (d > W * 1.3) continue;
      if (e.kind === 'ram' || (e.kind === 'howitzer' && e.dep)) continue;
      if (e.boss || e.brute) {
        e._st = (e._st || 0) + dt;
        const per = e.kind === 'colossus' ? 0.95 : e.kind === 'howitzer' ? 0.4 : e.boss ? 0.78 : 0.5;
        if (e._st > per) {
          e._st = 0;
          this.play({k: e.boss && e.kind !== 'howitzer' ? 'walkerStep' : 'bruteStep', x: e.x});
        }
      } else if (e.kind === 'jammer') {
        if (d < W * 0.7) this.play({k: 'jam', x: e.x});
      } else if (e.kind === 'bomber') {
        if (d < W * 0.6) this.play({k: 'bombBeep', x: e.x});
      } else if (d < W * 0.6 && Math.random() < dt * 0.18) this.play({k: 'chatter', x: e.x});
    }
  },
  update(dt, s, dk, rain, cx) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    this.cx = cx == null ? C : cx;
    this.season = seasonIdx(s.day);
    this.sfxLP.frequency.setTargetAtTime(s.paused ? 650 : 18000, t, 0.08);
    this.rain.g.gain.setTargetAtTime(rain && !s.paused ? 0.03 : 0, t, 2);
    if (rain && !s.paused && Math.random() < dt * 9)
      this.burst(0.025, 'bandpass', 900 + Math.random() * 900, 0.03);
    const si = this.season;
    if (!s.paused && dk > 0.6 && si < 3 && Math.random() < dt * 2.2) {
      const f = 4300 + Math.random() * 500;
      for (let i = 0; i < 3; i++) this.tone(f, 0.04, 'sine', 0.012, 0.003, i * 0.06);
    }
    if (!s.paused && dk < 0.3 && !rain && si < 2 && Math.random() < dt * 0.35) {
      const f = 2200 + Math.random() * 1200;
      this.tone(f, 0.12, 'sine', 0.018, 0.01, 0, f * 1.4);
      this.tone(f * 1.2, 0.1, 'sine', 0.012, 0.01, 0.14, f * 0.9);
    }
    this.loops_(dt, s);
    // pick the music: menu on the title screen, day/winter, night, battle when the night gets hot (held for a while)
    let name;
    if (!s.running) name = 'menu';
    else if (s.over || s.won) name = this.jingled && t > this.hold ? 'menu' : this.trkName || 'menu';
    else {
      this.jingled = false;
      if (s.night) {
        if (!s.paused) {
          const near = s.enemies.filter(e => !e.dead && Math.abs(e.x - s.player.x) < 500).length;
          if (s.day % 5 === 0 || near >= 5 || s.enemies.some(e => e.boss && !e.dead)) this.battleT = 12;
          else this.battleT = Math.max(0, this.battleT - dt);
        }
        name = this.battleT > 0 ? 'battle' : 'night';
      } else {
        this.battleT = 0;
        name = si === 3 ? 'winter' : 'day';
      }
    }
    this.setTrack(name);
    this.runMusic();
  }
};
