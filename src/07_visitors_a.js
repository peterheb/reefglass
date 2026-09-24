/* =====================================================================
   Special visitors, part 1: framework, turtle, manta, shark, whale shark
   ===================================================================== */
const VIS = { active: null, far: null, next: 13, recent: [], sprites: {} };
function vspr(key, w, h, L, paint, ox = 0.5, oy = 0.5) {
  if (!VIS.sprites[key]) VIS.sprites[key] = new Sprite(w * L, h * L, (g, cw, ch) => { g.setTransform(L, 0, 0, L, cw * ox, ch * oy); paint(g); }, ox, oy);
  return VIS.sprites[key];
}

class Crosser {
  constructor(info, len, speedU, z, yFrac) {
    this.info = info; this.dir = Math.random() < 0.5 ? 1 : -1; this.len = len; this.z = z; this.kind = 'visitor';
    this.x = this.dir > 0 ? -len * 0.9 : W + len * 0.9; this.y0 = H * yFrac; this.y = this.y0; this.vy = 0;
    this.speedU = speedU; this.t = 0; this.leaving = false; this.pitch = 0; this.ph = rand(TAU);
  }
  get k() { return this.len * depthScale(this.z); }
  step(dt, wob = 0.035, wf = 0.3) {
    this.t += dt;
    const v = U * this.speedU * depthScale(this.z) * (this.leaving ? 2.4 : 1);
    this.x += this.dir * v * dt;
    const ny = this.y0 + Math.sin(this.t * wf + this.ph) * H * wob;
    this.vy = (ny - this.y) / Math.max(dt, 1e-3); this.y = ny;
    this.pitch = ease(this.pitch, clamp(Math.atan2(this.vy, v), -0.35, 0.35), 3, dt);
    const m = this.k * 0.75;
    return this.dir > 0 ? this.x < W + m : this.x > -m;
  }
  leave() { this.leaving = true; }
  hit(x, y) { const r = this.k * 0.45; const d = Math.hypot(x - this.x, y - this.y); return d < r ? d / r : -1; }
  anchor() { return [this.x, this.y - this.k * 0.2]; }
}

