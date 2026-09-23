/* =====================================================================
   Bottom dwellers: a giant moray in the cave, a wandering hermit crab
   ===================================================================== */
const MORAY = { ext: 0, tgt: 0.9, dir: 1, t: 0, next: 6, z: 0.24, kind: 'resident',
  info: { name: 'Giant moray', sci: 'Gymnothorax javanicus', fact: 'That gaping mouth is just breathing: it pumps water over its gills. Octopuses are among its favourite prey.' } };
function initMoray() { const c = REEF.cave; MORAY.ext = 0; MORAY.dir = c && c.x < W / 2 ? 1 : -1; }
function updateMoray(dt) {
  const c = REEF.cave; if (!c) return;
  MORAY.t += dt; MORAY.next -= dt;
  if (MORAY.next < 0) { MORAY.next = rand(6, 16); MORAY.tgt = Math.random() < 0.25 ? 0.15 : rand(0.65, 1); }
  let tgt = MORAY.tgt;
  if (VIS.active instanceof Octopus) tgt = 0;
  for (const d of LIFE.danger) if (d.scare !== false && Math.hypot(d.x - c.x, d.y - c.y) < d.r * 0.8) tgt = Math.min(tgt, 0.15);
  MORAY.ext = ease(MORAY.ext, tgt, tgt < MORAY.ext ? 2.5 : 0.45, dt);
}
function drawMoray(g) {
  const c = REEF.cave; if (!c || MORAY.ext < 0.03) return;
  const t = MORAY.t, d = MORAY.dir, L = U * 10 * MORAY.ext, n = 12, pts = [];
  let x = c.x - d * c.r * 0.4, y = c.y + c.r * 0.25;
  for (let i = 0; i <= n; i++) {
    const s = i / n; pts.push([x, y]);
    const a = (d > 0 ? -0.22 : Math.PI + 0.22) + d * (0.32 * Math.sin(t * 0.7 + s * 3) * s - 0.25 * s);
    x += Math.cos(a) * L / n; y += Math.sin(a) * L / n;
  }
  const w = U * 1.55;
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  g.strokeStyle = '#2e2c18'; g.lineWidth = w + 2; g.stroke();
  g.strokeStyle = '#7a7440'; g.lineWidth = w; g.stroke();
  g.strokeStyle = 'rgba(230,225,170,0.35)'; g.lineWidth = w * 0.25; g.save(); g.translate(0, -w * 0.25); g.stroke(); g.restore();
  g.fillStyle = 'rgba(38,32,14,0.7)';
  for (let i = 1; i < n; i++) { const [px, py] = pts[i]; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(px + ((i * 7 + k * 13) % 9 - 4) * w * 0.06, py + (k - 1) * w * 0.26, w * 0.12, w * 0.08, 0.5, 0, TAU); g.fill(); } }
  // head
  const [hx, hy] = pts[n], [qx, qy] = pts[n - 1], ang = Math.atan2(hy - qy, hx - qx), gape = 0.12 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.7));
  g.save(); g.translate(hx, hy); g.rotate(ang); g.scale(1, d > 0 ? 1 : -1);
  g.fillStyle = '#6e6838';
  g.save(); g.rotate(gape * 0.6); g.beginPath(); g.moveTo(-w * 0.2, 0); g.quadraticCurveTo(w * 0.6, w * 0.55, w * 1.35, w * 0.12); g.lineTo(w * 1.3, 0); g.closePath(); g.fill(); g.restore();
  g.beginPath(); g.moveTo(-w * 0.5, -w * 0.5); g.quadraticCurveTo(w * 0.7, -w * 0.72, w * 1.45, -w * 0.08); g.lineTo(w * 1.3, 0.02 * w); g.quadraticCurveTo(w * 0.4, w * 0.2, -w * 0.5, w * 0.45); g.closePath(); g.fill();
  g.fillStyle = '#2a1414'; g.save(); g.rotate(gape * 0.3); g.beginPath(); g.moveTo(w * 0.1, 0.02 * w); g.lineTo(w * 1.2, 0); g.lineTo(w * 0.3, w * 0.28 * gape * 3); g.closePath(); g.fill(); g.restore();
  g.fillStyle = '#f2ecd8'; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(w * (0.45 + k * 0.2), 0); g.lineTo(w * (0.5 + k * 0.2), w * 0.08); g.lineTo(w * (0.55 + k * 0.2), 0); g.fill(); }
  eye(g, w * 0.95, -w * 0.33, w * 0.12, '#d8c040');
  g.restore();
  // the cave mouth keeps the far end in shadow
  const sg = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 1.3);
  sg.addColorStop(0, 'rgba(4,2,8,0.95)'); sg.addColorStop(0.55, 'rgba(4,2,8,0.6)'); sg.addColorStop(1, 'rgba(4,2,8,0)');
  g.fillStyle = sg; g.beginPath(); g.ellipse(c.x, c.y, c.r * 1.3, c.r * 0.9, 0, 0, TAU); g.fill();
  MORAY.hx = hx; MORAY.hy = hy;
}
MORAY.hit = (x, y) => (MORAY.ext > 0.3 && Math.hypot(x - MORAY.hx, y - MORAY.hy) < U * 4 ? 0.6 : -1);
MORAY.anchor = () => [MORAY.hx, MORAY.hy - U * 2];

