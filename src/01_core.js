'use strict';
/* =====================================================================
   Reefglass — core utilities, canvas, sprites, time of day
   ===================================================================== */
const TAU = Math.PI * 2;
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const ease = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * Math.max(0, dt)));
const sgn = (v) => (v < 0 ? -1 : 1);
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// seeded helpers used by painters (set per painting pass)
let SR = mulberry32(1);
const srand = (a = 1, b) => (b === undefined ? SR() * a : a + SR() * (b - a));
const spick = (arr) => arr[Math.floor(SR() * arr.length)];

/* ---------- value noise ---------- */
function hash1(i) { let h = Math.imul(i ^ 0x27d4eb2d, 0x165667b1); h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; return (h >>> 0) / 4294967296; }
function hash2(i, j) { return hash1(i * 374761393 + j * 668265263); }
function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash1(i), hash1(i + 1), u) * 2 - 1; }
function fbm1(x, oct = 4) { let s = 0, a = 0.5, f = 1, n = 0; for (let o = 0; o < oct; o++) { s += a * noise1(x * f + o * 17.3); n += a; a *= 0.5; f *= 2.03; } return s / n; }
function noise2(x, y) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1);
  return (lerp(lerp(a, b, ux), lerp(c, d, ux), uy)) * 2 - 1;
}
function fbm2(x, y, oct = 4) { let s = 0, a = 0.5, f = 1, n = 0; for (let o = 0; o < oct; o++) { s += a * noise2(x * f + o * 5.1, y * f - o * 3.7); n += a; a *= 0.5; f *= 2.02; } return s / n; }

