/* =====================================================================
   Reef life: anemone, seagrass, garden eels, chest, bubbles, snow,
   food, bioluminescent sparks, jellyfish
   ===================================================================== */
const LIFE = { anemone: null, grass: [], eels: [], chest: null, bubbles: [], snow: [], food: [], sparks: [], jellies: [], ventT: 0, danger: [] };
let BUBBLE = null;

function buildBubbleSprite() {
  const r = 32, c = mk(r * 2, r * 2), g = c.getContext('2d');
  const gr = g.createRadialGradient(r, r, r * 0.55, r, r, r);
  gr.addColorStop(0, 'rgba(200,245,255,0.05)'); gr.addColorStop(0.8, 'rgba(210,250,255,0.35)'); gr.addColorStop(0.95, 'rgba(240,255,255,0.9)'); gr.addColorStop(1, 'rgba(240,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(r, r, r, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(r * 0.68, r * 0.62, r * 0.2, r * 0.12, -0.7, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.arc(r * 1.3, r * 1.35, r * 0.08, 0, TAU); g.fill();
  BUBBLE = c;
}

/* ---------- anemone (bubble-tip) ---------- */
function initAnemone() {
  const a = REEF.anemone; if (!a) return;
  const pal = pick([['#c9a56b', '#ff7fa8', '#ff5c9a'], ['#9fb86a', '#c8ff7a', '#9dff5c'], ['#b88a6a', '#ffb070', '#ff8a3d']]);
  const tent = [];
  for (let i = 0; i < 96; i++) {
    const u = rand(-1, 1);
    tent.push({ u, a: -Math.PI / 2 + u * 1.25 + rand(-0.2, 0.2), len: U * rand(3.0, 4.6) * (1 - Math.abs(u) * 0.25), w: U * rand(0.4, 0.56), ph: rand(TAU), back: Math.random() < 0.5 });
  }
  tent.sort((p, q) => Math.abs(q.u) - Math.abs(p.u));
  LIFE.anemone = { x: a.x, y: a.y, R: U * 4, pal, tent, shrink: 0 };
}

function drawAnemone(g, t, part) {
  const A = LIFE.anemone; if (!A) return;
  const [base, tip] = A.pal, bRGB = hexRGB(base), tRGB = hexRGB(tip);
  if (part === 'back') {
    g.fillStyle = shadeHex(base, 0.35);
    g.beginPath(); g.ellipse(A.x, A.y + U * 0.2, A.R * 0.95, U * 1.1, 0, 0, TAU); g.fill();
  }
  const sh = 1 - A.shrink * 0.45;
  g.lineCap = 'round';
  for (const tn of A.tent) {
    if ((part === 'back') !== tn.back) continue;
    const bx = A.x + tn.u * A.R, by = A.y - Math.cos(tn.u * 1.2) * U * 0.6;
    const sway = 0.28 * Math.sin(t * 0.9 - bx * 0.018) + 0.1 * Math.sin(t * 2.3 + tn.ph);
    const L = tn.len * sh;
    const a1 = tn.a + sway * 0.6, a2 = tn.a + sway * 1.5;
    const mx = bx + Math.cos(a1) * L * 0.55, my = by + Math.sin(a1) * L * 0.55;
    const ex = mx + Math.cos(a2) * L * 0.5, ey = my + Math.sin(a2) * L * 0.5;
    const k = tn.back ? 0.25 : 0;
    g.strokeStyle = rgbStr(mixRGB(mixRGB(bRGB, tRGB, 0.35), [30, 20, 40], k)); g.lineWidth = tn.w;
    g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
    g.fillStyle = rgbStr(mixRGB(tRGB, [30, 20, 40], k)); g.beginPath(); g.arc(ex, ey, tn.w * 0.72, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(ex - tn.w * 0.2, ey - tn.w * 0.25, tn.w * 0.22, 0, TAU); g.fill();
    tn.ex = ex; tn.ey = ey;
  }
}
function glowAnemone(g) {
  const A = LIFE.anemone; if (!A || TOD.night < 0.05) return;
  g.globalAlpha = 0.55 * TOD.night; const s = U * 1.4;
  const spr = A.pal[2] === '#9dff5c' ? GLOW.green : A.pal[2] === '#ff8a3d' ? GLOW.warm : GLOW.cyan;
  for (let i = 0; i < A.tent.length; i += 2) { const tn = A.tent[i]; if (tn.ex) g.drawImage(spr, tn.ex - s / 2, tn.ey - s / 2, s, s); }
  g.globalAlpha = 1;
}

/* ---------- seagrass ---------- */
function initGrass() {
  LIFE.grass = REEF.grass.map((c) => ({ ...c, front: c.y > H * 0.955, blades: Array.from({ length: c.n }, () => ({ dx: rand(-U * 1.4, U * 1.4), h: c.h * rand(0.55, 1.15), w: U * rand(0.32, 0.58), lean: rand(-0.25, 0.25), ph: rand(TAU), col: pick(['#3f8f4a', '#58a64e', '#2f7a44', '#6cb35a', '#4a9a6a']) })) }));
}
function drawGrass(g, t, front) {
  for (const c of LIFE.grass) {
    if (c.front !== front) continue;
    for (const b of c.blades) {
      const n = 7, pts = [];
      let x = c.x + b.dx, y = c.y, a = -Math.PI / 2 + b.lean;
      const seg = b.h / n;
      for (let i = 0; i <= n; i++) {
        pts.push([x, y, a]);
        const s = i / n;
        a += (0.08 * Math.sin(t * 1.1 - x * 0.01 + b.ph) + 0.05 * Math.sin(t * 2.6 + b.ph + i * 0.5) + 0.035) * (0.4 + s * 1.2);
        x += Math.cos(a) * seg; y += Math.sin(a) * seg;
      }
      b.pts = pts;
      g.beginPath();
      for (let i = 0; i <= n; i++) { const [px, py, pa] = pts[i], w = b.w * (1 - (i / n) * 0.75) * 0.5; const nx = -Math.sin(pa), ny = Math.cos(pa); i ? g.lineTo(px + nx * w, py + ny * w) : g.moveTo(px + nx * w, py + ny * w); }
      for (let i = n; i >= 0; i--) { const [px, py, pa] = pts[i], w = b.w * (1 - (i / n) * 0.75) * 0.5; const nx = -Math.sin(pa), ny = Math.cos(pa); g.lineTo(px - nx * w, py - ny * w); }
      g.closePath(); g.fillStyle = front ? shadeHex(b.col, 0.45) : b.col; g.fill();
      g.strokeStyle = 'rgba(220,255,200,0.25)'; g.lineWidth = 0.8; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
    }
  }
}

/* ---------- garden eels ---------- */
function initEels() {
  const b = REEF.eelBed; LIFE.eels = []; if (!b) return;
  const n = clamp(Math.round((b.x1 - b.x0) / (U * 1.9)), 3, 10);
  for (let i = 0; i < n; i++) {
    const x = lerp(b.x0, b.x1, (i + rand(0.2, 0.8)) / n), y = Math.min(H * 0.95, sandY(x) + U * rand(1.5, 5));
    LIFE.eels.push({ x, y, ext: rand(0.3, 1), tgt: 1, len: U * rand(5.5, 8.5) * lerp(0.8, 1.15, (y - H * 0.87) / (H * 0.08)), w: U * rand(0.42, 0.58), ph: rand(TAU), shy: rand(0.6, 1.4) });
  }
  LIFE.eels.sort((a, b2) => a.y - b2.y);
}
function updateEels(dt) {
  for (const e of LIFE.eels) {
    let tgt = TOD.night > 0.6 ? 0 : 1;
    for (const d of LIFE.danger) if (Math.abs(d.x - e.x) < d.r * e.shy && d.y > H * 0.45) tgt = 0;
    if (Math.random() < dt * 0.02) e.tgt2 = rand(0.4, 0.8);
    if (e.tgt2) { tgt = Math.min(tgt, e.tgt2); if (Math.random() < dt * 0.25) e.tgt2 = 0; }
    e.ext = ease(e.ext, tgt, tgt < e.ext ? 6 : 0.7, dt);
  }
}
function drawEels(g, t) {
  const cur = Math.sin(t * 0.13) > 0 ? -1 : 1;
  for (const e of LIFE.eels) {
    g.fillStyle = 'rgba(40,28,18,0.75)'; g.beginPath(); g.ellipse(e.x, e.y, e.w * 1.1, e.w * 0.38, 0, 0, TAU); g.fill();
    if (e.ext < 0.04) continue;
    const L = e.len * e.ext, n = 12, seg = L / n, pts = [];
    let x = e.x, y = e.y, a = -Math.PI / 2;
    for (let i = 0; i <= n; i++) {
      pts.push([x, y]);
      const s = i / n;
      a = -Math.PI / 2 + 0.18 * Math.sin(t * 1.2 + e.ph + s * 2.5) * s + cur * 1.5 * smooth((s - 0.62) / 0.38) * e.ext;
      x += Math.cos(a) * seg; y += Math.sin(a) * seg;
    }
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.strokeStyle = '#3a3226'; g.lineWidth = e.w + 1.6; g.stroke();
    g.strokeStyle = '#e9e4d2'; g.lineWidth = e.w; g.stroke();
    g.fillStyle = '#1c1612';
    for (let i = 1; i < n; i++) { const [px, py] = pts[i]; g.beginPath(); g.arc(px + (i % 2 ? 1 : -1) * e.w * 0.18, py, e.w * 0.14, 0, TAU); g.fill(); }
    const [hx, hy] = pts[n];
    g.fillStyle = '#efe9d8'; g.beginPath(); g.arc(hx, hy, e.w * 0.62, 0, TAU); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(hx + cur * e.w * 0.2, hy - e.w * 0.12, e.w * 0.2, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(hx + cur * e.w * 0.26, hy - e.w * 0.2, e.w * 0.07, 0, TAU); g.fill();
    g.fillStyle = shadeHex('#d9c59a', 0.1); g.beginPath(); g.ellipse(e.x, e.y + e.w * 0.18, e.w * 0.9, e.w * 0.28, 0, 0, Math.PI); g.fill();
  }
}

/* ---------- treasure chest ---------- */
function initChest() { const c = REEF.chest; LIFE.chest = c ? { x: c.x, y: c.y, open: 0, tgt: 0, timer: rand(14, 26) } : null; }
function updateChest(dt) {
  const c = LIFE.chest; if (!c) return;
  c.timer -= dt;
  if (c.timer <= 0) {
    if (c.tgt === 0) { c.tgt = 1; c.timer = rand(3, 5); c.burst = 2.2; }
    else { c.tgt = 0; c.timer = rand(22, 40); }
  }
  c.open = ease(c.open, c.tgt, c.tgt ? 2.5 : 1.6, dt);
  if (c.burst > 0) { c.burst -= dt; if (c.open > 0.4 && Math.random() < dt * 34) spawnBubble(c.x + rand(-U * 2, U * 2), c.y - U * 3.2, U * rand(0.25, 0.9)); }
}
function drawChest(g) {
  const c = LIFE.chest; if (!c) return;
  const w = U * 6.2, h = U * 3.1, x = c.x, y = c.y;
  g.save(); g.translate(x, y); g.rotate(-0.05);
  contactShadow(g, 0, h * 0.1, w * 0.8);
  const wood = g.createLinearGradient(0, -h, 0, 0); wood.addColorStop(0, '#7a4a2a'); wood.addColorStop(1, '#3d2414');
  g.fillStyle = wood; g.fillRect(-w / 2, -h, w, h);
  g.strokeStyle = 'rgba(20,10,5,0.6)'; g.lineWidth = 1.2;
  for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-w / 2, -h + (i * h) / 4); g.lineTo(w / 2, -h + (i * h) / 4); g.stroke(); }
  g.fillStyle = 'rgba(40,110,90,0.35)'; for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(rand(-w / 2, w / 2) * 0 + (i / 16 - 0.5) * w, -h * ((i * 37) % 10) / 10, U * 0.35, 0, TAU); g.fill(); }
  const brass = '#b88a2e';
  g.fillStyle = brass; g.fillRect(-w / 2 + w * 0.08, -h, w * 0.07, h); g.fillRect(w / 2 - w * 0.15, -h, w * 0.07, h);
  // opening
  const lift = c.open * h * 0.9;
  if (c.open > 0.02) {
    const gg = g.createRadialGradient(0, -h, 0, 0, -h, w * 0.5);
    gg.addColorStop(0, '#fff2a8'); gg.addColorStop(0.4, '#e8b030'); gg.addColorStop(1, '#6a4410');
    g.fillStyle = gg; g.beginPath(); g.ellipse(0, -h, w * 0.46, Math.max(1, lift * 0.45), 0, Math.PI, TAU); g.fill();
    g.fillStyle = '#ffe070'; for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse((i - 3) * w * 0.1, -h - lift * 0.12 - (i % 2) * U * 0.2, U * 0.4, U * 0.16, 0, 0, TAU); g.fill(); }
  }
  // lid
  g.save(); g.translate(0, -h - lift); g.scale(1, 1 - c.open * 0.45);
  const lg = g.createLinearGradient(0, -h * 0.55, 0, 0); lg.addColorStop(0, '#8e5a32'); lg.addColorStop(1, '#4e2e18');
  g.fillStyle = lg; g.beginPath(); g.moveTo(-w / 2, 0); g.bezierCurveTo(-w / 2, -h * 0.72, w / 2, -h * 0.72, w / 2, 0); g.closePath(); g.fill();
  g.fillStyle = brass; g.fillRect(-w / 2 + w * 0.08, -h * 0.55, w * 0.07, h * 0.55); g.fillRect(w / 2 - w * 0.15, -h * 0.55, w * 0.07, h * 0.55);
  g.fillRect(-w * 0.07, -h * 0.12, w * 0.14, h * 0.24);
  g.restore();
  g.fillStyle = '#d4a640'; g.fillRect(-w * 0.06, -h * 0.98 + (c.open > 0.2 ? h : 0) * 0, w * 0.12, h * 0.22);
  // sand drift covering the base
  g.fillStyle = '#cdb287'; g.beginPath(); g.ellipse(-w * 0.15, h * 0.05, w * 0.62, h * 0.24, 0, Math.PI, TAU); g.fill();
  g.restore();
}
function glowChest(g) { const c = LIFE.chest; if (!c || c.open < 0.05) return; g.globalAlpha = c.open * (0.35 + 0.5 * TOD.night); const s = U * 12; g.drawImage(GLOW.warm, c.x - s / 2, c.y - U * 3.6 - s / 2, s, s); g.globalAlpha = 1; }

