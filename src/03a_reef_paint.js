/* =====================================================================
   Reef painters: rock, coral, sponge, sand details (painted once)
   FL = fluorescence context (night glow), MK = caustic light mask
   ===================================================================== */
let FL = null, MK = null, FLA = 1;
const NEON = ['#7dff9a', '#5cf2ff', '#ff6ad5', '#ffd14a', '#9d7bff', '#ff8a3d', '#b6ff5c'];

function fluo(fn) { if (!FL) return; FL.save(); FL.globalAlpha = FLA; fn(FL); FL.restore(); }

function paintRockMass(g, x0, x1, topY, baseY, o = {}) {
  const n = Math.max(10, Math.ceil((x1 - x0) / 4)), off = srand(1000), pk = o.peak ?? 0.5;
  // a reef mound is a pile of rounded boulders: union of elliptical arcs
  const wTot = x1 - x0, hMax = baseY - topY, nb = Math.max(3, Math.round(wTot / (U * 8)));
  const boulders = [];
  for (let i = 0; i < nb; i++) {
    const u = (i + srand(0.15, 0.85)) / nb, dp = Math.abs(u - pk) / Math.max(pk, 1 - pk);
    boulders.push({ c: x0 + u * wTot, r: (wTot / nb) * srand(0.75, 1.35), h: hMax * (1 - 0.78 * Math.pow(dp, 1.25)) * srand(0.72, 1.0), p: srand(0.55, 0.9) });
  }
  for (let i = 0; i < Math.max(1, nb / 3); i++) { const b = spick(boulders); boulders.push({ c: b.c + srand(-b.r, b.r) * 0.6, r: b.r * srand(0.45, 0.7), h: b.h * srand(1.02, 1.12), p: srand(0.6, 0.9) }); }
  const prof = (x) => { let m = 0; for (const b of boulders) { const q = (x - b.c) / b.r; if (q > -1 && q < 1) m = Math.max(m, b.h * Math.pow(1 - q * q, b.p * 0.5)); } return m; };
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = lerp(x0, x1, u), edge = smooth(Math.min(u, 1 - u) / 0.06);
    const h = prof(x) * edge + fbm1(u * 22 + off, 3) * U * 0.9 + fbm1(u * 70 + off, 2) * U * 0.35;
    pts.push([x, baseY - Math.max(0, h)]);
  }
  o.boulders = boulders;
  const path = new Path2D(); path.moveTo(x0, baseY); pts.forEach((p) => path.lineTo(p[0], p[1]));
  path.lineTo(x1, baseY); path.quadraticCurveTo((x0 + x1) / 2, baseY + U * 1.4, x0, baseY); path.closePath();
  contactShadow(g, (x0 + x1) / 2, baseY + U * 0.4, (x1 - x0) * 0.62);
  const gr = g.createLinearGradient(0, topY, 0, baseY);
  gr.addColorStop(0, o.light ?? '#a38f98'); gr.addColorStop(0.5, o.mid ?? '#6d5d6f'); gr.addColorStop(1, o.dark ?? '#2b2638');
  g.fillStyle = gr; g.fill(path);
  g.save(); g.clip(path);
  const bw = x1 - x0, bh = baseY - topY, area = bw * bh;
  const pal = [[198, 112, 150], [132, 96, 164], [118, 136, 82], [152, 162, 168], [40, 34, 52], [214, 150, 118], [96, 150, 132]];
  for (let i = 0; i < area / (U * U * 0.9); i++) {
    const c = spick(pal), px = srand(x0, x1), py = srand(topY, baseY + U * 3);
    g.fillStyle = rgbStr(c, srand(0.08, 0.3));
    g.beginPath(); g.ellipse(px, py, U * srand(0.6, 3.2), U * srand(0.4, 1.6), srand(-0.6, 0.6), 0, TAU); g.fill();
  }
  // give each boulder its own volume: lit crown, shadowed flank
  for (const b of [...o.boulders].sort((p, q) => p.h - q.h)) {
    const cy = baseY - b.h * 0.72, gr2 = g.createRadialGradient(b.c - b.r * 0.25, cy - b.h * 0.2, b.r * 0.05, b.c, cy, b.r * 1.1);
    gr2.addColorStop(0, 'rgba(255,236,228,0.2)'); gr2.addColorStop(0.55, 'rgba(255,236,228,0.04)'); gr2.addColorStop(1, 'rgba(20,10,30,0.22)');
    g.fillStyle = gr2; g.beginPath(); g.ellipse(b.c, baseY - b.h * 0.45, b.r * 1.05, b.h * 0.62, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(18,10,28,0.13)'; g.lineWidth = srand(1.2, 2.2); g.beginPath(); g.ellipse(b.c, baseY - b.h * 0.45 + 2, b.r * 1.0, b.h * 0.6, 0, Math.PI * 0.1, Math.PI * 0.9); g.stroke();
  }
  // ledges following the silhouette
  for (let k = 1; k < 5; k++) {
    const d = (k / 5) * bh * srand(0.8, 1.1), wob = srand(100);
    g.beginPath();
    pts.forEach((p, i) => { const y = p[1] + d + fbm1(i * 0.07 + wob, 2) * U * 2.2; i ? g.lineTo(p[0], y) : g.moveTo(p[0], y); });
    g.strokeStyle = 'rgba(20,14,30,0.16)'; g.lineWidth = srand(1, 2); g.stroke();
    g.translate(0, -1.6); g.strokeStyle = 'rgba(255,235,230,0.07)'; g.lineWidth = 1; g.stroke(); g.translate(0, 1.6);
  }
  // pits and holes
  for (let i = 0; i < area / (U * U * 40); i++) {
    const px = srand(x0, x1), py = srand(topY + bh * 0.1, baseY), r = U * srand(0.2, 0.6);
    g.fillStyle = 'rgba(14,8,22,0.55)'; g.beginPath(); g.ellipse(px, py, r, r * 0.62, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,230,220,0.14)'; g.lineWidth = 1; g.beginPath(); g.ellipse(px, py + 0.8, r, r * 0.62, 0, 0.2, Math.PI - 0.2); g.stroke();
  }
  // grain
  for (let i = 0; i < area / 40; i++) { g.fillStyle = SR() < 0.5 ? 'rgba(255,240,235,0.16)' : 'rgba(10,6,16,0.2)'; g.fillRect(srand(x0, x1), srand(topY, baseY), srand(0.6, 1.6), srand(0.6, 1.6)); }
  // pink coralline crust along the crest
  for (let i = 0; i < pts.length; i += 2) {
    if (SR() > 0.45) continue;
    const [px, py] = pts[i];
    for (let k = 0; k < 4; k++) {
      g.fillStyle = spick(['rgba(226,128,162,0.8)', 'rgba(186,102,176,0.75)', 'rgba(240,170,190,0.7)']);
      g.beginPath(); g.arc(px + srand(-U, U), py + srand(0, U * 1.4), U * srand(0.15, 0.5), 0, TAU); g.fill();
    }
  }
  // ambient occlusion toward the sand
  const ao = g.createLinearGradient(0, baseY - bh * 0.35, 0, baseY + U * 2);
  ao.addColorStop(0, 'rgba(6,10,30,0)'); ao.addColorStop(1, 'rgba(6,10,30,0.55)');
  g.fillStyle = ao; g.fillRect(x0, baseY - bh * 0.35, bw, bh);
  g.restore();
  // rim light
  g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  g.strokeStyle = 'rgba(255,244,236,0.30)'; g.lineWidth = 1.6; g.stroke();
  g.strokeStyle = 'rgba(255,244,236,0.07)'; g.lineWidth = 6; g.stroke();
  if (MK) { const mg = MK.createLinearGradient(0, topY, 0, baseY); mg.addColorStop(0, '#f0f0f0'); mg.addColorStop(0.5, '#707070'); mg.addColorStop(1, '#1c1c1c'); MK.fillStyle = mg; MK.fill(path); }
  const topAt = (x) => { const u = clamp((x - x0) / (x1 - x0), 0, 1) * n, i = Math.floor(u), f = u - i; const a = pts[Math.min(i, n)], b = pts[Math.min(i + 1, n)]; return lerp(a[1], b[1], f); };
  return { pts, topAt, x0, x1, path };
}