/* ---------- colour ---------- */
function hexRGB(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mixRGB(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function rgbStr(c, a = 1) { return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
function shadeHex(h, t, to = '#000000') { return rgbStr(mixRGB(hexRGB(h), hexRGB(to), t)); }
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

/* ---------- canvas ---------- */
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
const cv = document.getElementById('tank');
const ctx = cv.getContext('2d', { alpha: false });
let W = 0, H = 0, PX = 1, U = 10;
let maxPixels = window.matchMedia && matchMedia('(pointer: coarse)').matches ? 2.4e6 : 4.2e6;
let SEED = (Math.random() * 1e9) | 0;
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

function measure() {
  W = Math.max(320, window.innerWidth || cv.clientWidth || 800);
  H = Math.max(320, window.innerHeight || cv.clientHeight || 600);
  const dpr = window.devicePixelRatio || 1;
  PX = Math.min(dpr, Math.sqrt(maxPixels / (W * H)));
  cv.width = Math.round(W * PX); cv.height = Math.round(H * PX);
  U = Math.min(H, W * 1.15) / 100;
}

/* ---------- sprites: painted once, mip-mapped, with a fog silhouette ---------- */
const FOG_RGB = [26, 96, 134];
class Sprite {
  // paint(g, w, h) draws into a w×h canvas (sprite pixels). ox/oy = pivot as fraction.
  constructor(w, h, paint, ox = 0.5, oy = 0.5) {
    this.w = Math.ceil(w); this.h = Math.ceil(h); this.ox = ox; this.oy = oy;
    const c = mk(this.w, this.h); const g = c.getContext('2d');
    paint(g, this.w, this.h);
    this.mips = [c]; this.fogs = [];
    let cur = c;
    while (cur.width > 24 && cur.height > 12 && this.mips.length < 6) {
      const n = mk(cur.width / 2, cur.height / 2); const ng = n.getContext('2d');
      ng.imageSmoothingQuality = 'high'; ng.drawImage(cur, 0, 0, n.width, n.height);
      this.mips.push(n); cur = n;
    }
    for (const m of this.mips) {
      const f = mk(m.width, m.height); const fg = f.getContext('2d');
      fg.drawImage(m, 0, 0); fg.globalCompositeOperation = 'source-in';
      fg.fillStyle = rgbStr(FOG_RGB); fg.fillRect(0, 0, f.width, f.height);
      this.fogs.push(f);
    }
  }
  level(devW) { let k = 0; const n = this.mips.length - 1; let w = this.w; while (k < n && w * 0.5 >= devW) { w *= 0.5; k++; } return k; }
  // draw with pivot at (x, y); dw = drawn width in current units; dev = device px per unit
  draw(g, x, y, dw, dh, fog = 0, dev = PX) {
    const k = this.level(dw * dev);
    const X = x - dw * this.ox, Y = y - dh * this.oy;
    g.drawImage(this.mips[k], X, Y, dw, dh);
    if (fog > 0.015) { const a = g.globalAlpha; g.globalAlpha = a * Math.min(1, fog); g.drawImage(this.fogs[k], X, Y, dw, dh); g.globalAlpha = a; }
  }
}

/* soft round dot sprite used by particles and glows */
function makeGlow(r, stops) {
  const c = mk(r * 2, r * 2), g = c.getContext('2d');
  const gr = g.createRadialGradient(r, r, 0, r, r, r);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return c;
}

/* ---------- depth ---------- */
// z: 0 = against the glass, 1 = far back of the reef
const depthScale = (z) => 1 - 0.56 * z;
const depthFog = (z) => clamp(0.04 + 0.78 * Math.pow(z, 1.15), 0, 0.86);

/* ---------- time of day ---------- */
const CYCLE_SECONDS = 420;          // one full day in "Cycle" mode
const TOD = { mode: 'live', phase: 0.12, day: 1, warm: 0, night: 0, moon: 1, label: 'Midday' };
function phaseState(p) {
  // 0–.50 day, .50–.60 sunset, .60–.90 night, .90–1 sunrise
  let day, warm;
  if (p < 0.5) { day = 1; warm = 0; }
  else if (p < 0.6) { const t = (p - 0.5) / 0.1; day = 1 - smooth(t); warm = Math.sin(Math.PI * clamp(t * 1.1, 0, 1)); }
  else if (p < 0.9) { day = 0; warm = 0; }
  else { const t = (p - 0.9) / 0.1; day = smooth(t); warm = 0.7 * Math.sin(Math.PI * t); }
  return { day, warm };
}
const MODE_STATE = { day: { day: 1, warm: 0 }, dusk: { day: 0.42, warm: 1 }, night: { day: 0, warm: 0 } };
/* Live mode: approximate local sunrise/sunset from the date (mid-latitude default,
   daylight-saving aware) and the moon's phase for night brightness. */
function liveState(now = new Date()) {
  const start = new Date(now.getFullYear(), 0, 0), n = Math.floor((now - start) / 864e5);
  const lat = 36 * Math.PI / 180, dec = 23.44 * Math.PI / 180 * Math.sin(TAU * (284 + n) / 365);
  const h0 = Math.acos(clamp(-Math.tan(lat) * Math.tan(dec), -1, 1)) * 180 / Math.PI;
  const jan = new Date(now.getFullYear(), 0, 1).getTimezoneOffset(), jul = new Date(now.getFullYear(), 6, 1).getTimezoneOffset();
  const dst = now.getTimezoneOffset() < Math.max(jan, jul);
  const noon = 12 * 60 + 10 + (dst ? 60 : 0), half = h0 * 4;           // minutes
  const rise = noon - half, set = noon + half, m = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const day = smooth((m - (rise - 25)) / 50) * (1 - smooth((m - (set - 20)) / 55));
  const warm = Math.max(Math.exp(-(((m - rise) / 28) ** 2)) * 0.7, Math.exp(-(((m - set) / 30) ** 2)));
  const moonAge = (((now - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % 29.530588 + 29.530588) % 29.530588;
  TOD.moon = 0.35 + 0.65 * (0.5 - 0.5 * Math.cos(TAU * moonAge / 29.530588));
  TOD.label = m < rise - 25 || m > set + 35 ? 'Night' : Math.abs(m - rise) < 35 ? 'Sunrise' : Math.abs(m - set) < 35 ? 'Sunset' : m < noon - 150 ? 'Morning' : m < noon + 150 ? 'Midday' : 'Afternoon';
  return { day, warm };
}
let liveT = 99, liveTarget = { day: 1, warm: 0 };
function updateTOD(dt) {
  let target;
  if (TOD.mode === 'live') { liveT += dt; if (liveT > 5) { liveT = 0; liveTarget = liveState(); } target = liveTarget; }
  else if (TOD.mode === 'cycle') { TOD.moon = 1; TOD.phase = (TOD.phase + dt / CYCLE_SECONDS) % 1; target = phaseState(TOD.phase); }
  else { TOD.moon = 1; target = MODE_STATE[TOD.mode]; }
  TOD.day = ease(TOD.day, target.day, 1.2, dt);
  TOD.warm = ease(TOD.warm, target.warm, 1.2, dt);
  TOD.night = 1 - TOD.day;
}
function todLabel() {
  if (TOD.mode === 'live') return 'Live · ' + TOD.label;
  if (TOD.mode === 'day') return 'Midday';
  if (TOD.mode === 'dusk') return 'Sunset';
  if (TOD.mode === 'night') return 'Night';
  const p = TOD.phase;
  if (p < 0.12) return 'Morning'; if (p < 0.34) return 'Midday'; if (p < 0.5) return 'Afternoon';
  if (p < 0.6) return 'Sunset'; if (p < 0.9) return 'Night'; return 'Sunrise';
}

/* ---------- performance governor ---------- */
const PERF = { ema: 16, slowFor: 0, fastFor: 0 };
function governPerf(dtMs) {
  PERF.ema = lerp(PERF.ema, dtMs, 0.05);
  if (PERF.ema > 26) { PERF.slowFor += dtMs; PERF.fastFor = 0; } else { PERF.slowFor = 0; }
  if (PERF.slowFor > 2500 && (PERF.steps || 0) < 3) {
    PERF.slowFor = 0; PERF.steps = (PERF.steps || 0) + 1;
    maxPixels = Math.max(0.8e6, Math.min(maxPixels, W * H * PX * PX) * 0.66); requestRebuild(true);
  }
}
