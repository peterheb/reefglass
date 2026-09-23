/* =====================================================================
   Special visitors, part 2: dolphins, humpback, diver, octopus,
   ocean sunfish, flashlight fish — and the visitor schedule
   ===================================================================== */

/* ---------------- Bottlenose dolphins ---------------- */
function paintDolphinBody(g) {
  const b = new Path2D(); b.moveTo(0.54, 0.025); b.lineTo(0.45, 0.0); b.bezierCurveTo(0.41, -0.1, 0.26, -0.155, 0.1, -0.16); b.bezierCurveTo(-0.15, -0.15, -0.35, -0.08, -0.5, -0.022); b.lineTo(-0.5, 0.02); b.bezierCurveTo(-0.3, 0.08, -0.05, 0.14, 0.15, 0.13); b.bezierCurveTo(0.32, 0.12, 0.42, 0.07, 0.46, 0.045); b.lineTo(0.54, 0.035); b.closePath();
  const df = new Path2D(); df.moveTo(0.03, -0.155); df.bezierCurveTo(-0.02, -0.24, -0.08, -0.29, -0.13, -0.3); df.bezierCurveTo(-0.11, -0.23, -0.12, -0.19, -0.19, -0.135); df.closePath();
  g.fillStyle = '#56636e'; g.fill(df);
  g.fillStyle = vgrad(g, -0.16, 0.13, [[0, '#56636e'], [0.42, '#7f8d97'], [0.62, '#d9dfe2'], [1, '#f3ecec']]); g.fill(b);
  withClip(g, b, () => { g.fillStyle = 'rgba(60,72,82,0.45)'; g.beginPath(); g.moveTo(0.35, -0.12); g.bezierCurveTo(0.1, -0.05, -0.2, -0.02, -0.45, 0.0); g.lineTo(-0.5, -0.2); g.lineTo(0.35, -0.2); g.fill(); });
  shade(g, b, -0.16, 0.13, { top: 0.15, sheen: 0.3, edge: 0.22 });
  const pf = new Path2D(); pf.moveTo(0.23, 0.07); pf.bezierCurveTo(0.19, 0.13, 0.13, 0.19, 0.07, 0.21); pf.bezierCurveTo(0.11, 0.14, 0.15, 0.1, 0.17, 0.07); pf.closePath();
  g.fillStyle = '#65737e'; g.fill(pf);
  g.strokeStyle = 'rgba(40,40,50,0.5)'; g.lineWidth = 0.006; g.lineCap = 'round'; g.beginPath(); g.moveTo(0.54, 0.03); g.quadraticCurveTo(0.47, 0.045, 0.42, 0.03); g.stroke();
  g.strokeStyle = 'rgba(50,60,70,0.35)'; g.beginPath(); g.moveTo(0.36, -0.03); g.quadraticCurveTo(0.3, 0.02, 0.22, 0.07); g.stroke();
  g.beginPath(); g.moveTo(0.21, -0.158); g.lineTo(0.19, -0.155); g.stroke();
  eye(g, 0.37, -0.035, 0.013, '#2a2a2a');
}
function paintDolphinFluke(g) {
  g.fillStyle = 'rgba(120,132,140,0.6)'; g.beginPath(); g.moveTo(0, -0.01); g.quadraticCurveTo(-0.12, -0.08, -0.2, -0.1); g.quadraticCurveTo(-0.17, -0.04, -0.15, -0.005); g.closePath(); g.fill();
  g.fillStyle = '#5c6a75'; g.beginPath(); g.moveTo(0.005, -0.018); g.quadraticCurveTo(-0.14, -0.04, -0.24, -0.02); g.quadraticCurveTo(-0.23, 0.02, -0.2, 0.05); g.quadraticCurveTo(-0.1, 0.02, 0.005, 0.02); g.closePath(); g.fill();
}
class Dolphins {
  constructor(info) {
    this.info = info; this.kind = 'visitor'; this.dir = Math.random() < 0.5 ? 1 : -1; this.t = 0; this.z = 0.3; this.leaving = false;
    this.len = Math.min(U * 21, W * 0.3); this.dur = clamp(W / (U * 16), 7, 16);
    this.pod = [0, 0.55, 1.05].map((lag, i) => ({ lag, dy: [0, -0.06, 0.05][i], z: [0.28, 0.36, 0.32][i], s: [1, 0.92, 0.85][i], ph: rand(TAU), x: -1e4, y: 0, pitch: 0 }));
  }
  update(dt) {
    this.t += dt * (this.leaving ? 2 : 1); let alive = false;
    for (const d of this.pod) {
      const p = (this.t - d.lag) / this.dur;
      const x0 = this.dir > 0 ? -this.len : W + this.len, x1 = this.dir > 0 ? W + this.len : -this.len;
      const nx = lerp(x0, x1, p), ny = H * (0.1 + d.dy + 0.34 * Math.sin(Math.PI * clamp(p, 0, 1)));
      d.pitch = ease(d.pitch, clamp(Math.atan2(ny - d.y, Math.abs(nx - d.x) + 0.01), -0.7, 0.7), 5, dt);
      d.x = nx; d.y = ny; d.ph += dt * TAU * 1.5; d.k = this.len * d.s * depthScale(d.z);
      if (p < 1.05) alive = true;
      if (p > 0 && p < 1) LIFE.danger.push({ x: d.x, y: d.y, r: U * 26 });
    }
    this.x = this.pod[0].x; this.y = this.pod[0].y;
    return alive;
  }
  leave() { this.leaving = true; }
  draw(g) {
    const L = 320, body = vspr('dBody', 1.1, 0.62, L, paintDolphinBody), fl = vspr('dFluke', 0.26, 0.24, L, paintDolphinFluke, 1, 0.5);
    for (const d of [...this.pod].sort((a, b) => b.z - a.z)) {
      const k = d.k, fog = depthFog(d.z), osc = Math.sin(d.ph);
      g.save(); g.translate(d.x, d.y); g.scale(this.dir, 1); g.rotate(d.pitch * this.dir + osc * 0.05);
      g.save(); g.translate(-0.49 * k, 0); g.rotate(osc * 0.45); fl.draw(g, 0, 0, 0.26 * k, 0.24 * k, fog); g.restore();
      body.draw(g, 0, 0, 1.1 * k, 0.62 * k, fog);
      g.restore();
    }
  }
  hit(x, y) { for (const d of this.pod) if (Math.hypot(x - d.x, y - d.y) < d.k * 0.45) { this.x = d.x; this.y = d.y; return 0.5; } return -1; }
  anchor() { return [this.x, this.y - this.len * 0.25]; }
}