function contactShadow(g, x, y, rx) {
  const gr = g.createRadialGradient(x, y, 0, x, y, rx);
  gr.addColorStop(0, 'rgba(8,6,20,0.45)'); gr.addColorStop(1, 'rgba(8,6,20,0)');
  g.save(); g.scale(1, 0.3); g.fillStyle = gr; g.beginPath(); g.arc(x, y / 0.3, rx, 0, TAU); g.fill(); g.restore();
}

function brainCoral(g, x, y, r, col) {
  col = col ?? spick(['#c8ae76', '#9db36a', '#d8a66a', '#b9b08a', '#88a98f']);
  const ry = r * 0.7;
  contactShadow(g, x, y + 1, r * 1.2);
  const p = new Path2D(); p.ellipse(x, y, r, ry, 0, Math.PI, TAU); p.lineTo(x - r, y); p.closePath();
  const gr = g.createRadialGradient(x - r * 0.3, y - ry * 0.8, r * 0.1, x, y - ry * 0.3, r * 1.1);
  gr.addColorStop(0, shadeHex(col, 0.35, '#fff8e8')); gr.addColorStop(0.6, col); gr.addColorStop(1, shadeHex(col, 0.55));
  g.fillStyle = gr; g.fill(p);
  g.save(); g.clip(p);
  const f = 5 / r, n = Math.floor((r * ry) / 7);
  const dark = shadeHex(col, 0.62), light = shadeHex(col, 0.45, '#ffffff');
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    let px = x + srand(-r, r), py = y - srand(0, ry);
    const seg = [[px, py]];
    for (let k = 0; k < 9; k++) { const a = noise2(px * f * 0.35 + 7, py * f * 0.35) * TAU * 1.2; px += Math.cos(a) * r * 0.06; py += Math.sin(a) * r * 0.06; seg.push([px, py]); }
    g.beginPath(); seg.forEach((s, j) => (j ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1])));
    g.strokeStyle = dark; g.globalAlpha = 0.55; g.lineWidth = Math.max(1, r * 0.035); g.stroke();
    g.translate(-0.7, -0.7); g.strokeStyle = light; g.globalAlpha = 0.28; g.lineWidth = Math.max(0.7, r * 0.02); g.stroke(); g.translate(0.7, 0.7);
  }
  g.globalAlpha = 1;
  const eg = g.createRadialGradient(x, y - ry * 0.4, r * 0.5, x, y - ry * 0.2, r * 1.05);
  eg.addColorStop(0, 'rgba(10,8,20,0)'); eg.addColorStop(1, 'rgba(10,8,20,0.45)');
  g.fillStyle = eg; g.fillRect(x - r, y - ry, r * 2, ry);
  g.restore();
  // christmas tree worms
  for (let i = 0; i < randi(1, 3); i++) {
    const a = srand(Math.PI * 1.15, Math.PI * 1.85), wx = x + Math.cos(a) * r * 0.8, wy = y + Math.sin(a) * ry * 0.8;
    const c = spick(['#ff4d4d', '#3aa0ff', '#ffd23a', '#ffffff', '#ff8a2a']);
    for (let k = 0; k < 2; k++) christmasWorm(g, wx + (k ? r * 0.08 : 0), wy, r * 0.13, c);
  }
  if (MK) { MK.fillStyle = '#d0d0d0'; MK.fill(p); }
  fluo((F) => { F.strokeStyle = spick(['#7dff9a', '#b6ff5c', '#5cf2ff']); F.globalAlpha = 0.35 * FLA; F.lineWidth = r * 0.06; F.beginPath(); F.ellipse(x, y, r * 0.9, ry * 0.85, 0, Math.PI, TAU); F.stroke(); });
}

