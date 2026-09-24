/* =====================================================================
   3D for the reef's residents (see 06b_fish_gl.js): anemone, seagrass,
   garden eels, moray, hermit crab, treasure chest and jellyfish. Their
   motion stays in the 2D code; each glJobs() builds geometry from the same
   per-frame curves the 2D drawing uses, in units of U unless noted.
   ===================================================================== */
const ANEMONE_BACK = { z: 0.23 };   // the tentacles behind the clownfish; ANEMONE_ENT (09_main.js) holds the front ones
const EELS_GL = { z: 0.2 };

// small procedural textures and static meshes, built once
function fglTex(key, w, h, paint) {
  return fglCached(key, () => { const c = mk(w, h), g = c.getContext('2d'); paint(g, w, h); return { t: fglTexture(c), texel: [1 / w, 1 / h] }; });
}
function fglStatic(V, I, tex, mat) { return { vao: fglVAO(V, I), tex: tex.t, texel: tex.texel, count: I.length, mat: mat || {} }; }
const toU = (x, y, ox, oy) => [(x - ox) / U, (y - oy) / U];

// every visible resident with a 3D model
function fglResidents() {
  const r = [EELS_GL, MORAY, CRAB, ANEMONE_BACK, { glJobs: chestJobs }];
  for (const c of LIFE.grass) r.push({ glJobs: (t) => grassJobs(c, t) });
  return r;
}

/* ---------- anemone: tentacles as tubes, base colour to bulb tip ---------- */
function anemoneTex(A) {
  const [base, tip] = A.pal;
  return fglTex('anem' + base + tip, 64, 4, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0), b = hexRGB(base), t = hexRGB(tip);
    gr.addColorStop(0, rgbStr(mixRGB(b, t, 0.2))); gr.addColorStop(0.8, rgbStr(mixRGB(b, t, 0.5))); gr.addColorStop(0.86, tip); gr.addColorStop(1, rgbStr(mixRGB(t, [255, 255, 255], 0.25)));
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}
function anemoneJob(obj, back, t) {
  const A = LIFE.anemone; if (!A) return null;
  anemoneTentacles(t);
  const tubes = [];
  for (const tn of A.tent) {
    if (tn.back !== back) continue;
    const z = (back ? -1 : 1) * (0.3 + Math.abs(Math.sin(tn.u * 7 + tn.ph)) * 1.4), r = tn.w / 2 / U, pts = [], rs = [];
    for (let i = 0; i <= 6; i++) {   // along the quadratic curve base → bend → bulb
      const s = i / 6, a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s;
      const [x, y] = toU(a * tn.bx + b * tn.mx + c * tn.ex, a * tn.by + b * tn.my + c * tn.ey, A.x, A.y);
      pts.push([x, y, z]); rs.push(i === 6 ? r * 1.45 : i === 5 ? r * 1.2 : r * (1 - s * 0.15));
    }
    tubes.push({ pts, r: rs });
  }
  const tex = anemoneTex(A), R = A.R / U;
  return { obj, x: A.x, y: A.y, z: obj.z, k: U, hw: R + 6, hh: 7, render: () => {
    fglPose({});
    if (back) fglDraw(fglCached('unitBall', () => fglEllipsoid(1, 1, 1)), { y: 0.2, sx: R * 0.95, sy: 1.1, sz: R * 0.7 }, true, { rough: 0.4, sss: 0.9, tint: rgb1(mixRGB(hexRGB(A.pal[0]), [0, 0, 0], 0.2)) });
    fglDraw(fglDynamic(fglTubes(tubes, 8), { tex }), null, true, { rough: 0.3, sss: 0.9, tint: back ? [0.78, 0.74, 0.8] : [1, 1, 1] });
  } };
}
ANEMONE_BACK.glJobs = (t) => [anemoneJob(ANEMONE_BACK, true, t)];