const CRAB = { x: 0, y: 0, dir: 1, pause: 0, hide: 0, t: 0, z: 0.14, kind: 'resident',
  info: { name: 'Hermit crab', sci: 'Dardanus megistos', fact: 'Lives in a borrowed snail shell and trades up to a bigger one as it grows.' } };
function initCrab() { CRAB.x = rand(0.15, 0.85) * W; CRAB.y = H * 0.957; CRAB.dir = Math.random() < 0.5 ? -1 : 1; CRAB.pause = 2; }
function updateCrab(dt) {
  CRAB.t += dt;
  for (const d of LIFE.danger) if (d.scare !== false && Math.abs(d.x - CRAB.x) < d.r * 0.7 && d.y > H * 0.5) CRAB.hide = 3;
  if (FISH.list.some((f) => f.z < 0.3 && dist2(f.x, f.y, CRAB.x, CRAB.y) < (U * 5) ** 2 && f.size > 9)) CRAB.hide = Math.max(CRAB.hide, 1.5);
  if (CRAB.hide > 0) { CRAB.hide -= dt; return; }
  if (CRAB.pause > 0) { CRAB.pause -= dt; if (CRAB.pause <= 0 && Math.random() < 0.3) CRAB.dir *= -1; return; }
  CRAB.x += CRAB.dir * U * 1.1 * dt;
  if (Math.random() < dt * 0.12) CRAB.pause = rand(1.5, 5);
  if (CRAB.x < W * 0.03 || CRAB.x > W * 0.97) { CRAB.dir *= -1; CRAB.x = clamp(CRAB.x, W * 0.03, W * 0.97); }
}
function drawCrab(g) {
  const s = U * 2.4, walking = CRAB.pause <= 0 && CRAB.hide <= 0, out = CRAB.hide > 0 ? 0 : 1, t = CRAB.t;
  g.save(); g.translate(CRAB.x, CRAB.y); g.scale(CRAB.dir, 1);
  contactShadow(g, 0, s * 0.15, s * 1.1);
  if (out) {
    g.strokeStyle = '#b8402a'; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const ph = t * 9 + i * 2.1, lift = walking ? Math.max(0, Math.sin(ph)) * s * 0.18 : 0, sw = walking ? Math.cos(ph) * s * 0.15 : 0;
      const bx = s * (0.25 + i * 0.12), kx = bx + s * 0.25 + sw, ky = -s * 0.25 - lift;
      g.lineWidth = s * 0.09; g.beginPath(); g.moveTo(bx, -s * 0.05); g.lineTo(kx, ky); g.lineTo(kx + s * 0.18 + sw * 0.5, s * 0.12 - lift * 0.4); g.stroke();
    }
    g.fillStyle = '#c84a30'; g.beginPath(); g.ellipse(s * 0.62, -s * 0.12, s * 0.2, s * 0.13, -0.3, 0, TAU); g.fill();
    g.fillStyle = '#e8a080'; g.beginPath(); g.ellipse(s * 0.74, -s * 0.2, s * 0.08, s * 0.05, -0.5, 0, TAU); g.fill();
    g.strokeStyle = '#8a2a1a'; g.lineWidth = s * 0.04; g.beginPath(); g.moveTo(s * 0.45, -s * 0.28); g.lineTo(s * 0.5, -s * 0.52); g.moveTo(s * 0.52, -s * 0.28); g.lineTo(s * 0.6, -s * 0.5); g.stroke();
    g.fillStyle = '#101010'; g.beginPath(); g.arc(s * 0.5, -s * 0.54, s * 0.045, 0, TAU); g.arc(s * 0.61, -s * 0.52, s * 0.045, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(200,80,50,0.8)'; g.lineWidth = s * 0.015; g.beginPath(); g.moveTo(s * 0.55, -s * 0.35); g.quadraticCurveTo(s * 0.9, -s * 0.7, s * 1.05, -s * 0.5 + Math.sin(t * 3) * s * 0.05); g.stroke();
  }
  const bob = walking ? Math.sin(t * 9) * s * 0.02 : 0;
  g.translate(0, bob);
  const sg = g.createLinearGradient(0, -s * 0.8, 0, s * 0.1); sg.addColorStop(0, '#f0c48a'); sg.addColorStop(1, '#9a5a2a');
  g.fillStyle = sg; g.beginPath(); g.moveTo(s * 0.35, s * 0.05); g.quadraticCurveTo(s * 0.4, -s * 0.7, -s * 0.1, -s * 0.72); g.quadraticCurveTo(-s * 0.7, -s * 0.6, -s * 0.85, -s * 0.2); g.quadraticCurveTo(-s * 0.4, s * 0.12, s * 0.35, s * 0.05); g.fill();
  g.strokeStyle = 'rgba(110,60,30,0.7)'; g.lineWidth = s * 0.04;
  for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(-s * 0.3 + k * s * 0.02, -s * 0.28, s * (0.12 + k * 0.12), Math.PI * 0.9, Math.PI * 1.9); g.stroke(); }
  g.fillStyle = 'rgba(255,240,220,0.4)'; g.beginPath(); g.ellipse(-s * 0.05, -s * 0.52, s * 0.18, s * 0.05, -0.2, 0, TAU); g.fill();
  g.restore();
}
CRAB.hit = (x, y) => (Math.hypot(x - CRAB.x, y - (CRAB.y - U)) < U * 3 ? 0.5 : -1);
CRAB.anchor = () => [CRAB.x, CRAB.y - U * 2.5];