function christmasWorm(g, x, y, s, c) {
  g.fillStyle = c;
  for (let k = 0; k < 4; k++) { const w = s * (1 - k * 0.2), yy = y - k * s * 0.45; g.beginPath(); g.moveTo(x - w * 0.5, yy); g.lineTo(x + w * 0.5, yy); g.lineTo(x, yy - s * 0.55); g.closePath(); g.fill(); }
}

function branchingCoral(g, x, y, s) {
  const pal = spick([
    ['#b98f6c', '#f0d6b8', '#b6ff5c'], ['#8c6cc6', '#e6d2ff', '#ff6ad5'], ['#6f95d6', '#c9f2ff', '#5cf2ff'],
    ['#c47b86', '#ffd0d8', '#ff6ad5'], ['#9aa36c', '#e9f2b0', '#7dff9a'],
  ]);
  const [base, tip, neon] = pal, bRGB = hexRGB(base), tRGB = hexRGB(tip);
  const segs = [];
  const br = (x0, y0, a, len, w, d) => {
    const bend = srand(-0.25, 0.25), x1 = x0 + Math.sin(a) * len, y1 = y0 - Math.cos(a) * len;
    const cx = (x0 + x1) / 2 + Math.cos(a) * len * bend, cy = (y0 + y1) / 2 + Math.sin(a) * len * bend;
    segs.push({ x0, y0, cx, cy, x1, y1, w, d });
    if (d > 0) {
      const kids = SR() < 0.35 ? 3 : 2;
      for (let k = 0; k < kids; k++) br(x1, y1, a + srand(-0.75, 0.75) * (k === 0 ? 0.4 : 1), len * srand(0.62, 0.82), w * 0.72, d - 1);
    }
  };
  const trunks = randi(2, 4);
  for (let t = 0; t < trunks; t++) br(x + srand(-s * 0.5, s * 0.5), y + 2, srand(-0.6, 0.6), s * srand(0.8, 1.2), s * 0.26, 3);
  contactShadow(g, x, y + 1, s * 1.4);
  g.lineCap = 'round';
  const maxD = 3;
  for (const pass of [0, 1, 2]) for (const sg of segs) {
    const t = 1 - sg.d / maxD;
    g.beginPath(); g.moveTo(sg.x0, sg.y0); g.quadraticCurveTo(sg.cx, sg.cy, sg.x1, sg.y1);
    if (pass === 0) { g.strokeStyle = rgbStr(mixRGB(bRGB, [20, 10, 30], 0.55)); g.lineWidth = sg.w + 2; }
    else if (pass === 1) { g.strokeStyle = rgbStr(mixRGB(bRGB, tRGB, t * 0.85)); g.lineWidth = sg.w; }
    else { g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = Math.max(0.6, sg.w * 0.28); g.translate(-sg.w * 0.2, 0); }
    g.stroke(); if (pass === 2) g.translate(sg.w * 0.2, 0);
  }
  for (const sg of segs) {
    for (let k = 1; k < 4; k++) { const u = k / 4; g.fillStyle = 'rgba(255,250,240,0.35)'; g.beginPath(); g.arc(lerp(sg.x0, sg.x1, u) + srand(-1, 1), lerp(sg.y0, sg.y1, u), Math.max(0.6, sg.w * 0.16), 0, TAU); g.fill(); }
    if (sg.d === 0) {
      g.fillStyle = tip; g.beginPath(); g.arc(sg.x1, sg.y1, sg.w * 0.62, 0, TAU); g.fill();
      fluo((F) => { F.fillStyle = neon; F.beginPath(); F.arc(sg.x1, sg.y1, sg.w * 0.9, 0, TAU); F.fill(); });
    }
  }
}