/* ---------- bubbles ---------- */
function spawnBubble(x, y, r) { if (LIFE.bubbles.length < 420) LIFE.bubbles.push({ x, y, r, ph: rand(TAU), wf: rand(2, 5), pop: 0 }); }
function updateBubbles(dt) {
  const v = REEF.vent;
  if (v) { LIFE.ventT -= dt; if (LIFE.ventT < 0) { LIFE.ventT = Math.random() < 0.08 ? 0.02 : rand(0.1, 0.35); spawnBubble(v.x + rand(-2, 2), v.y, U * rand(0.1, 0.32)); } }
  const surf = H * 0.018;
  for (let i = LIFE.bubbles.length - 1; i >= 0; i--) {
    const b = LIFE.bubbles[i];
    if (b.pop > 0) { b.pop += dt * 3; if (b.pop > 1) LIFE.bubbles.splice(i, 1); continue; }
    b.y -= (U * 3.5 + b.r * 9) * dt;
    b.x += Math.sin(b.y * 0.03 + b.ph) * b.r * 1.4 * dt * b.wf;
    b.r *= 1 + 0.03 * dt;
    if (b.y < surf) b.pop = 0.01;
  }
}
function drawBubbles(g) {
  for (const b of LIFE.bubbles) {
    if (b.pop > 0) { g.strokeStyle = `rgba(230,255,255,${0.6 * (1 - b.pop)})`; g.lineWidth = 1; g.beginPath(); g.ellipse(b.x, b.y, b.r * (1 + b.pop * 3), b.r * 0.5 * (1 + b.pop * 2), 0, 0, TAU); g.stroke(); continue; }
    const s = b.r * 2 * (1 + 0.08 * Math.sin(b.y * 0.1 + b.ph));
    g.drawImage(BUBBLE, b.x - s / 2, b.y - b.r, s, b.r * 2);
  }
}