/* ---------------- Humpback whale (far background) ---------------- */
function paintHumpbackBody(g) {
  const b = new Path2D(); b.moveTo(0.52, 0.02); b.bezierCurveTo(0.5, -0.05, 0.4, -0.085, 0.25, -0.09); b.bezierCurveTo(0.0, -0.1, -0.3, -0.07, -0.5, -0.015); b.lineTo(-0.5, 0.015); b.bezierCurveTo(-0.3, 0.07, 0.0, 0.14, 0.25, 0.13); b.bezierCurveTo(0.42, 0.12, 0.5, 0.08, 0.52, 0.04); b.closePath();
  g.fillStyle = '#2a323a'; g.beginPath(); g.moveTo(-0.14, -0.085); g.quadraticCurveTo(-0.17, -0.12, -0.2, -0.12); g.quadraticCurveTo(-0.19, -0.1, -0.21, -0.075); g.fill();
  g.fillStyle = vgrad(g, -0.1, 0.13, [[0, '#262e36'], [0.55, '#3c4650'], [0.75, '#9aa2a6'], [1, '#c8cccc']]); g.fill(b);
  withClip(g, b, () => { g.strokeStyle = 'rgba(20,24,30,0.5)'; g.lineWidth = 0.004; for (let i = 0; i < 12; i++) { const y = 0.05 + i * 0.007; g.beginPath(); g.moveTo(0.5, y - 0.02); g.quadraticCurveTo(0.3, y + 0.02, 0.05, y + 0.01); g.stroke(); } g.fillStyle = 'rgba(210,215,215,0.45)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(-0.45 + ((i * 37) % 90) / 100, 0.02 + ((i * 53) % 10) / 100, 0.006, 0, TAU); g.fill(); } });
  g.fillStyle = '#20282e'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(0.49 - i * 0.03, -0.055 + i * -0.003, 0.006, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(15,18,22,0.7)'; g.lineWidth = 0.006; g.beginPath(); g.moveTo(0.52, 0.03); g.quadraticCurveTo(0.42, 0.045, 0.34, 0.02); g.stroke();
  eye(g, 0.33, 0.0, 0.008, '#222');
}
function paintHumpbackFin(g) { const p = new Path2D(); p.moveTo(0, -0.02); p.bezierCurveTo(-0.12, -0.02, -0.26, 0.02, -0.34, 0.06); p.quadraticCurveTo(-0.2, 0.05, 0, 0.025); p.closePath(); g.fillStyle = hgrad(g, 0, -0.34, [[0, '#9aa2a4'], [1, '#e8ecec']]); g.fill(p); g.fillStyle = '#c8cccc'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(-0.04 - i * 0.04, -0.02 + i * 0.01, 0.006, 0, TAU); g.fill(); } }
function paintHumpbackFluke(g) { g.fillStyle = '#262e36'; g.beginPath(); g.moveTo(0.005, -0.012); g.quadraticCurveTo(-0.1, -0.03, -0.18, -0.02); g.quadraticCurveTo(-0.17, 0.02, -0.15, 0.04); g.quadraticCurveTo(-0.08, 0.02, 0.005, 0.012); g.closePath(); g.fill(); }
class Humpback extends Crosser {
  constructor(info) { super(info, Math.min(U * 120, W * 1.2), 6, 0.93, rand(0.36, 0.46)); this.kick = rand(TAU); this.sang = false; }
  update(dt) { this.kick += dt * TAU * 0.22; if (!this.sang && this.t > 2) { this.sang = true; AUDIO.whale(); } return this.step(dt, 0.015, 0.12); }
  draw(g) {
    const L = 600, k = this.k, fog = depthFog(this.z), osc = Math.sin(this.kick);
    const body = vspr('hbBody', 1.06, 0.3, L, paintHumpbackBody), fin = vspr('hbFin', 0.36, 0.12, L, paintHumpbackFin, 1, 0.3), fl = vspr('hbFluke', 0.2, 0.08, L, paintHumpbackFluke, 1, 0.5);
    g.save(); g.translate(this.x, this.y); g.scale(this.dir, 1); g.rotate(this.pitch * this.dir + osc * 0.02);
    g.save(); g.translate(-0.49 * k, 0); g.rotate(osc * 0.3); fl.draw(g, 0, 0, 0.2 * k, 0.08 * k, fog); g.restore();
    body.draw(g, 0, 0, 1.06 * k, 0.3 * k, fog);
    g.save(); g.translate(0.2 * k, 0.07 * k); g.rotate(-0.25 + Math.sin(this.kick * 0.5) * 0.12); fin.draw(g, 0, 0, 0.36 * k, 0.12 * k, fog); g.restore();
    g.restore();
  }
  hit(x, y) { const dx = (x - this.x) / (this.k * 0.5), dy = (y - this.y) / (this.k * 0.1); const d = Math.hypot(dx, dy); return d < 1 ? d : -1; }
}

/* ---------------- Scuba diver ---------------- */
class Diver extends Crosser {
  constructor(info) { super(info, Math.min(U * 30, W * 0.5), 4.5, 0.3, rand(0.3, 0.5)); this.kick = 0; this.breath = 1.5; this.fin = pick(['#f2c21a', '#1fb6c8', '#ff6a3a']); }
  update(dt) {
    this.kick += dt * TAU * 0.85; this.breath -= dt;
    const k = this.k;
    if (this.breath < 0) { this.breath = rand(3.4, 4.4); for (let i = 0; i < 12; i++) spawnBubble(this.x + this.dir * k * 0.3 + rand(-3, 3), this.y - k * 0.04 + rand(-3, 3), U * rand(0.2, 0.75)); AUDIO.bubbles(0.6); }
    LIFE.danger.push({ x: this.x, y: this.y, r: U * 24 });
    return this.step(dt, 0.02, 0.18);
  }
  limb(g, x0, y0, a1, l1, a2, l2, w, col) {
    const x1 = x0 + Math.cos(a1) * l1, y1 = y0 + Math.sin(a1) * l1, x2 = x1 + Math.cos(a1 + a2) * l2, y2 = y1 + Math.sin(a1 + a2) * l2;
    g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    return [x2, y2, a1 + a2];
  }
  draw(g) {
    const k = this.k, fog = depthFog(this.z), suit = rgbStr(mixRGB([26, 32, 44], FOG_RGB, fog)), suit2 = rgbStr(mixRGB([14, 18, 26], FOG_RGB, fog));
    const finC = rgbStr(mixRGB(hexRGB(this.fin), FOG_RGB, fog));
    g.save(); g.translate(this.x, this.y); g.rotate(this.pitch * this.dir * 0.6); g.scale(this.dir * k, k);
    const s1 = Math.sin(this.kick), s2 = Math.sin(this.kick + Math.PI);
    const leg = (s, col) => {
      const [ax, ay, aa] = this.limb(g, -0.15, 0.01, Math.PI - 0.05 + s * 0.2, 0.2, -0.18 - s * 0.16, 0.19, 0.06, col);
      g.save(); g.translate(ax, ay); g.rotate(aa - 0.1 + s * 0.25); g.fillStyle = finC;
      g.beginPath(); g.moveTo(0, -0.02); g.lineTo(0.24, -0.035); g.quadraticCurveTo(0.26, 0.0, 0.24, 0.03); g.lineTo(0, 0.025); g.closePath(); g.fill(); g.restore();
    };
    leg(s2, suit2);
    this.limb(g, 0.15, 0.03, 0.9 + s1 * 0.05, 0.12, -0.6, 0.12, 0.045, suit2);
    // tank + valve
    g.fillStyle = rgbStr(mixRGB([229, 194, 41], FOG_RGB, fog)); g.beginPath(); g.ellipse(0.02, -0.085, 0.15, 0.042, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-0.1, -0.11, 0.22, 0.012);
    g.fillStyle = '#555'; g.fillRect(0.16, -0.1, 0.035, 0.03);
    // torso with BCD
    g.fillStyle = suit; g.beginPath(); g.ellipse(0.02, 0.0, 0.19, 0.058, 0, 0, TAU); g.fill();
    g.fillStyle = rgbStr(mixRGB([43, 179, 168], FOG_RGB, fog)); g.fillRect(-0.14, 0.015, 0.28, 0.012);
    g.fillStyle = rgbStr(mixRGB([40, 44, 54], FOG_RGB, fog)); g.fillRect(-0.02, -0.05, 0.14, 0.09);
    // head, hood, mask, regulator
    g.fillStyle = suit2; g.beginPath(); g.arc(0.25, -0.01, 0.048, 0, TAU); g.fill();
    const mg = g.createLinearGradient(0.26, -0.04, 0.3, 0.0); mg.addColorStop(0, 'rgba(210,240,255,0.95)'); mg.addColorStop(1, 'rgba(60,120,160,0.9)');
    g.fillStyle = '#111'; g.fillRect(0.265, -0.042, 0.035, 0.036); g.fillStyle = mg; g.fillRect(0.272, -0.036, 0.024, 0.024);
    g.fillStyle = '#222'; g.beginPath(); g.arc(0.29, 0.02, 0.016, 0, TAU); g.fill();
    g.strokeStyle = '#1a1a1a'; g.lineWidth = 0.01; g.beginPath(); g.moveTo(0.18, -0.08); g.quadraticCurveTo(0.26, -0.1, 0.29, 0.02); g.stroke();
    leg(s1, suit);
    const [hx, hy] = this.limb(g, 0.15, 0.035, 0.75 + s2 * 0.05, 0.12, -0.55, 0.12, 0.05, suit);
    g.fillStyle = '#333'; g.save(); g.translate(hx, hy); g.rotate(-0.2); g.fillRect(-0.01, -0.012, 0.07, 0.024); g.fillStyle = '#ffe9a0'; g.fillRect(0.058, -0.01, 0.01, 0.02); g.restore();
    this.hand = [hx, hy];
    g.restore();
  }
  glow(g) {
    if (!this.hand) return;
    const k = this.k, [hx, hy] = this.hand, x = this.x + this.dir * hx * k, y = this.y + hy * k;
    const a = 0.15 + 0.6 * TOD.night;
    g.save(); g.translate(x, y); g.scale(this.dir, 1); g.rotate(0.12 + this.pitch * 0.5);
    const gr = g.createLinearGradient(0, 0, k * 0.9, 0); gr.addColorStop(0, `rgba(255,245,210,${a})`); gr.addColorStop(1, 'rgba(255,245,210,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, -k * 0.01); g.lineTo(k * 0.9, -k * 0.16); g.lineTo(k * 0.9, k * 0.16); g.lineTo(0, k * 0.01); g.fill();
    g.globalAlpha = a; g.drawImage(GLOW.warm, -k * 0.05, -k * 0.05, k * 0.1, k * 0.1);
    g.restore(); g.globalAlpha = 1;
  }
}

/* ---------------- Day octopus (lives in the cave) ---------------- */
class Octopus {
  constructor(info) {
    this.info = info; this.kind = 'visitor'; this.z = 0.24; const c = REEF.cave;
    this.hx = c.x; this.hy = c.y; this.x = c.x; this.y = c.y; this.out = 0; this.state = 'peek'; this.st = 0; this.m = U * 4.6; this.col = 0; this.tcol = 0; this.dir = 1;
    this.arms = Array.from({ length: 8 }, (_, i) => ({ a: Math.PI / 2 + (i - 3.5) * 0.36, len: U * rand(11, 14.5), ph: rand(TAU) }));
    this.ink = []; this.leaving = false; this.t = 0; this.jet = 0;
  }
  leave() { if (this.state !== 'jet') this.startJet(); }
  startJet() { this.state = 'jet'; this.st = 0; this.jvx = rand(-1, 1) * U * 6; for (let i = 0; i < 26; i++) this.ink.push({ x: this.x + rand(-U * 2, U * 2), y: this.y + rand(-U * 2, U * 2), r: U * rand(1.5, 3), vx: rand(-1, 1) * U * 3, vy: rand(-1, 1) * U * 3, life: 0 }); AUDIO.bubbles(0.8); }
  update(dt, t) {
    this.t += dt; this.st += dt;
    const A = (x) => reefTopAt(x) - this.m * 0.35;
    if (this.state === 'peek') { this.out = ease(this.out, 0.25, 1.5, dt); if (this.st > 3) { this.state = 'emerge'; this.st = 0; } }
    else if (this.state === 'emerge') { this.out = ease(this.out, 1, 1.4, dt); this.y = ease(this.y, this.hy - this.m * 0.6, 1, dt); if (this.st > 3) { this.legs = 0; this.newLeg(); } }
    else if (this.state === 'crawl') {
      const d = this.tx - this.x; this.x += clamp(d, -U * 2.2 * dt, U * 2.2 * dt); this.y = ease(this.y, Math.min(A(this.x), H * 0.9), 1.5, dt);
      if (Math.abs(d) < U || this.st > 14) { this.state = 'pose'; this.st = 0; }
    } else if (this.state === 'pose') { this.tcol = Math.floor(this.st / 1.3) % 3; if (this.st > 6) { if (this.legs < 2) this.newLeg(); else { this.state = 'return'; this.st = 0; this.dir = sgn(this.hx - this.x); } } }
    else if (this.state === 'return') {
      const d = this.hx - this.x; this.x += clamp(d, -U * 2.4 * dt, U * 2.4 * dt); this.y = ease(this.y, Math.abs(d) < U * 2 ? this.hy : Math.min(A(this.x), H * 0.9), 1.5, dt);
      if (Math.abs(d) < U * 1.5) { this.out = ease(this.out, 0, 1.2, dt); if (this.out < 0.03) return false; }
    } else if (this.state === 'jet') {
      this.x += this.jvx * dt; this.y -= U * (8 + this.st * 16) * dt; this.out = 1;
      if (this.y < -U * 12) { this.gone = true; }
    }
    if (this.state !== 'jet' && this.state !== 'pose') this.tcol = (Math.sin(t * 0.7) > 0.6) ? 1 : 0;
    this.col = ease(this.col, this.tcol, 3, dt);
    for (let i = this.ink.length - 1; i >= 0; i--) { const p = this.ink[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.4, dt); p.vy *= Math.pow(0.4, dt); p.r += U * 1.6 * dt; if (p.life > 7) this.ink.splice(i, 1); }
    if (this.gone && !this.ink.length) return false;
    return true;
  }
  newLeg() { this.state = 'crawl'; this.st = 0; this.legs++; const s = Math.random() < 0.5 ? -1 : 1; this.tx = clamp(this.x + s * rand(0.07, 0.16) * W, W * 0.05, W * 0.95); if (Math.abs(this.tx - this.x) < W * 0.05) this.tx = clamp(this.x - s * W * 0.1, W * 0.05, W * 0.95); this.dir = sgn(this.tx - this.x); }
  palette() { const c = this.col; const a = c < 1 ? mixRGB([150, 62, 44], [228, 206, 188], c) : mixRGB([228, 206, 188], [190, 40, 40], c - 1); return a; }
  draw(g, t) {
    if (!this.gone && this.out > 0.01) {
      const m = this.m * (0.35 + 0.65 * this.out), col = this.palette(), dark = mixRGB(col, [40, 10, 10], 0.45), fog = depthFog(this.z);
      const C = rgbStr(mixRGB(col, FOG_RGB, fog)), D = rgbStr(mixRGB(dark, FOG_RGB, fog));
      const jet = this.state === 'jet';
      g.save(); g.translate(this.x, this.y);
      // arms
      for (let i = 0; i < 8; i++) {
        const A = this.arms[i], reach = (jet ? 0.9 : 0.55 + 0.35 * this.out) * A.len * (0.35 + 0.65 * this.out);
        const baseA = jet ? Math.PI / 2 + (i - 3.5) * 0.08 : A.a + Math.sin(t * 0.9 + A.ph) * 0.25;
        const bx = Math.cos(A.a) * m * 0.35, by = m * 0.25;
        const n = 12, pts = []; let x = bx, y = by, a = baseA;
        for (let s = 0; s <= n; s++) { pts.push([x, y]); const u = s / n; a += (Math.sin(t * 1.4 + A.ph + u * 4) * 0.18 + (jet ? 0 : (i < 4 ? -0.05 : 0.05)) + (u > 0.7 ? (i < 4 ? -0.35 : 0.35) * (u - 0.7) * 3 : 0)); x += Math.cos(a) * reach / n; y += Math.sin(a) * reach / n; }
        g.beginPath();
        for (let s = 0; s <= n; s++) { const w = m * 0.21 * (1 - s / n * 0.88); const p = pts[s], q = pts[Math.min(s + 1, n)]; const aa = Math.atan2(q[1] - p[1], q[0] - p[0] + 1e-6); s ? g.lineTo(p[0] - Math.sin(aa) * w, p[1] + Math.cos(aa) * w) : g.moveTo(p[0] - Math.sin(aa) * w, p[1] + Math.cos(aa) * w); }
        for (let s = n; s >= 0; s--) { const w = m * 0.21 * (1 - s / n * 0.88); const p = pts[s], q = pts[Math.min(s + 1, n)]; const aa = Math.atan2(q[1] - p[1], q[0] - p[0] + 1e-6); g.lineTo(p[0] + Math.sin(aa) * w, p[1] - Math.cos(aa) * w); }
        g.closePath(); g.fillStyle = i % 2 ? D : C; g.fill();
        if (i % 2 === 0) { g.fillStyle = 'rgba(255,235,225,0.55)'; for (let s = 2; s < n; s += 1) { const p = pts[s]; g.beginPath(); g.arc(p[0], p[1] + m * 0.05, m * 0.035 * (1 - s / n), 0, TAU); g.fill(); } }
      }
      // mantle and head
      g.rotate(jet ? 0 : -0.5 * this.dir);
      const gr = g.createRadialGradient(-m * 0.15, -m * 0.5, m * 0.1, 0, -m * 0.3, m * 0.9); gr.addColorStop(0, rgbStr(mixRGB(col, [255, 240, 230], 0.3))); gr.addColorStop(1, D);
      g.fillStyle = gr; g.beginPath(); g.ellipse(0, -m * 0.45, m * 0.45, m * 0.62, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,240,230,0.35)'; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(Math.sin(i * 2.3) * m * 0.35, -m * 0.45 + Math.cos(i * 1.7) * m * 0.5, m * 0.035, 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(40,10,10,0.3)'; for (let i = 0; i < 10; i++) { g.beginPath(); g.arc(Math.cos(i * 2.9) * m * 0.3, -m * 0.5 + Math.sin(i * 1.3) * m * 0.4, m * 0.06, 0, TAU); g.fill(); }
      g.rotate(jet ? 0 : 0.5 * this.dir);
      for (const s of [-1, 1]) {
        const ex = s * m * 0.28, ey = m * 0.05;
        g.fillStyle = C; g.beginPath(); g.arc(ex, ey, m * 0.16, 0, TAU); g.fill();
        g.fillStyle = '#f2e6c0'; g.beginPath(); g.arc(ex, ey - m * 0.02, m * 0.1, 0, TAU); g.fill();
        g.fillStyle = '#111'; g.fillRect(ex - m * 0.07, ey - m * 0.035, m * 0.14, m * 0.03);
      }
      g.restore();
    }
    for (const p of this.ink) { const a = Math.max(0, 0.55 * (1 - p.life / 7)); g.globalAlpha = a; g.drawImage(GLOW.ink, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }
    g.globalAlpha = 1;
  }
  hit(x, y) { if (this.out < 0.2 || this.gone) return -1; const d = Math.hypot(x - this.x, y - (this.y - this.m * 0.3)); return d < U * 6 ? d / (U * 6) : -1; }
  anchor() { return [this.x, this.y - this.m * 1.2]; }
  tapped() { if (this.state !== 'jet' && this.state !== 'peek') this.startJet(); }
}

/* ---------------- Ocean sunfish ---------------- */
function paintMolaBody(g) {
  const b = new Path2D(); b.moveTo(0.5, 0.0); b.bezierCurveTo(0.5, -0.3, 0.22, -0.44, -0.08, -0.42); b.bezierCurveTo(-0.3, -0.4, -0.42, -0.26, -0.46, -0.1);
  for (let i = 0; i <= 8; i++) { const y = lerp(-0.1, 0.1, i / 8); b.quadraticCurveTo(-0.5 - (i % 2 ? 0.035 : 0), y - 0.012, -0.47, y); }
  b.bezierCurveTo(-0.42, 0.26, -0.3, 0.4, -0.08, 0.42); b.bezierCurveTo(0.22, 0.44, 0.5, 0.3, 0.5, 0.0); b.closePath();
  g.fillStyle = vgrad(g, -0.42, 0.42, [[0, '#6f7c86'], [0.45, '#a6b2b8'], [1, '#dfe5e6']]); g.fill(b);
  withClip(g, b, () => {
    for (let i = 0; i < 40; i++) { g.fillStyle = i % 3 ? 'rgba(235,242,244,0.28)' : 'rgba(60,70,80,0.22)'; g.beginPath(); g.ellipse(-0.4 + ((i * 37) % 85) / 100, -0.36 + ((i * 53) % 72) / 100, 0.03 + (i % 4) * 0.012, 0.02 + (i % 3) * 0.01, i, 0, TAU); g.fill(); }
    for (let i = 0; i < 400; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'; g.fillRect(-0.5 + ((i * 97) % 100) / 100, -0.45 + ((i * 61) % 90) / 100, 0.006, 0.006); }
  });
  shade(g, b, -0.42, 0.42, { top: 0.12, sheen: 0.2, edge: 0.3 });
  g.fillStyle = '#4a545c'; g.beginPath(); g.ellipse(0.2, 0.02, 0.035, 0.06, 0, 0, TAU); g.fill();
  const pf = new Path2D(); pf.moveTo(0.18, -0.02); pf.quadraticCurveTo(0.08, -0.06, 0.06, 0.02); pf.quadraticCurveTo(0.1, 0.06, 0.18, 0.04); pf.closePath(); g.fillStyle = 'rgba(120,132,140,0.9)'; g.fill(pf);
  g.fillStyle = '#39424a'; g.beginPath(); g.ellipse(0.49, 0.02, 0.018, 0.022, 0, 0, TAU); g.fill();
  eye(g, 0.36, -0.07, 0.035, '#5a6a74');
}
function paintMolaFin(up) {
  return (g) => { const s = up ? -1 : 1; const p = new Path2D(); p.moveTo(-0.1, 0); p.quadraticCurveTo(-0.06, s * 0.3, 0.02, s * 0.56); p.quadraticCurveTo(0.08, s * 0.3, 0.12, 0); p.closePath(); g.fillStyle = vgrad(g, 0, s * 0.56, [[0, '#8e9aa2'], [1, '#56626c']]); g.fill(p); };
}
class Mola extends Crosser {
  constructor(info) { super(info, Math.min(U * 22, W * 0.4), 2.6, rand(0.3, 0.45), rand(0.26, 0.48)); this.fl = rand(TAU); }
  update(dt) { this.fl += dt * TAU * 0.45; return this.step(dt, 0.03, 0.2); }
  draw(g) {
    const L = 360, k = this.k, fog = depthFog(this.z), o = Math.sin(this.fl);
    const body = vspr('mBody', 1.04, 0.92, L, paintMolaBody), df = vspr('mD', 0.26, 0.6, L, paintMolaFin(true), 0.5, 1), af = vspr('mA', 0.26, 0.6, L, paintMolaFin(false), 0.5, 0);
    g.save(); g.translate(this.x, this.y); g.scale(this.dir, 1); g.rotate(0.12 * Math.sin(this.t * 0.3) + this.pitch * this.dir);
    g.save(); g.translate(-0.22 * k, -0.36 * k); g.rotate(-0.35 + o * 0.28); g.scale(0.7 + 0.3 * Math.abs(Math.cos(this.fl)), 1); df.draw(g, 0, 0, 0.26 * k, 0.6 * k, fog); g.restore();
    g.save(); g.translate(-0.22 * k, 0.36 * k); g.rotate(0.35 + o * 0.28); g.scale(0.7 + 0.3 * Math.abs(Math.cos(this.fl)), 1); af.draw(g, 0, 0, 0.26 * k, 0.6 * k, fog); g.restore();
    body.draw(g, 0, 0, 1.04 * k, 0.92 * k, fog);
    g.restore();
  }
}

/* ---------------- Flashlight fish (night only) ---------------- */
class Flashlights {
  constructor(info) {
    this.info = info; this.kind = 'visitor'; this.z = 0.3; this.dir = Math.random() < 0.5 ? 1 : -1; this.t = 0; this.leaving = false;
    this.cx = this.dir > 0 ? -U * 20 : W + U * 20; this.cy = H * rand(0.55, 0.7);
    this.fish = Array.from({ length: 16 }, () => ({ ox: rand(-14, 14), oy: rand(-6, 6), ph: rand(TAU), on: rand(1, 3), off: 0, x: 0, y: 0, d: this.dir, s: rand(0.85, 1.15) }));
    for (const f of this.fish) { f.x = this.cx + f.ox * U; f.y = this.cy + f.oy * U; }
  }
  leave() { this.leaving = true; }
  update(dt, t) {
    this.t += dt; if (TOD.night < 0.3) this.leaving = true; this.cx += this.dir * U * (this.leaving ? 9 : 3.2) * dt; this.cy = Math.min(this.cy + Math.sin(this.t * 0.4) * U * 0.5 * dt, reefTopAt(this.cx) - U * 5);
    for (const f of this.fish) {
      const tx = this.cx + (f.ox + Math.sin(t * 0.5 + f.ph) * 4) * U, ty = this.cy + (f.oy + Math.cos(t * 0.6 + f.ph) * 2) * U;
      const vx = (tx - f.x) * 1.5; f.x += vx * dt; f.y += (ty - f.y) * 1.5 * dt; if (Math.abs(vx) > U * 0.5) f.d = sgn(vx);
      if (f.off > 0) { f.off -= dt; if (f.off <= 0) f.on = rand(1, 3.5); } else { f.on -= dt; if (f.on <= 0) f.off = rand(0.15, 0.45); }
    }
    this.x = this.cx; this.y = this.cy;
    const m = U * 26; return this.dir > 0 ? this.cx < W + m : this.cx > -m;
  }
  draw(g) {
    const k = U * 2.6;
    for (const f of this.fish) {
      g.save(); g.translate(f.x, f.y); g.scale(f.d * f.s, f.s);
      g.fillStyle = '#0e1626'; g.beginPath(); g.ellipse(0, 0, k * 0.5, k * 0.22, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(-k * 0.45, 0); g.lineTo(-k * 0.75, -k * 0.2); g.lineTo(-k * 0.68, 0); g.lineTo(-k * 0.75, k * 0.2); g.fill();
      g.fillStyle = f.off > 0 ? '#1a2638' : '#dffcff'; g.beginPath(); g.ellipse(k * 0.28, k * 0.05, k * 0.09, k * 0.05, 0, 0, TAU); g.fill();
      g.fillStyle = '#2a3a50'; g.beginPath(); g.arc(k * 0.3, -k * 0.05, k * 0.05, 0, TAU); g.fill();
      g.restore();
    }
  }
  glow(g) {
    const s = U * 3.4;
    for (const f of this.fish) { if (f.off > 0) continue; g.globalAlpha = 0.9; g.drawImage(GLOW.cyan, f.x + f.d * U * 0.72 - s / 2, f.y + U * 0.13 - s / 2, s, s); }
    g.globalAlpha = 1;
  }
  hit(x, y) { for (const f of this.fish) if (Math.hypot(x - f.x, y - f.y) < U * 3) return 0.5; return -1; }
  anchor() { return [this.cx, this.cy - U * 8]; }
}

/* ---------------- schedule ---------------- */
const VISITORS = [
  { id: 'turtle', name: 'Green sea turtle', sci: 'Chelonia mydas', fact: 'Adults graze seagrass and algae. A resting turtle can stay underwater for hours.', w: 3, make: (i) => new Turtle(i) },
  { id: 'manta', name: 'Reef manta ray', sci: 'Mobula alfredi', fact: 'The spots on each manta’s belly are unique — researchers identify individuals by them, like fingerprints.', w: 2.4, make: (i) => new Manta(i) },
  { id: 'shark', name: 'Blacktip reef shark', sci: 'Carcharhinus melanopterus', fact: 'A shallow-reef patroller named for its ink-dipped fin tips. Watch the small fish make room.', w: 2.2, make: (i) => new Shark(i) },
  { id: 'whaleshark', name: 'Whale shark', sci: 'Rhincodon typus', fact: 'The largest fish alive — a gentle filter-feeder that sieves plankton. Pilot fish ride its bow wave.', w: 1.6, make: (i) => new WhaleShark(i) },
  { id: 'dolphins', name: 'Bottlenose dolphins', sci: 'Tursiops truncatus', fact: 'Each dolphin develops a signature whistle that works much like a name.', w: 1.8, make: (i) => new Dolphins(i) },
  { id: 'humpback', name: 'Humpback whale', sci: 'Megaptera novaeangliae', fact: 'Males sing long, complex songs that change from year to year and carry for kilometres.', w: 1.4, make: (i) => new Humpback(i) },
  { id: 'diver', name: 'Scuba diver', sci: 'Homo sapiens', fact: 'Breathes compressed air and exhales a burst of bubbles every few seconds. Harmless; do not tap the glass.', w: 1.5, make: (i) => new Diver(i) },
  { id: 'octopus', name: 'Day octopus', sci: 'Octopus cyanea', fact: 'Hunts by day and changes colour and skin texture in a fraction of a second. Tap it and see.', w: 2, make: (i) => new Octopus(i), cave: true },
  { id: 'mola', name: 'Ocean sunfish', sci: 'Mola mola', fact: 'One of the heaviest bony fishes. It basks near the surface to warm up after deep, cold dives.', w: 1.4, make: (i) => new Mola(i) },
  { id: 'flashlight', name: 'Splitfin flashlightfish', sci: 'Anomalops katoptron', fact: 'Glows with bacteria living in pouches under its eyes, and blinks by flipping them out of sight.', w: 3, make: (i) => new Flashlights(i), night: true },
];
function summonVisitor(force) {
  const night = TOD.night > 0.55;
  let pool = VISITORS.filter((v) => (!v.night || night) && !(v.cave && !REEF.cave));
  const fresh = pool.filter((v) => !VIS.recent.includes(v.id)); if (fresh.length) pool = fresh;
  if (night) { const fl = pool.find((v) => v.night); if (fl && Math.random() < 0.45) pool = [fl]; }
  let sum = pool.reduce((a, v) => a + v.w, 0), r = Math.random() * sum, v = pool[0];
  for (const c of pool) { r -= c.w; if (r <= 0) { v = c; break; } }
  VIS.recent.push(v.id); if (VIS.recent.length > 5) VIS.recent.shift();
  VIS.active = v.make(v); VIS.pending = false;
  showCaption(v);
}
function callVisitor() {
  if (VIS.active) { VIS.active.leave?.(); VIS.pending = true; }
  else summonVisitor(true);
}
function updateVisitors(dt, t) {
  if (VIS.active) {
    if (!VIS.active.update(dt, t)) { VIS.active = null; VIS.next = VIS.pending ? 0.8 : TOD.mode === 'cycle' ? rand(35, 75) : rand(150, 420); }
  } else { VIS.next -= dt; if (VIS.next <= 0) summonVisitor(); }
}