/* ---------------- Green sea turtle ---------------- */
function paintTurtleShell(g) {
  g.fillStyle = '#86906a'; g.beginPath(); g.ellipse(0.02, 0.1, 0.44, 0.1, 0, 0, TAU); g.fill();
  const yT = (u) => 0.06 - 0.37 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.92)), 0.72), yB = (u) => 0.09 + 0.035 * Math.sin(Math.PI * u), X = (u) => lerp(-0.52, 0.52, u);
  const P = (u, v) => [X(u), lerp(yT(u), yB(u), v)];
  const rows = [[0, 0.36, 5, 0.04], [0.36, 0.8, 4, 0.0], [0.8, 1, 13, 0.02]];
  for (const [v0, v1, n, inset] of rows) for (let i = 0; i < n; i++) {
    const u0 = lerp(inset, 1 - inset, i / n), u1 = lerp(inset, 1 - inset, (i + 1) / n), pts = [];
    for (let s = 0; s <= 4; s++) pts.push(P(lerp(u0, u1, s / 4), v0)); for (let s = 0; s <= 4; s++) pts.push(P(lerp(u1, u0, s / 4), v1));
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    g.beginPath(); pts.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
    const gr = g.createRadialGradient(cx, cy - 0.02, 0.01, cx, cy, 0.14); gr.addColorStop(0, v0 > 0.7 ? '#8a7440' : '#9a7c42'); gr.addColorStop(1, '#4e3c1e');
    g.fillStyle = gr; g.fill(); g.save(); g.clip();
    g.lineCap = 'round';
    for (let r = 0; r < 9; r++) { const a = (r / 9) * TAU + i; g.strokeStyle = r % 2 ? 'rgba(230,190,110,0.35)' : 'rgba(40,26,10,0.35)'; g.lineWidth = 0.012; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 0.15, cy + Math.sin(a) * 0.1); g.stroke(); }
    g.restore(); g.strokeStyle = '#2e2210'; g.lineWidth = 0.008; g.stroke();
  }
  g.strokeStyle = 'rgba(255,240,200,0.35)'; g.lineWidth = 0.01; g.beginPath(); for (let u = 0.03; u <= 0.97; u += 0.02) { const [x, y] = P(u, 0.02); u < 0.04 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  g.fillStyle = '#d8c896'; g.beginPath(); for (let u = 0.02; u <= 0.98; u += 0.02) { const [x, y] = P(u, 1); u < 0.03 ? g.moveTo(x, y) : g.lineTo(x, y); } for (let u = 0.98; u >= 0.02; u -= 0.02) g.lineTo(X(u), yB(u) + 0.03); g.fill();
}
function paintTurtleHead(g) {
  g.fillStyle = '#8a9470';
  g.beginPath(); g.moveTo(0, -0.07); g.quadraticCurveTo(0.1, -0.1, 0.16, -0.08); g.bezierCurveTo(0.26, -0.13, 0.34, -0.06, 0.35, 0.0); g.bezierCurveTo(0.35, 0.05, 0.3, 0.07, 0.22, 0.06); g.quadraticCurveTo(0.1, 0.07, 0, 0.07); g.closePath(); g.fill();
  g.save(); g.clip();
  const plates = [[0.2, -0.08, 0.05], [0.27, -0.07, 0.04], [0.14, -0.07, 0.04], [0.23, -0.035, 0.03], [0.31, -0.03, 0.03]];
  for (const [x, y, r] of plates) { g.fillStyle = '#6a5a30'; g.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.75); } g.closePath(); g.fill(); g.strokeStyle = '#e8dcb0'; g.lineWidth = 0.006; g.stroke(); }
  g.fillStyle = 'rgba(240,230,190,0.5)'; g.fillRect(0, 0.03, 0.4, 0.05);
  g.restore();
  g.strokeStyle = 'rgba(40,30,10,0.6)'; g.lineWidth = 0.007; g.beginPath(); g.moveTo(0.35, 0.015); g.quadraticCurveTo(0.28, 0.03, 0.22, 0.02); g.stroke();
  eye(g, 0.26, -0.02, 0.022, '#3a2a10');
}
function paintTurtleFlipper(len, w) {
  return (g) => {
    const p = new Path2D(); p.moveTo(0, -w * 0.45); p.bezierCurveTo(-len * 0.3, -w * 0.7, -len * 0.8, -w * 0.3, -len, w * 0.1); p.bezierCurveTo(-len * 0.8, w * 0.2, -len * 0.3, w * 0.45, 0, w * 0.4); p.closePath();
    g.fillStyle = hgrad(g, 0, -len, [[0, '#7c8660'], [1, '#5e6844']]); g.fill(p);
    withClip(g, p, () => { for (let i = 0; i < 22; i++) { const x = -((i * 37) % 95) / 100 * len, y = (((i * 53) % 60) / 100 - 0.3) * w; g.fillStyle = '#5a4a28'; g.beginPath(); g.ellipse(x, y, w * 0.12, w * 0.08, 0.3, 0, TAU); g.fill(); g.strokeStyle = '#d8cca0'; g.lineWidth = 0.004; g.stroke(); } });
    g.strokeStyle = 'rgba(230,220,180,0.6)'; g.lineWidth = 0.008; g.stroke(p);
  };
}
class Turtle extends Crosser {
  constructor(info) { super(info, Math.min(U * rand(20, 24), W * 0.42), 4.2, rand(0.22, 0.36), rand(0.26, 0.5)); this.stroke = rand(TAU); }
  update(dt) { this.stroke += dt * TAU / 3.4; this.speedU = 3.2 + 2.2 * Math.max(0, Math.sin(this.stroke)); LIFE.danger.push({ x: this.x, y: this.y, r: this.k * 0.8, scare: false }); return this.step(dt, 0.03, 0.25); }
  draw(g) {
    if (this.glTile) return fglBlit(g, this);
    const L = 260, k = this.k, fog = depthFog(this.z);
    const shell = vspr('tShell', 1.08, 0.74, L, paintTurtleShell), head = vspr('tHead', 0.38, 0.24, L, paintTurtleHead, 0, 0.5);
    const ff = vspr('tFF', 0.72, 0.24, L, paintTurtleFlipper(0.7, 0.2), 1, 0.5), rf = vspr('tRF', 0.3, 0.16, L, paintTurtleFlipper(0.28, 0.12), 1, 0.5);
    const a = -(0.12 + 0.78 * Math.sin(this.stroke)), a2 = -(0.12 + 0.78 * Math.sin(this.stroke - 0.5));
    g.save(); g.translate(this.x, this.y); g.rotate(this.pitch * this.dir); g.scale(this.dir, 1);
    g.save(); g.translate(0.2 * k, -0.04 * k); g.rotate(a2 - 0.1); g.scale(0.8, 1); g.globalAlpha = 0.9; ff.draw(g, 0, 0, 0.72 * k, 0.24 * k, Math.min(1, fog + 0.25)); g.restore(); g.globalAlpha = 1;
    g.save(); g.translate(-0.36 * k, 0.07 * k); g.rotate(-0.35 + 0.18 * Math.sin(this.stroke * 0.5)); rf.draw(g, 0, 0, 0.3 * k, 0.16 * k, fog); g.restore();
    shell.draw(g, 0, 0, 1.08 * k, 0.74 * k, fog);
    g.save(); g.translate(0.46 * k, 0.03 * k); g.rotate(Math.sin(this.stroke) * 0.06); head.draw(g, 0, 0, 0.38 * k, 0.24 * k, fog); g.restore();
    g.save(); g.translate(0.24 * k, 0.07 * k); g.rotate(a); ff.draw(g, 0, 0, 0.72 * k, 0.24 * k, fog); g.restore();
    g.restore();
  }
}