/* ---------- marine snow & bioluminescent sparks ---------- */
function initSnow() {
  LIFE.snow = [];
  const n = Math.round(clamp((W * H) / 8000, 60, 420));
  for (let i = 0; i < n; i++) LIFE.snow.push({ x: rand(W), y: rand(H), z: Math.pow(Math.random(), 0.7), ph: rand(TAU), s: rand(0.6, 1.4) });
}
function updateSnow(dt, t) {
  for (const p of LIFE.snow) {
    const sp = lerp(1.4, 0.5, p.z);
    p.y += U * 0.35 * sp * dt; p.x += (Math.sin(t * 0.25 + p.ph) * 0.4 + 0.15) * U * sp * dt;
    if (p.y > H + 10) { p.y = -10; p.x = rand(W); } if (p.x > W + 10) p.x = -10; if (p.x < -10) p.x = W + 10;
  }
}
function drawSnow(g, near) {
  for (const p of LIFE.snow) {
    const isNear = p.z < 0.12; if (isNear !== near) continue;
    if (near) { const s = U * (1.6 + (0.12 - p.z) * 14) * p.s; g.globalAlpha = 0.07 + 0.05 * Math.sin(p.ph); g.drawImage(GLOW.soft, p.x - s / 2, p.y - s / 2, s, s); }
    else { const s = U * lerp(0.42, 0.14, p.z) * p.s; g.globalAlpha = lerp(0.55, 0.18, p.z); g.drawImage(GLOW.dot, p.x - s / 2, p.y - s / 2, s, s); }
  }
  g.globalAlpha = 1;
}
function spark(x, y, s = 1) { if (LIFE.sparks.length < 600) LIFE.sparks.push({ x, y, life: 0, max: rand(0.5, 1.4), s: s * rand(0.6, 1.2) }); }
function updateSparks(dt) { for (let i = LIFE.sparks.length - 1; i >= 0; i--) { const s = LIFE.sparks[i]; s.life += dt; s.y -= U * 0.2 * dt; if (s.life > s.max) LIFE.sparks.splice(i, 1); } }
function drawSparks(g) {
  if (!LIFE.sparks.length) return;
  for (const s of LIFE.sparks) { const k = s.life / s.max, a = (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85) * TOD.night; if (a < 0.02) continue; g.globalAlpha = a * 0.85; const r = U * 1.1 * s.s; g.drawImage(GLOW.cyan, s.x - r / 2, s.y - r / 2, r, r); }
  g.globalAlpha = 1;
}