function tableCoral(g, x, y, s) {
  const col = spick(['#8ea486', '#a59b73', '#7f9ea5', '#b0a07a']);
  const py = y - s * 1.1, rx = s * srand(2.0, 2.8), ry = s * 0.3;
  contactShadow(g, x, y + 1, s * 1.3);
  g.fillStyle = shadeHex(col, 0.45); g.beginPath(); g.moveTo(x - s * 0.35, y + 2); g.quadraticCurveTo(x - s * 0.18, py + ry, x - s * 0.3, py); g.lineTo(x + s * 0.3, py); g.quadraticCurveTo(x + s * 0.18, py + ry, x + s * 0.35, y + 2); g.fill();
  g.fillStyle = 'rgba(10,10,25,0.45)'; g.beginPath(); g.ellipse(x, py + ry * 0.8, rx * 0.95, ry * 0.9, 0, 0, TAU); g.fill();
  for (let k = 0; k < 3; k++) {
    const e = 1 - k * 0.1, yy = py - k * s * 0.07;
    const gr = g.createLinearGradient(0, yy - ry, 0, yy + ry);
    gr.addColorStop(0, shadeHex(col, 0.4 + k * 0.1, '#ffffff')); gr.addColorStop(1, shadeHex(col, 0.35));
    g.fillStyle = gr; g.beginPath(); g.ellipse(x + srand(-2, 2), yy, rx * e, ry * e, 0, 0, TAU); g.fill();
  }
  g.strokeStyle = 'rgba(40,40,40,0.25)'; g.lineWidth = 1;
  for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU; g.beginPath(); g.moveTo(x, py - s * 0.15); g.lineTo(x + Math.cos(a) * rx * 0.85, py - s * 0.15 + Math.sin(a) * ry * 0.8); g.stroke(); }
  g.strokeStyle = 'rgba(245,255,235,0.5)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(x, py - s * 0.14, rx * 0.8, ry * 0.8, 0, Math.PI * 1.05, TAU - 0.05); g.stroke();
  if (MK) { MK.fillStyle = '#ffffff'; MK.beginPath(); MK.ellipse(x, py - s * 0.14, rx * 0.8, ry * 0.8, 0, 0, TAU); MK.fill(); }
  fluo((F) => { F.strokeStyle = spick(['#7dff9a', '#5cf2ff']); F.globalAlpha = 0.45 * FLA; F.lineWidth = s * 0.07; F.beginPath(); F.ellipse(x, py - s * 0.14, rx * 0.8, ry * 0.8, 0, Math.PI * 0.05, Math.PI * 0.95); F.stroke(); });
}