/* ---------- seagrass: twisting ribbons, lit through from behind ---------- */
const GRASS_COLS = ['#3f8f4a', '#58a64e', '#2f7a44', '#6cb35a', '#4a9a6a'];
function grassTex() {
  return fglTex('grass', 5, 32, (g, w, h) => {
    GRASS_COLS.forEach((col, i) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, shadeHex(col, 0.35)); gr.addColorStop(1, shadeHex(col, 0.25, '#e8ffd0')); g.fillStyle = gr; g.fillRect(i, 0, 1, h); });
  });
}
function grassJobs(c, t) {
  grassLines(c, t);
  const V = [], I = [];
  let top = 0;
  for (const b of c.blades) {
    const n = b.pts.length - 1, base = V.length / 9, u = (GRASS_COLS.indexOf(b.col) + 0.5) / GRASS_COLS.length;
    for (let i = 0; i <= n; i++) {
      const [px, py, pa] = b.pts[i], [x, y] = toU(px, py, c.x, c.y), w = b.w * (1 - (i / n) * 0.75) * 0.5 / U;
      top = Math.max(top, -y);
      // the blade's edge turns about its centre line as it rises: a ribbon, not a card
      const tw = b.ph + i * 0.35 + Math.sin(t * 0.8 + b.ph) * 0.3, ex = -Math.sin(pa) * Math.cos(tw), ey = Math.cos(pa) * Math.cos(tw), ez = Math.sin(tw);
      const tx = Math.cos(pa), ty = Math.sin(pa), nx = ty * ez, ny = -tx * ez, nz = tx * ey - ty * ex, nl = Math.hypot(nx, ny, nz) || 1;
      for (const s of [-1, 1]) V.push(x + ex * w * s, y + ey * w * s, ez * w * s + b.dx / U * 0.4, nx / nl, ny / nl, nz / nl, u, i / n, 1);
    }
    for (let i = 0; i < n; i++) { const a = base + i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const tex = grassTex();
  return [{ obj: c, x: c.x, y: c.y, z: c.front ? 0.05 : 0.2, k: U, hw: top + 3, hh: top + 2, render: () => {
    fglPose({});
    fglDraw(fglDynamic([V, I], { tex }), null, true, { rough: 0.5, finRough: 0.5, sss: 0.3, tint: c.front ? [0.55, 0.55, 0.55] : [1, 1, 1] });
  } }];
}

/* ---------- garden eels: spotted tubes out of their burrows ---------- */
EELS_GL.glJobs = (t) => {
  const b = REEF.eelBed; if (!b || !LIFE.eels.length) return null;
  const cur = eelFacing(t), ox = (b.x0 + b.x1) / 2, oy = sandY(ox), my = LIFE.eels.reduce((s, e) => s + e.y, 0) / LIFE.eels.length;
  const tubes = [];
  let ext = 2;
  for (const e of LIFE.eels) {
    if (e.ext < 0.04) continue;
    const pts = eelLine(e, t, cur), z = (e.y - my) / U * 0.8, r = e.w / 2 / U;
    tubes.push({ pts: pts.map(([x, y]) => { const p = toU(x, y, ox, oy); ext = Math.max(ext, Math.abs(p[0]), Math.abs(p[1])); return [p[0], p[1], z]; }),
      r: pts.map((_, i) => (i === 12 ? r * 1.24 : i === 11 ? r * 1.1 : r)) });
  }
  if (!tubes.length) return null;
  const tex = fglTex('eelSkin', 64, 32, (g, w, h) => {
    g.fillStyle = '#e9e4d2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1c1612'; for (let x = 2; x < w; x += 5) for (const y of [4, 8, 12, 24]) { g.beginPath(); g.arc(x + (y % 8 ? 2 : 0), y, 1.1, 0, TAU); g.fill(); }
  });
  return [{ obj: EELS_GL, x: ox, y: oy, z: EELS_GL.z, k: U, hw: ext + 2, hh: ext + 2, render: () => {
    fglPose({});
    fglDraw(fglDynamic(fglTubes(tubes, 8), { tex }), null, true, { rough: 0.3, sss: 0.3 });
  } }];
};

/* ---------- moray: tube body, 3D head with a hinged jaw ---------- */
function morayHeadMeshes(d) {
  return fglCached('moray' + d, () => {
    const w = 1.55, mat = { rough: 0.35, sss: 0.3 };
    const head = fglMesh({ x0: -0.6 * w, x1: 1.5 * w, y0: -0.8 * w, y1: 0.8 * w, thick: 0.55, NX: 64, mat, paint: (g) => {
      g.scale(1, d);
      g.fillStyle = '#6e6838'; g.beginPath(); g.moveTo(-w * 0.5, -w * 0.5); g.quadraticCurveTo(w * 0.7, -w * 0.72, w * 1.45, -w * 0.08); g.lineTo(w * 1.3, 0.02 * w); g.quadraticCurveTo(w * 0.4, w * 0.2, -w * 0.5, w * 0.45); g.closePath(); g.fill();
      g.fillStyle = 'rgba(38,32,14,0.6)'; for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(-w * 0.3 + (i % 4) * w * 0.3, -w * 0.3 + Math.floor(i / 4) * w * 0.2, w * 0.1, w * 0.07, 0.5, 0, TAU); g.fill(); }
      g.fillStyle = '#f2ecd8'; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(w * (0.45 + k * 0.2), 0); g.lineTo(w * (0.5 + k * 0.2), w * 0.08); g.lineTo(w * (0.55 + k * 0.2), 0); g.fill(); }
      eye(g, w * 0.95, -w * 0.33, w * 0.12, '#d8c040');   // already inside the flip
    } });
    const jaw = fglMesh({ x0: -0.3 * w, x1: 1.4 * w, y0: -0.3 * w, y1: 0.7 * w, thick: 0.45, NX: 48, mat, paint: (g) => {
      g.scale(1, d);
      g.fillStyle = '#6e6838'; g.beginPath(); g.moveTo(-w * 0.2, 0); g.quadraticCurveTo(w * 0.6, w * 0.55, w * 1.35, w * 0.12); g.lineTo(w * 1.3, 0); g.closePath(); g.fill();
      g.fillStyle = '#2a1414'; g.beginPath(); g.moveTo(w * 0.1, 0.02 * w); g.lineTo(w * 1.2, 0); g.lineTo(w * 0.3, w * 0.12); g.closePath(); g.fill();
    } });
    return { head, jaw };
  });
}
MORAY.glJobs = () => {
  const c = REEF.cave; if (!c || MORAY.ext < 0.03) return null;
  const pts = morayLine(), d = MORAY.dir, n = 12, w = 1.55, [hx, hy] = pts[n], [qx, qy] = pts[n - 1];
  MORAY.hx = hx; MORAY.hy = hy;
  const ang = Math.atan2(hy - qy, hx - qx), gape = 0.12 + 0.2 * (0.5 + 0.5 * Math.sin(MORAY.t * 1.7)), m = morayHeadMeshes(d);
  const tube = { pts: pts.map(([x, y]) => [...toU(x, y, c.x, c.y), 0]), r: pts.map((_, i) => w / 2 * (i < 2 ? 0.85 : 1)) };
  const [hux, huy] = toU(hx, hy, c.x, c.y);
  const tex = fglTex('moraySkin', 64, 32, (g, W2, H2) => {
    g.fillStyle = '#7a7440'; g.fillRect(0, 0, W2, H2);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(38,32,14,${rand(0.3, 0.7)})`; g.beginPath(); g.ellipse(rand(W2), rand(H2), rand(1, 2.4), rand(0.6, 1.4), rand(TAU), 0, TAU); g.fill(); }
  });
  return [{ obj: MORAY, x: c.x, y: c.y, z: MORAY.z, k: U, hw: 17, hh: 10, render: () => {
    fglPose({});
    fglDraw(fglDynamic(fglTubes([tube], 10), { tex }), null, true, { rough: 0.35, sss: 0.3 });
    fglDraw(m.jaw, { x: hux, y: huy, tilt: ang + d * gape * 0.6 });
    fglDraw(m.head, { x: hux, y: huy, tilt: ang });
  } }];
};

/* ---------- hermit crab: shell, jointed legs on both sides, claw, eye stalks (units of its size) ---------- */
CRAB.glJobs = () => {
  const s = U * 2.4, walking = CRAB.pause <= 0 && CRAB.hide <= 0, out = CRAB.hide <= 0, t = CRAB.t;
  const shell = fglCached('crabShell', () => fglMesh({ paint: paintCrabShell, x0: -0.9, x1: 0.42, y0: -0.8, y1: 0.14, thick: 0.6, NX: 48, mat: { rough: 0.35, sss: 0.2 } }));
  const ball = fglCached('unitBall', () => fglEllipsoid(1, 1, 1));
  const bob = walking ? Math.sin(t * 9) * 0.02 : 0, red = rgb1([184, 64, 42]), tubes = [];
  if (out) {
    for (const side of [1, -1]) for (let i = 0; i < 3; i++) {
      const ph = t * 9 + i * 2.1 + (side < 0 ? Math.PI : 0), lift = walking ? Math.max(0, Math.sin(ph)) * 0.18 : 0, sw = walking ? Math.cos(ph) * 0.15 : 0;
      const bx = 0.25 + i * 0.12, kx = bx + 0.25 + sw, ky = -0.25 - lift, z = side * (0.12 + i * 0.03);
      tubes.push({ pts: [[bx, -0.05, z * 0.5], [kx, ky, z], [kx + 0.18 + sw * 0.5, 0.12 - lift * 0.4, z * 1.2]], r: [0.05, 0.045, 0.03] });
    }
    tubes.push({ pts: [[0.45, -0.28, 0.05], [0.5, -0.52, 0.06]], r: [0.022, 0.02] }, { pts: [[0.52, -0.28, -0.05], [0.6, -0.5, -0.06]], r: [0.022, 0.02] });
    tubes.push({ pts: [[0.55, -0.35, 0], [0.8, -0.6, 0.02], [1.05, -0.5 + Math.sin(t * 3) * 0.05, 0.03]], r: [0.01, 0.008, 0.006] });
  }
  return [{ obj: CRAB, x: CRAB.x, y: CRAB.y, z: CRAB.z, k: s, hw: 1.3, hh: 1.0, render: () => {
    fglPose({ mirror: CRAB.dir, yaw: 0.25 });
    if (out) {
      fglDraw(fglDynamic(fglTubes(tubes, 6)), null, true, { rough: 0.4, sss: 0.4, tint: red });
      fglDraw(ball, { x: 0.62, y: -0.12, z: 0.1, tilt: -0.3, sx: 0.2, sy: 0.13, sz: 0.12 }, true, { rough: 0.35, sss: 0.4, tint: rgb1([200, 74, 48]) });
      fglDraw(ball, { x: 0.74, y: -0.2, z: 0.12, tilt: -0.5, sx: 0.08, sy: 0.05, sz: 0.05 }, true, { rough: 0.35, tint: rgb1([232, 160, 128]) });
      for (const [x, y, z] of [[0.5, -0.54, 0.06], [0.61, -0.52, -0.06]]) fglDraw(ball, { x, y, z, sx: 0.045, sy: 0.045, sz: 0.045 }, true, { rough: 0.1, tint: [0.06, 0.06, 0.06] });
    }
    fglDraw(shell, { y: bob });
  } }];
};

/* ---------- treasure chest: a real box and a curved lid on a hinge, seen a little from above ---------- */
function chestMeshes() {
  return fglCached('chest', () => {
    const w = 6.2, h = 3.1, d = 3.2;
    const wood = fglTex('chestWood', 128, 128, (g, W2, H2) => {
      const gr = g.createLinearGradient(0, 0, 0, H2); gr.addColorStop(0, '#7a4a2a'); gr.addColorStop(1, '#4a2c18'); g.fillStyle = gr; g.fillRect(0, 0, W2, H2);
      g.strokeStyle = 'rgba(20,10,5,0.6)'; g.lineWidth = 2; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, (i * H2) / 4); g.lineTo(W2, (i * H2) / 4); g.stroke(); }
      g.fillStyle = 'rgba(40,110,90,0.35)'; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(rand(W2), rand(H2), rand(2, 6), 0, TAU); g.fill(); }
      g.fillStyle = '#b88a2e'; g.fillRect(W2 * 0.08, 0, W2 * 0.07, H2); g.fillRect(W2 * 0.85, 0, W2 * 0.07, H2);
    });
    const gold = fglTex('chestGold', 64, 64, (g, W2, H2) => {
      g.fillStyle = '#c8901e'; g.fillRect(0, 0, W2, H2);
      for (let i = 0; i < 60; i++) { g.fillStyle = pick(['#ffe070', '#fff2a8', '#e8b030']); g.beginPath(); g.ellipse(rand(W2), rand(H2), rand(3, 6), rand(1.5, 3), rand(TAU), 0, TAU); g.fill(); }
    });
    // box without a top: [corner, edge u, edge v, normal] per face
    const V = [], I = [], quad = (p, eu, ev, nrm) => {
      const b = V.length / 9;
      for (const [a, c] of [[0, 0], [1, 0], [0, 1], [1, 1]]) V.push(p[0] + eu[0] * a + ev[0] * c, p[1] + eu[1] * a + ev[1] * c, p[2] + eu[2] * a + ev[2] * c, ...nrm, a, c, 0);
      I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    };
    quad([-w / 2, -h, d / 2], [w, 0, 0], [0, h, 0], [0, 0, 1]); quad([w / 2, -h, -d / 2], [-w, 0, 0], [0, h, 0], [0, 0, -1]);
    quad([-w / 2, -h, -d / 2], [0, 0, d], [0, h, 0], [-1, 0, 0]); quad([w / 2, -h, d / 2], [0, 0, -d], [0, h, 0], [1, 0, 0]);
    quad([-w / 2, 0, d / 2], [w, 0, 0], [0, 0, -d], [0, 1, 0]);
    const box = fglStatic(V, I, wood, { rough: 0.6, sss: 0.1 });
    const G = []; const gi = [0, 1, 2, 1, 3, 2];
    for (const [a, c] of [[0, 0], [1, 0], [0, 1], [1, 1]]) G.push(-w / 2 + w * a, -h * 0.9, -d / 2 + d * c, 0, -1, 0, a, c, 0);
    const treasure = fglStatic(G, gi, gold, { rough: 0.25, tint: [1.2, 1.1, 0.9] });
    // lid: a half cylinder along x, hinged on the back edge (its local origin), front edge at z = d
    const LV = [], LI = [], NS = 16;
    for (let j = 0; j <= NS; j++) {
      const th = (j / NS) * Math.PI, ny = -Math.sin(th), nz = Math.cos(th);
      for (const a of [0, 1]) LV.push(-w / 2 + w * a, ny * d / 2, d / 2 + nz * d / 2, 0, ny, nz, a, j / NS, 0);
    }
    for (let j = 0; j < NS; j++) { const b = j * 2; LI.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    for (const [x, nx] of [[-w / 2, -1], [w / 2, 1]]) {   // the lid's end caps
      const c0 = LV.length / 9; LV.push(x, 0, d / 2, nx, 0, 0, 0.5, 0.5, 0);
      for (let j = 0; j <= NS; j++) { const th = (j / NS) * Math.PI; LV.push(x, -Math.sin(th) * d / 2, d / 2 + Math.cos(th) * d / 2, nx, 0, 0, 0.5, 0.5, 0); }
      for (let j = 0; j < NS; j++) LI.push(c0, c0 + 1 + j, c0 + 2 + j);
    }
    const lid = fglStatic(LV, LI, wood, { rough: 0.55, sss: 0.1 });
    return { box, treasure, lid, h, d };
  });
}
function chestJobs() {
  const c = LIFE.chest; if (!c) return null;
  const m = chestMeshes();
  return [{ obj: c, x: c.x, y: c.y, z: 0.12, k: U, hw: 5, hh: 7, render: () => {
    fglPose({ pitch: -0.05, yaw: 0.45, roll: -0.35 });
    fglDraw(m.box);
    if (c.open > 0.02) fglDraw(m.treasure);
    fglDraw(m.lid, { y: -m.h, z: -m.d / 2, roll: c.open * 1.7 });
  } }];
}

/* ---------- jellyfish: a glassy bell, trailing tentacles (units of the bell's radius) ---------- */
Jelly.prototype.glJobs = function (t) {
  const s = depthScale(this.z), r = this.r * s, p = this.p || 0, moon = this.kind === 'moon';
  const w = r * (1 - 0.2 * p), h = r * 0.62 * (1 + 0.28 * p);
  this.sx = this.x; this.sy = this.y; this.w = w; this.h = h;   // the night glow follows the bell
  const bell = fglCached('jellyBell', () => fglEllipsoid(1, 1, 1, { half: true }));
  const btex = fglTex(moon ? 'jellyMoon' : 'jellyCrystal', 128, 64, (g, W2, H2) => {
    g.fillStyle = 'rgba(200,230,255,0.16)'; g.fillRect(0, 0, W2, H2);
    if (moon) { g.strokeStyle = 'rgba(236,150,215,0.85)'; g.lineWidth = 5; for (let k = 0; k < 8; k++) { g.beginPath(); g.ellipse((k + 0.5) * W2 / 8, H2 * 0.55, W2 * 0.035, H2 * 0.14, 0, 0, TAU); g.stroke(); } }
    else { g.strokeStyle = 'rgba(230,245,255,0.5)'; g.lineWidth = 1; for (let k = 0; k < 24; k++) { g.beginPath(); g.moveTo((k / 24) * W2, 0); g.lineTo((k / 24) * W2, H2); g.stroke(); } }
    g.fillStyle = 'rgba(235,250,255,0.6)'; g.fillRect(0, H2 - 3, W2, 3);   // the rim
  });
  const ttex = fglTex('jellyTent', 4, 4, (g) => { g.fillStyle = 'rgba(225,240,255,0.4)'; g.fillRect(0, 0, 4, 4); });
  const nT = moon ? 34 : 22, tl = moon ? 0.35 : 1.8, tubes = [];
  for (let i = 0; i < nT; i++) {
    const u = (i / (nT - 1)) * 2 - 1, ang = u * Math.PI / 2 + (i % 2) * Math.PI;   // around the rim, front and back
    const bx = Math.sin(ang) * w / r, bz = Math.cos(ang) * w / r, by = 0.12 * h / r, pts = [];
    for (let k = 0; k <= 5; k++) { const q = k / 5; pts.push([bx + Math.sin(t * 1.3 + i * 0.7 + p * 2 + q * 2) * 0.18 * q, by + tl * q * (1 - p * 0.25), bz * (1 - q * 0.2)]); }
    tubes.push({ pts, r: [0.012, 0.011, 0.01, 0.009, 0.008, 0.006] });
  }
  if (moon) for (let k = 0; k < 4; k++) {   // oral arms
    const ox = (k - 1.5) * 0.16, pts = [];
    for (let j = 0; j <= 6; j++) { const q = j / 6; pts.push([ox + Math.sin(t * 1.4 + j * 0.8 + k) * 0.1 * q, 0.05 + q * 1.25, (k % 2 ? 0.05 : -0.05)]); }
    tubes.push({ pts, r: [0.07, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02] });
  }
  return [{ obj: this, x: this.x, y: this.y, z: this.z, k: r, hw: 1.5, hh: 2.6, render: () => {
    fglPose({ pitch: this.tilt });
    fglDraw(fglDynamic(fglTubes(tubes, 5), { tex: ttex }), null, true, { rough: 0.3, sss: 0.8, glass: 0.5 });
    fglDraw({ ...bell, tex: btex.t, texel: btex.texel }, { y: 0.12 * h / r, sx: w / r, sy: 0.92 * h / r, sz: w / r }, true, { rough: 0.15, sss: 0.9, glass: 0.75 });
  } }];
};