/* ---------- food ---------- */
function dropFood(x, y, n = 14) {
  const cols = ['#e2842f', '#c7562b', '#8a6a2a', '#6c9a3a', '#d8b04a'];
  for (let i = 0; i < n; i++) LIFE.food.push({ x: x + rand(-U * 2.5, U * 2.5), y: y + rand(-U, U), vy: U * rand(1.6, 3.2), ph: rand(TAU), rot: rand(TAU), s: U * rand(0.22, 0.42), col: pick(cols), life: 0, rest: 0 });
}
function updateFood(dt, t) {
  for (let i = LIFE.food.length - 1; i >= 0; i--) {
    const f = LIFE.food[i]; f.life += dt;
    if (f.rest > 0) { f.rest += dt; if (f.rest > 14) LIFE.food.splice(i, 1); continue; }
    f.y += f.vy * dt; f.x += Math.sin(t * 1.3 + f.ph) * U * 0.6 * dt; f.rot += dt * 0.8;
    if (f.y >= reefTopAt(f.x) - U * 0.3) f.rest = 0.01;
  }
}
function drawFood(g) {
  for (const f of LIFE.food) {
    g.save(); g.translate(f.x, f.y); g.rotate(f.rot); g.globalAlpha = f.rest > 10 ? (14 - f.rest) / 4 : 1;
    g.fillStyle = f.col; g.beginPath(); g.moveTo(-f.s, -f.s * 0.4); g.lineTo(f.s * 0.8, -f.s * 0.6); g.lineTo(f.s, f.s * 0.5); g.lineTo(-f.s * 0.6, f.s * 0.5); g.closePath(); g.fill();
    g.restore();
  }
  g.globalAlpha = 1;
}