/* ---------------- Reef manta (seen from below) ---------------- */
/* the manta seen from below, in body lengths; flap sets the wing stroke */
function paintManta(g, flap, spots) {
  const c = Math.cos(flap), sn = Math.sin(flap), tipY = 0.5 * (0.8 + 0.2 * c), tipX = -0.13 + 0.035 * sn, lc = 0.3 + 0.05 * c;
  g.strokeStyle = 'rgba(28,34,42,0.85)'; g.lineCap = 'round';
  g.lineWidth = 0.008; g.beginPath(); g.moveTo(-0.24, 0); g.quadraticCurveTo(-0.4, Math.sin(flap * 2) * 0.02, -0.58, Math.sin(flap) * 0.035); g.stroke();
  const p = new Path2D(); p.moveTo(0.2, -0.075);
  p.bezierCurveTo(0.17, -lc * 0.8, 0.02, -tipY * 0.95, tipX, -tipY);
  p.bezierCurveTo(-0.06, -tipY * 0.62, -0.1, -0.2, -0.17, -0.1);
  p.quadraticCurveTo(-0.22, -0.075, -0.25, -0.03); p.lineTo(-0.25, 0.03); p.quadraticCurveTo(-0.22, 0.075, -0.17, 0.1);
  p.bezierCurveTo(-0.1, 0.2, -0.06, tipY * 0.62, tipX, tipY);
  p.bezierCurveTo(0.02, tipY * 0.95, 0.17, lc * 0.8, 0.2, 0.075); p.closePath();
  const gr = g.createRadialGradient(0.05, 0, 0.02, 0.02, 0, 0.52);
  gr.addColorStop(0, '#e6ecee'); gr.addColorStop(0.3, '#cfd8dc'); gr.addColorStop(0.62, '#7c8892'); gr.addColorStop(1, '#262f38');
  g.fillStyle = gr; g.fill(p);
  g.save(); g.clip(p);
  g.fillStyle = 'rgba(30,36,44,0.55)'; for (const [x, y, r] of spots) { g.beginPath(); g.arc(x, y * 0.8, r, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(40,48,58,0.65)'; g.lineWidth = 0.006;
  for (let i = 0; i < 5; i++) { const x = 0.13 - i * 0.022; for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(x, s2 * 0.045); g.quadraticCurveTo(x - 0.012, s2 * 0.07, x - 0.002, s2 * 0.095); g.stroke(); } }
  g.restore();
  for (const s2 of [-1, 1]) {
    g.save(); g.translate(0.215, s2 * 0.068); g.rotate(s2 * -0.25 + Math.sin(flap * 1.3) * 0.08 * s2);
    g.fillStyle = '#48535d'; g.beginPath(); g.ellipse(0.035, 0, 0.055, 0.02, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(210,220,226,0.55)'; g.beginPath(); g.ellipse(0.03, s2 * 0.006, 0.04, 0.008, 0, 0, TAU); g.fill();
    g.restore();
  }
  g.fillStyle = '#161c22'; g.fillRect(0.198, -0.052, 0.014, 0.104);
  g.fillStyle = 'rgba(40,46,52,0.9)'; for (const s2 of [-1, 1]) { g.beginPath(); g.ellipse(-0.235, s2 * 0.045, 0.03, 0.012, s2 * 0.4, 0, TAU); g.fill(); }
  return p;
}
class Manta extends Crosser {
  constructor(info) {
    super(info, Math.min(U * 36, W * 0.62), 6, rand(0.3, 0.42), rand(0.17, 0.3)); this.flap = rand(TAU);
    this.spots = Array.from({ length: 11 }, () => [rand(-0.1, 0.12), rand(-0.13, 0.13), rand(0.008, 0.02)]);
  }
  update(dt) { this.flap += dt * TAU / 4.2; LIFE.danger.push({ x: this.x, y: this.y, r: this.k * 0.4, scare: false }); return this.step(dt, 0.025, 0.2); }
  draw(g) {
    if (this.glTile) return fglBlit(g, this);
    const S = this.k, fog = depthFog(this.z);
    g.save(); g.translate(this.x, this.y); g.rotate(this.pitch * this.dir * 0.5); g.scale(this.dir * S, S);
    const p = paintManta(g, this.flap, this.spots);
    if (fog > 0.02) { g.globalAlpha = fog; g.fillStyle = rgbStr(FOG_RGB); g.fill(p); g.globalAlpha = 1; }
    g.restore();
  }
  hit(x, y) { const r = this.k * 0.4; const d = Math.hypot(x - this.x, y - this.y); return d < r ? d / r : -1; }
}

/* ---------------- Blacktip reef shark ---------------- */
function paintSharkBody(g) {
  const body = new Path2D(); body.moveTo(0.53, 0.02); body.bezierCurveTo(0.5, -0.06, 0.38, -0.12, 0.2, -0.13); body.bezierCurveTo(0.0, -0.14, -0.3, -0.1, -0.5, -0.035); body.lineTo(-0.5, 0.03); body.bezierCurveTo(-0.3, 0.08, 0.0, 0.12, 0.2, 0.12); body.bezierCurveTo(0.38, 0.11, 0.49, 0.07, 0.53, 0.03); body.closePath();
  const fin = (pts, tipFrom) => { const p = new Path2D(); p.moveTo(...pts[0]); p.bezierCurveTo(...pts[1]); p.bezierCurveTo(...pts[2]); p.closePath(); g.fillStyle = '#6f7c80'; g.fill(p); withClip(g, p, () => { g.fillStyle = '#16181a'; g.beginPath(); g.arc(...tipFrom, 0.07, 0, TAU); g.fill(); }); return p; };
  fin([[0.08, -0.12], [0.04, -0.24, 0.0, -0.3, -0.05, -0.34], [-0.07, -0.26, -0.09, -0.18, -0.15, -0.11]], [-0.05, -0.36]);
  fin([[-0.27, -0.07], [-0.29, -0.11, -0.31, -0.13, -0.33, -0.14], [-0.34, -0.11, -0.35, -0.08, -0.37, -0.06]], [-0.33, -0.16]);
  fin([[0.22, 0.09], [0.14, 0.18, 0.06, 0.26, 0.0, 0.3], [0.05, 0.2, 0.08, 0.14, 0.1, 0.1]], [0.0, 0.32]);
  fin([[-0.16, 0.08], [-0.19, 0.12, -0.21, 0.15, -0.24, 0.16], [-0.23, 0.12, -0.23, 0.1, -0.24, 0.07]], [-0.25, 0.18]);
  fin([[-0.33, 0.055], [-0.35, 0.09, -0.37, 0.1, -0.39, 0.11], [-0.39, 0.08, -0.39, 0.07, -0.41, 0.05]], [-0.4, 0.13]);
  g.fillStyle = vgrad(g, -0.14, 0.12, [[0, '#65727a'], [0.45, '#8b979b'], [0.56, '#e9eeee'], [1, '#f6f8f6']]); g.fill(body);
  shade(g, body, -0.14, 0.12, { top: 0.25, sheen: 0.18, edge: 0.25 });
  g.strokeStyle = 'rgba(40,50,56,0.55)'; g.lineWidth = 0.005; for (let i = 0; i < 5; i++) { const x = 0.3 - i * 0.022; g.beginPath(); g.moveTo(x, -0.04); g.quadraticCurveTo(x - 0.012, 0.0, x - 0.004, 0.04); g.stroke(); }
  g.strokeStyle = 'rgba(30,30,30,0.5)'; g.beginPath(); g.moveTo(0.46, 0.06); g.quadraticCurveTo(0.42, 0.085, 0.38, 0.075); g.stroke();
  eye(g, 0.41, -0.035, 0.016, '#9a8a3a');
}
function paintSharkTail(g) {
  const p = new Path2D(); p.moveTo(0.005, -0.03); p.bezierCurveTo(-0.1, -0.1, -0.22, -0.2, -0.31, -0.27); p.bezierCurveTo(-0.24, -0.16, -0.18, -0.06, -0.14, -0.01); p.bezierCurveTo(-0.16, 0.06, -0.18, 0.13, -0.19, 0.19); p.bezierCurveTo(-0.12, 0.12, -0.05, 0.06, 0.005, 0.03); p.closePath();
  g.fillStyle = vgrad(g, -0.27, 0.19, [[0, '#65727a'], [1, '#8b979b']]); g.fill(p);
  withClip(g, p, () => { g.fillStyle = '#16181a'; g.beginPath(); g.arc(-0.31, -0.28, 0.06, 0, TAU); g.fill(); g.beginPath(); g.arc(-0.2, 0.2, 0.06, 0, TAU); g.fill(); });
}
class Shark extends Crosser {
  constructor(info) { super(info, U * rand(26, 32), 9, rand(0.28, 0.42), rand(0.3, 0.55)); this.ph2 = rand(TAU); }
  update(dt) { this.ph2 += dt * TAU * 0.8; LIFE.danger.push({ x: this.x + this.dir * this.k * 0.3, y: this.y, r: U * 42 }); return this.step(dt, 0.05, 0.22); }
  draw(g) {
    if (this.glTile) return fglBlit(g, this);
    const L = 360, k = this.k, fog = depthFog(this.z), osc = Math.sin(this.ph2);
    const body = vspr('shBody', 1.08, 0.72, L, paintSharkBody), tail = vspr('shTail', 0.34, 0.52, L, paintSharkTail, 1, 0.52);
    g.save(); g.translate(this.x, this.y); g.rotate(this.pitch * this.dir); g.scale(this.dir, 1);
    g.save(); g.translate(-0.49 * k, 0); g.rotate(osc * 0.06); g.scale(Math.cos(osc * 0.7), 1); tail.draw(g, 0, 0, 0.34 * k, 0.52 * k, fog); g.restore();
    body.draw(g, 0, 0, 1.08 * k, 0.72 * k, fog);
    g.restore();
  }
  hit(x, y) { const dx = (x - this.x) / (this.k * 0.5), dy = (y - this.y) / (this.k * 0.18); const d = Math.hypot(dx, dy); return d < 1 ? d : -1; }
}

/* ---------------- Whale shark ---------------- */
function paintWhaleSharkBody(g) {
  const body = new Path2D(); body.moveTo(0.52, -0.005); body.bezierCurveTo(0.5, -0.08, 0.38, -0.145, 0.15, -0.16); body.bezierCurveTo(-0.15, -0.16, -0.38, -0.09, -0.5, -0.03); body.lineTo(-0.5, 0.03); body.bezierCurveTo(-0.3, 0.1, -0.05, 0.14, 0.15, 0.14); body.bezierCurveTo(0.38, 0.13, 0.5, 0.08, 0.52, 0.03); body.closePath();
  const d1 = new Path2D(); d1.moveTo(-0.04, -0.15); d1.bezierCurveTo(-0.08, -0.22, -0.12, -0.28, -0.15, -0.31); d1.bezierCurveTo(-0.16, -0.24, -0.18, -0.18, -0.24, -0.13); d1.closePath();
  const d2 = new Path2D(); d2.moveTo(-0.36, -0.08); d2.quadraticCurveTo(-0.39, -0.13, -0.42, -0.14); d2.quadraticCurveTo(-0.42, -0.1, -0.44, -0.06); d2.closePath();
  const pec = new Path2D(); pec.moveTo(0.24, 0.1); pec.bezierCurveTo(0.16, 0.2, 0.08, 0.28, 0.02, 0.32); pec.bezierCurveTo(0.08, 0.2, 0.1, 0.14, 0.12, 0.11); pec.closePath();
  for (const f of [d1, d2, pec]) { g.fillStyle = '#34465a'; g.fill(f); withClip(g, f, () => { g.fillStyle = 'rgba(230,240,245,0.8)'; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(0.3 - ((i * 37) % 80) / 100, -0.34 + ((i * 53) % 70) / 100, 0.006, 0, TAU); g.fill(); } }); }
  g.fillStyle = vgrad(g, -0.16, 0.14, [[0, '#2c3c50'], [0.5, '#44586e'], [0.64, '#dfe6ea'], [1, '#f1f4f4']]); g.fill(body);
  withClip(g, body, () => {
    g.strokeStyle = 'rgba(210,225,235,0.35)'; g.lineWidth = 0.008;
    for (let x = 0.3; x > -0.5; x -= 0.045) { g.beginPath(); g.moveTo(x, -0.2); g.lineTo(x - 0.01, 0.06); g.stroke(); }
    for (const yy of [-0.1, -0.065, -0.03]) { g.strokeStyle = 'rgba(200,215,225,0.3)'; g.lineWidth = 0.006; g.beginPath(); g.moveTo(0.3, yy - 0.02); g.quadraticCurveTo(-0.1, yy, -0.5, yy * 0.3); g.stroke(); }
    g.fillStyle = 'rgba(240,246,250,0.9)';
    for (let x = 0.47; x > -0.5; x -= 0.0225) for (let y = -0.17; y < 0.06; y += 0.024) { if ((Math.round(x * 100) + Math.round(y * 100)) % 3 === 0) continue; const r = x > 0.28 ? 0.0045 : 0.007; g.beginPath(); g.arc(x + ((y * 1000) % 7) * 0.001, y, r, 0, TAU); g.fill(); }
  });
  shade(g, body, -0.16, 0.14, { top: 0.22, sheen: 0.15, edge: 0.3 });
  g.strokeStyle = '#141c24'; g.lineWidth = 0.012; g.lineCap = 'round'; g.beginPath(); g.moveTo(0.52, 0.012); g.quadraticCurveTo(0.49, 0.03, 0.43, 0.035); g.stroke();
  g.strokeStyle = 'rgba(20,30,40,0.55)'; g.lineWidth = 0.005; for (let i = 0; i < 5; i++) { const x = 0.34 - i * 0.02; g.beginPath(); g.moveTo(x, -0.06); g.quadraticCurveTo(x - 0.012, 0.0, x - 0.004, 0.06); g.stroke(); }
  eye(g, 0.43, -0.03, 0.01, '#3a3a3a');
}
function paintWhaleSharkTail(g) {
  const p = new Path2D(); p.moveTo(0.005, -0.025); p.bezierCurveTo(-0.08, -0.12, -0.16, -0.24, -0.22, -0.34); p.bezierCurveTo(-0.2, -0.2, -0.16, -0.08, -0.12, -0.0); p.bezierCurveTo(-0.15, 0.08, -0.18, 0.16, -0.2, 0.22); p.bezierCurveTo(-0.12, 0.14, -0.05, 0.05, 0.005, 0.025); p.closePath();
  g.fillStyle = vgrad(g, -0.34, 0.22, [[0, '#2c3c50'], [1, '#44586e']]); g.fill(p);
  withClip(g, p, () => { g.fillStyle = 'rgba(235,242,246,0.8)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.arc(-((i * 37) % 22) / 100, -0.3 + ((i * 53) % 52) / 100, 0.006, 0, TAU); g.fill(); } });
}
class WhaleShark extends Crosser {
  constructor(info) {
    super(info, Math.min(U * 78, W * 1.05), 3.6, 0.46, rand(0.22, 0.34)); this.ph2 = rand(TAU);
    this.pilots = Array.from({ length: 5 }, (_, i) => ({ ox: 0.56 + rand(0, 0.12), oy: rand(-0.05, 0.1), ph: rand(TAU) }));
  }
  update(dt) { this.ph2 += dt * TAU * 0.25; LIFE.danger.push({ x: this.x, y: this.y, r: this.k * 0.45, scare: false }); return this.step(dt, 0.02, 0.15); }
  draw(g) {
    const L = 520, k = this.k, fog = depthFog(this.z), osc = Math.sin(this.ph2);
    const body = vspr('wsBody', 1.06, 0.66, L, paintWhaleSharkBody), tail = vspr('wsTail', 0.26, 0.6, L, paintWhaleSharkTail, 1, 0.58);
    if (this.glTile) fglBlit(g, this);
    g.save(); g.translate(this.x, this.y); g.rotate(this.pitch * this.dir); g.scale(this.dir, 1);
    if (!this.glTile) {
      g.save(); g.translate(-0.49 * k, 0); g.rotate(osc * 0.04); g.scale(Math.cos(osc * 0.55), 1); tail.draw(g, 0, 0, 0.26 * k, 0.6 * k, fog); g.restore();
      body.draw(g, 0, 0, 1.06 * k, 0.66 * k, fog);
    }
    // remoras riding underneath
    for (const [x, y, s] of [[0.1, 0.138, 1], [-0.08, 0.128, 0.8], [0.2, 0.128, 0.7]]) { g.fillStyle = rgbStr(mixRGB([96, 104, 112], FOG_RGB, fog)); g.beginPath(); g.ellipse(x * k, y * k, 0.03 * k * s, 0.0055 * k * s, 0.05, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect((x - 0.02 * s) * k, (y - 0.003 * s) * k, 0.03 * k * s, 0.002 * k); }
    // juvenile golden trevallies piloting ahead of the mouth
    for (const p of this.pilots) {
      const px = (p.ox + Math.sin(this.t * 1.3 + p.ph) * 0.02) * k, py = (p.oy + Math.cos(this.t * 1.1 + p.ph) * 0.015) * k, s = 0.035 * k;
      g.fillStyle = rgbStr(mixRGB([244, 200, 40], FOG_RGB, fog * 0.8)); g.beginPath(); g.ellipse(px, py, s, s * 0.42, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(px - s * 0.9, py); g.lineTo(px - s * 1.5, py - s * 0.45); g.lineTo(px - s * 1.5, py + s * 0.45); g.fill();
      g.fillStyle = 'rgba(20,20,20,0.6)'; for (let b = 0; b < 4; b++) g.fillRect(px - s * 0.6 + b * s * 0.35, py - s * 0.35, s * 0.1, s * 0.7);
    }
    g.restore();
  }
  hit(x, y) { const dx = (x - this.x) / (this.k * 0.5), dy = (y - this.y) / (this.k * 0.16); const d = Math.hypot(dx, dy); return d < 1 ? d : -1; }
}