function seaFan(g, x, y, s, col) {
  col = col ?? spick(['#9b45c4', '#d0425c', '#e7b23c', '#e26a3a', '#c24aa0']);
  const R = s * srand(2.4, 3.4), lean = srand(-0.25, 0.25);
  g.save(); g.translate(x, y); g.rotate(lean);
  const out = new Path2D(); out.moveTo(0, 0);
  out.bezierCurveTo(-R * 0.9, -R * 0.2, -R * 1.05, -R * 1.1, -R * 0.2, -R * 1.2);
  out.bezierCurveTo(R * 0.5, -R * 1.3, R * 1.1, -R * 0.9, R * 0.85, -R * 0.2); out.closePath();
  g.save(); g.clip(out);
  g.strokeStyle = col; g.lineCap = 'round';
  for (let i = 0; i < 34; i++) {
    const a = lerp(-1.15, 1.15, i / 33) + srand(-0.03, 0.03);
    g.globalAlpha = 0.75; g.lineWidth = srand(0.7, 1.3); g.beginPath(); g.moveTo(0, 0);
    g.quadraticCurveTo(Math.sin(a) * R * 0.6 + srand(-5, 5), -Math.cos(a) * R * 0.6, Math.sin(a) * R * 1.4, -Math.cos(a) * R * 1.4); g.stroke();
  }
  for (let k = 1; k < 16; k++) {
    const rr = (k / 16) * R * 1.3; g.globalAlpha = 0.55; g.lineWidth = 0.8; g.beginPath();
    for (let a = -1.3; a <= 1.3; a += 0.08) { const wob = 1 + fbm1(a * 6 + k * 3.1, 2) * 0.05; const px = Math.sin(a) * rr * wob, py = -Math.cos(a) * rr * wob; a <= -1.29 ? g.moveTo(px, py) : g.lineTo(px, py); }
    g.stroke();
  }
  g.restore();
  g.globalAlpha = 1; g.strokeStyle = shadeHex(col, 0.3); g.lineCap = 'round';
  for (let i = 0; i < 5; i++) { const a = lerp(-0.8, 0.8, i / 4); g.lineWidth = s * 0.16; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.sin(a) * R * 0.3, -R * 0.45, Math.sin(a) * R * 0.75, -Math.cos(a) * R * 0.95); g.stroke(); }
  g.restore();
}