/* ---------- jellyfish ---------- */
class Jelly {
  constructor(kind) {
    this.kind = kind; this.z = rand(0.3, 0.85); this.r = U * rand(2.4, 3.6); this.x = rand(W); this.y = rand(H * 0.15, H * 0.55);
    this.vx = rand(-1, 1) * U * 0.5; this.vy = 0; this.ph = rand(TAU); this.per = rand(2.2, 3.2); this.tilt = 0;
    this.name = kind === 'moon' ? 'moon' : 'crystal';
  }
  get size() { return this.r * depthScale(this.z); }
  update(dt, t) {
    const c = ((t + this.ph) % this.per) / this.per;
    this.p = c < 0.3 ? Math.sin((c / 0.3) * Math.PI / 2) : Math.cos(((c - 0.3) / 0.7) * Math.PI / 2);
    const thrust = c < 0.3 ? U * 7 : 0;
    this.vy += (-thrust * Math.cos(this.tilt) + U * 1.1) * dt; this.vy *= Math.pow(0.35, dt);
    this.x += (this.vx + Math.sin(this.tilt) * -this.vy * 0.3) * dt; this.y += this.vy * dt;
    const low = Math.min(H * 0.66, reefTopAt(this.x) - this.r * 3);
    this.tilt = ease(this.tilt, this.y > low ? 0 : this.y < H * 0.14 ? 0.5 * sgn(this.vx) : 0.18 * Math.sin(t * 0.1 + this.ph), 0.5, dt);
    if (this.y < H * 0.1) this.vy += U * 3 * dt;
    if (this.x < -W * 0.15) this.x = W * 1.12; if (this.x > W * 1.15) this.x = -W * 0.12;
    if (TOD.night > 0.3 && this.kind === 'crystal' && Math.random() < dt * 3) spark(this.x + rand(-this.r, this.r) * depthScale(this.z), this.y + rand(0, this.r) * depthScale(this.z), 0.6);
  }
  draw(g, t) {
    const s = depthScale(this.z), fog = depthFog(this.z), r = this.r * s, p = this.p || 0;
    const w = r * (1 - 0.2 * p), h = r * 0.62 * (1 + 0.28 * p);
    g.save(); g.translate(this.x, this.y); g.rotate(this.tilt); g.globalAlpha = 1 - fog * 0.55;
    // tentacles
    g.strokeStyle = 'rgba(225,240,255,0.35)'; g.lineWidth = Math.max(0.6, r * 0.018);
    const nT = this.kind === 'moon' ? 34 : 22, tl = this.kind === 'moon' ? r * 0.35 : r * 1.8;
    for (let i = 0; i < nT; i++) {
      const u = i / (nT - 1) * 2 - 1, bx = u * w * 0.98, by = h * 0.16 * (1 - u * u) + r * 0.02;
      g.beginPath(); g.moveTo(bx, by);
      g.quadraticCurveTo(bx + Math.sin(t * 2 + i) * r * 0.08, by + tl * 0.5, bx + Math.sin(t * 1.3 + i * 0.7 + p * 2) * r * 0.18, by + tl * (1 - p * 0.25));
      g.stroke();
    }
    if (this.kind === 'moon') {
      for (let k = 0; k < 4; k++) {
        const ox = (k - 1.5) * r * 0.16; g.fillStyle = 'rgba(235,220,255,0.18)'; g.beginPath(); g.moveTo(ox - r * 0.06, r * 0.05);
        for (let j = 0; j <= 10; j++) { const yy = r * 0.05 + (j / 10) * r * 1.25, xx = ox + Math.sin(t * 1.4 + j * 0.8 + k) * r * 0.1 * (j / 10) + r * 0.08; g.lineTo(xx, yy); }
        for (let j = 10; j >= 0; j--) { const yy = r * 0.05 + (j / 10) * r * 1.25, xx = ox + Math.sin(t * 1.4 + j * 0.8 + k) * r * 0.1 * (j / 10) - r * 0.08; g.lineTo(xx, yy); }
        g.fill();
      }
    }
    // bell
    const gr = g.createRadialGradient(0, -h * 0.4, r * 0.1, 0, -h * 0.2, r * 1.1);
    gr.addColorStop(0, 'rgba(230,245,255,0.14)'); gr.addColorStop(0.7, 'rgba(190,225,255,0.26)'); gr.addColorStop(1, 'rgba(200,230,255,0.5)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-w, h * 0.12);
    g.bezierCurveTo(-w * 1.02, -h * 0.8, w * 1.02, -h * 0.8, w, h * 0.12);
    g.quadraticCurveTo(0, h * 0.42, -w, h * 0.12); g.fill();
    g.strokeStyle = 'rgba(235,250,255,0.55)'; g.lineWidth = Math.max(0.8, r * 0.03); g.stroke();
    if (this.kind === 'moon') {
      g.strokeStyle = 'rgba(236,150,215,0.62)'; g.lineWidth = Math.max(1, r * 0.07);
      for (let k = 0; k < 4; k++) { const ox = (k - 1.5) * w * 0.36; g.beginPath(); g.ellipse(ox, -h * 0.28, w * 0.13, h * 0.16, 0, Math.PI * 0.15, Math.PI * 1.85); g.stroke(); }
    } else {
      g.strokeStyle = 'rgba(230,245,255,0.28)'; g.lineWidth = 0.8;
      for (let k = 0; k < 20; k++) { const u = (k / 19) * 2 - 1; g.beginPath(); g.moveTo(u * w * 0.25, -h * 0.5); g.quadraticCurveTo(u * w * 0.8, -h * 0.35, u * w * 0.95, h * 0.1); g.stroke(); }
    }
    g.restore();
    this.sx = this.x; this.sy = this.y; this.w = w; this.h = h;
  }
  glow(g) {
    if (TOD.night < 0.05) return;
    const s = depthScale(this.z), r = this.r * s, a = TOD.night * (1 - depthFog(this.z) * 0.5);
    g.save(); g.translate(this.x, this.y); g.rotate(this.tilt);
    if (this.kind === 'crystal') {
      g.globalAlpha = a * 0.9; const q = r * 0.5;
      for (let k = 0; k < 14; k++) { const u = (k / 13) * 2 - 1; g.drawImage(GLOW.green, u * this.w - q / 2, this.h * 0.16 * (1 - u * u) - q / 2, q, q); }
      g.globalAlpha = a * 0.22; const b = r * 2.2; g.drawImage(GLOW.cyan, -b / 2, -this.h * 0.3 - b / 2, b, b);
    } else { g.globalAlpha = a * 0.35; const q = r * 2.4; g.drawImage(GLOW.cyan, -q / 2, -this.h * 0.3 - q / 2, q, q); }
    g.restore(); g.globalAlpha = 1;
  }
}
function initJellies() {
  LIFE.jellies = [];
  const n = W > 900 ? 3 : 2;
  for (let i = 0; i < n; i++) LIFE.jellies.push(new Jelly(i === n - 1 ? 'crystal' : 'moon'));
}