function tubeSponge(g, x, y, s) {
  const col = spick(['#e8762e', '#8a4fc2', '#e0c23a', '#d9445c', '#4f7fd6', '#e05a8a']);
  const n = randi(2, 5);
  contactShadow(g, x, y + 1, s * 1.3);
  const tubes = [];
  for (let i = 0; i < n; i++) tubes.push({ dx: (i - (n - 1) / 2) * s * 0.55 + srand(-3, 3), w: s * srand(0.42, 0.66), h: s * srand(1.6, 3.6), a: srand(-0.22, 0.22) });
  tubes.sort((a, b) => b.h - a.h);
  for (const t of tubes) {
    g.save(); g.translate(x + t.dx, y + 2); g.rotate(t.a);
    const w = t.w, h = t.h;
    const gr = g.createLinearGradient(-w / 2, 0, w / 2, 0);
    gr.addColorStop(0, shadeHex(col, 0.55)); gr.addColorStop(0.4, shadeHex(col, 0.18, '#ffffff')); gr.addColorStop(1, shadeHex(col, 0.45));
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(-w * 0.4, 0); g.quadraticCurveTo(-w * 0.52, -h * 0.5, -w * 0.58, -h); g.lineTo(w * 0.58, -h); g.quadraticCurveTo(w * 0.52, -h * 0.5, w * 0.4, 0); g.closePath(); g.fill();
    g.fillStyle = 'rgba(20,10,20,0.25)';
    for (let k = 0; k < h * w / 18; k++) g.fillRect(srand(-w * 0.45, w * 0.45), -srand(0, h), 1.1, 1.1);
    const ig = g.createLinearGradient(0, -h - w * 0.2, 0, -h + w * 0.2); ig.addColorStop(0, '#1a0c14'); ig.addColorStop(1, shadeHex(col, 0.7));
    g.fillStyle = shadeHex(col, 0.1, '#ffffff'); g.beginPath(); g.ellipse(0, -h, w * 0.6, w * 0.2, 0, 0, TAU); g.fill();
    g.fillStyle = ig; g.beginPath(); g.ellipse(0, -h + 1, w * 0.46, w * 0.13, 0, 0, TAU); g.fill();
    g.restore();
  }
}

function zoanthids(g, x, y, s) {
  const [outer, inner] = spick([['#ff7a2e', '#4bd46e'], ['#ff4fa3', '#ffe14d'], ['#34d3ff', '#b24dff'], ['#ffd23f', '#ff3f6c'], ['#9dff5c', '#3a6bff']]);
  const n = randi(6, 14);
  for (let i = 0; i < n; i++) {
    const px = x + srand(-s * 1.4, s * 1.4), py = y - srand(0, s * 0.5), r = s * srand(0.16, 0.28);
    g.save(); g.translate(px, py); g.scale(1, 0.55);
    g.fillStyle = shadeHex(outer, 0.45); g.beginPath(); g.arc(0, r * 0.35, r * 0.9, 0, TAU); g.fill();
    g.fillStyle = outer;
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; g.beginPath(); g.ellipse(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, r * 0.34, r * 0.13, a, 0, TAU); g.fill(); }
    g.fillStyle = inner; g.beginPath(); g.arc(0, 0, r * 0.62, 0, TAU); g.fill();
    g.fillStyle = shadeHex(inner, 0.6); g.beginPath(); g.arc(0, 0, r * 0.2, 0, TAU); g.fill();
    g.restore();
    fluo((F) => { F.save(); F.translate(px, py); F.scale(1, 0.55); F.fillStyle = outer; F.beginPath(); F.arc(0, 0, r * 1.05, 0, TAU); F.fill(); F.fillStyle = inner; F.beginPath(); F.arc(0, 0, r * 0.55, 0, TAU); F.fill(); F.restore(); });
  }
}

function treeCoral(g, x, y, s) {
  const col = spick(['#ff5c8a', '#e8406a', '#b35cff', '#ff8a3d', '#ffd23f']);
  g.lineCap = 'round';
  const tips = [];
  const br = (x0, y0, a, len, w, d) => {
    const x1 = x0 + Math.sin(a) * len, y1 = y0 - Math.cos(a) * len;
    g.strokeStyle = 'rgba(255,235,240,0.55)'; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    if (d > 0) { br(x1, y1, a - srand(0.3, 0.6), len * 0.7, w * 0.7, d - 1); br(x1, y1, a + srand(0.3, 0.6), len * 0.7, w * 0.7, d - 1); } else tips.push([x1, y1]);
  };
  br(x, y + 2, srand(-0.2, 0.2), s * 1.1, s * 0.3, 3);
  for (const [tx, ty] of tips) for (let k = 0; k < 7; k++) {
    const r = s * srand(0.1, 0.2); g.fillStyle = shadeHex(col, srand(0, 0.35), SR() < 0.5 ? '#ffffff' : '#300010');
    g.beginPath(); g.arc(tx + srand(-s * 0.3, s * 0.3), ty + srand(-s * 0.3, s * 0.15), r, 0, TAU); g.fill();
  }
  fluo((F) => { F.fillStyle = col; for (const [tx, ty] of tips) { F.beginPath(); F.arc(tx, ty, s * 0.3, 0, TAU); F.fill(); } });
}

function bubbleCoral(g, x, y, s) {
  contactShadow(g, x, y + 1, s * 1.3);
  const col = spick(['#e8e4c8', '#d4ecd0', '#e6d8ee']);
  for (let i = 0; i < randi(12, 22); i++) {
    const a = srand(Math.PI, TAU), d = srand(0, s), px = x + Math.cos(a) * d * 1.2, py = y + Math.sin(a) * d * 0.8 - s * 0.2, r = s * srand(0.18, 0.32);
    const gr = g.createRadialGradient(px - r * 0.3, py - r * 0.4, r * 0.1, px, py, r);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, col); gr.addColorStop(1, shadeHex(col, 0.45));
    g.fillStyle = gr; g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill();
  }
  fluo((F) => { F.fillStyle = '#9dffb0'; F.globalAlpha = 0.45 * FLA; F.beginPath(); F.ellipse(x, y - s * 0.4, s * 1.1, s * 0.6, 0, 0, TAU); F.fill(); });
}

function giantClam(g, x, y, s) {
  const mantle = spick([['#1fb6ff', '#0b3d91'], ['#2ee6b8', '#10566b'], ['#9b5cff', '#24125e'], ['#3dd66b', '#114a3a']]);
  const w = s * 1.6;
  contactShadow(g, x, y + 1, w * 1.1);
  g.fillStyle = '#cfc6b4'; g.beginPath(); g.ellipse(x, y - s * 0.1, w, s * 0.55, 0, 0, Math.PI); g.lineTo(x - w, y - s * 0.1); g.fill();
  g.strokeStyle = 'rgba(80,70,60,0.5)'; g.lineWidth = 1;
  for (let i = 1; i < 6; i++) { const px = x - w + (i / 6) * w * 2; g.beginPath(); g.moveTo(px, y - s * 0.1); g.quadraticCurveTo(px + (px - x) * 0.1, y + s * 0.2, px + (px - x) * 0.15, y + s * 0.4); g.stroke(); }
  const mp = new Path2D(); mp.moveTo(x - w * 0.95, y - s * 0.1);
  for (let i = 0; i <= 16; i++) { const u = i / 16, px = x - w * 0.95 + u * w * 1.9, py = y - s * 0.1 - s * (0.35 + 0.12 * Math.sin(u * TAU * 3)) * Math.sin(Math.PI * u); mp.lineTo(px, py); }
  mp.closePath();
  const gr = g.createLinearGradient(0, y - s * 0.55, 0, y); gr.addColorStop(0, mantle[0]); gr.addColorStop(1, mantle[1]);
  g.fillStyle = gr; g.fill(mp);
  g.save(); g.clip(mp); g.fillStyle = 'rgba(210,255,255,0.55)';
  for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(x + srand(-w, w), y - srand(0, s * 0.5), srand(0.6, 1.8), 0, TAU); g.fill(); }
  g.restore();
  g.strokeStyle = 'rgba(230,255,255,0.6)'; g.lineWidth = 1.2; g.stroke(mp);
  fluo((F) => { F.strokeStyle = mantle[0]; F.lineWidth = s * 0.2; F.stroke(mp); });
}

function starfish(g, x, y, s, col, flat = 0.5) {
  col = col ?? spick(['#e2453a', '#f08a2c', '#3a6fd8', '#b8335a', '#e8b23a']);
  const rot = srand(TAU);
  g.save(); g.translate(x, y); g.scale(1, flat); g.rotate(rot);
  const p = new Path2D();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU, r = i % 2 ? s * 0.34 : s * srand(0.95, 1.1);
    const px = Math.cos(a) * r, py = Math.sin(a) * r;
    if (!i) p.moveTo(px, py); else { const a0 = ((i - 0.5) / 10) * TAU, rc = s * 0.52; p.quadraticCurveTo(Math.cos(a0) * rc, Math.sin(a0) * rc, px, py); }
  }
  p.closePath();
  g.fillStyle = 'rgba(10,6,20,0.3)'; g.translate(1.5, 2.5); g.fill(p); g.translate(-1.5, -2.5);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, s); gr.addColorStop(0, shadeHex(col, 0.3, '#ffffff')); gr.addColorStop(1, shadeHex(col, 0.3));
  g.fillStyle = gr; g.fill(p);
  g.fillStyle = 'rgba(255,245,230,0.55)';
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; for (let j = 1; j < 6; j++) { g.beginPath(); g.arc(Math.cos(a) * s * j * 0.16, Math.sin(a) * s * j * 0.16, s * 0.045, 0, TAU); g.fill(); } }
  g.restore();
}

function urchin(g, x, y, s) {
  g.save(); g.translate(x, y - s * 0.35);
  g.strokeStyle = '#1b1024'; g.lineCap = 'round';
  for (let i = 0; i < 44; i++) { const a = srand(Math.PI * 0.95, Math.PI * 2.05), l = s * srand(1.1, 2.1); g.lineWidth = srand(0.8, 1.6); g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * l, Math.sin(a) * l * 0.9); g.stroke(); }
  const gr = g.createRadialGradient(-s * 0.15, -s * 0.2, 0, 0, 0, s * 0.55); gr.addColorStop(0, '#5a3a6a'); gr.addColorStop(1, '#160c1e');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, s * 0.55, 0, TAU); g.fill();
  g.restore();
}

function seaWhip(g, x, y, s) {
  const col = spick(['#e0442e', '#f0a23a', '#e8d23a', '#c43a8a']);
  g.lineCap = 'round';
  for (let i = 0; i < randi(2, 4); i++) {
    const h = s * srand(3, 6), a = srand(-0.35, 0.35), bend = srand(-0.6, 0.6);
    g.strokeStyle = shadeHex(col, 0.35); g.lineWidth = s * 0.16 + 1.5;
    const path = () => { g.beginPath(); g.moveTo(x, y + 2); g.quadraticCurveTo(x + Math.sin(a) * h * 0.5 + bend * s, y - h * 0.5, x + Math.sin(a) * h, y - Math.cos(a) * h); };
    path(); g.stroke(); g.strokeStyle = col; g.lineWidth = s * 0.16; path(); g.stroke();
  }
}

function shell(g, x, y, s) {
  const k = SR();
  g.save(); g.translate(x, y);
  if (k < 0.35) { // conch
    g.rotate(srand(-0.4, 0.4));
    const gr = g.createLinearGradient(-s, 0, s, 0); gr.addColorStop(0, '#f3dcc2'); gr.addColorStop(1, '#d69a74');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(-s * 0.2, -s * 0.9, s * 0.9, -s * 0.2); g.quadraticCurveTo(s * 0.2, s * 0.35, -s, 0); g.fill();
    g.strokeStyle = 'rgba(120,70,50,0.5)'; g.lineWidth = 0.8;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-s + i * s * 0.45, -s * 0.5 + i * 0.1); g.lineTo(-s + i * s * 0.45 + s * 0.15, s * 0.08); g.stroke(); }
    g.fillStyle = '#ffd9e0'; g.beginPath(); g.ellipse(s * 0.1, -s * 0.05, s * 0.35, s * 0.12, -0.3, 0, TAU); g.fill();
  } else if (k < 0.6) { // cowrie
    const gr = g.createRadialGradient(-s * 0.2, -s * 0.3, 0, 0, 0, s); gr.addColorStop(0, '#fff6ea'); gr.addColorStop(0.5, '#c9905c'); gr.addColorStop(1, '#6e4630');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, -s * 0.2, s * 0.7, s * 0.4, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(srand(-s * 0.5, s * 0.5), -s * srand(0.1, 0.45), s * 0.05, 0, TAU); g.fill(); }
  } else if (k < 0.8) { // sand dollar
    g.scale(1, 0.4); g.fillStyle = '#e9dcc0'; g.beginPath(); g.arc(0, 0, s * 0.8, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(140,120,90,0.6)'; g.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - Math.PI / 2; g.beginPath(); g.ellipse(Math.cos(a) * s * 0.35, Math.sin(a) * s * 0.35, s * 0.3, s * 0.1, a, 0, TAU); g.stroke(); }
  } else { // rubble
    g.strokeStyle = '#efe6dc'; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { g.lineWidth = s * srand(0.15, 0.3); g.beginPath(); const a = srand(TAU); g.moveTo(-Math.cos(a) * s * 0.6, -Math.abs(Math.sin(a)) * s * 0.2); g.lineTo(Math.cos(a) * s * 0.6, 0); g.stroke(); }
  }
  g.restore();
}
