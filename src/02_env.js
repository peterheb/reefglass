/* =====================================================================
   Water: background, light shafts, surface, caustics, grading
   ===================================================================== */
const ENV = { bg: null, rayWarm: null, rayCool: null, rays: [], cFrames: [], cPats: [], cLayer: null, vignette: null, sunX: 0, glints: [] };

function paintBackground() {
  const c = mk(W * PX, H * PX), g = c.getContext('2d');
  g.setTransform(PX, 0, 0, PX, 0, 0);
  // water column
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0.00, '#9be6ea');
  gr.addColorStop(0.07, '#56c6dc');
  gr.addColorStop(0.26, '#2297c2');
  gr.addColorStop(0.55, '#136a9f');
  gr.addColorStop(0.82, '#0d4a7a');
  gr.addColorStop(1.00, '#0a3a63');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // sun glow from above
  const sg = g.createRadialGradient(ENV.sunX, -H * 0.15, 0, ENV.sunX, -H * 0.15, H * 1.05);
  sg.addColorStop(0, 'rgba(225,255,245,0.45)'); sg.addColorStop(0.45, 'rgba(160,235,240,0.14)'); sg.addColorStop(1, 'rgba(120,200,230,0)');
  g.fillStyle = sg; g.fillRect(0, 0, W, H);

  // distant reef ridges, farthest first
  const ridges = [
    { base: 0.60, amp: 0.10, col: [44, 128, 164], a: 0.55, f: 1.6, deco: 0.6 },
    { base: 0.68, amp: 0.11, col: [30, 104, 142], a: 0.72, f: 2.2, deco: 0.8 },
    { base: 0.76, amp: 0.09, col: [22, 84, 120], a: 0.85, f: 3.0, deco: 1.0 },
  ];
  ridges.forEach((r, li) => {
    const col = rgbStr(r.col, r.a);
    const pts = [];
    const off = srand(100);
    for (let x = -10; x <= W + 10; x += 6) {
      const u = x / W;
      const y = H * (r.base - r.amp * (0.55 + 0.45 * fbm1(u * r.f * 3 + off, 4)) - r.amp * 0.35 * Math.max(0, fbm1(u * 11 + off * 2, 3)));
      pts.push([x, y]);
    }
    g.fillStyle = col;
    g.beginPath(); g.moveTo(-10, H);
    for (const p of pts) g.lineTo(p[0], p[1]);
    g.lineTo(W + 10, H); g.closePath(); g.fill();
    // coral silhouettes along the ridge
    const n = Math.floor((W / 60) * r.deco);
    for (let i = 0; i < n; i++) {
      const p = pts[Math.floor(srand(pts.length))];
      const s = U * srand(2.2, 5.5) * (0.6 + li * 0.25);
      silhouetteCoral(g, p[0], p[1] + 2, s, col);
    }
    // a lighter rim on the ridge tops, like light catching the reef crest
    g.strokeStyle = rgbStr(mixRGB(r.col, [190, 245, 245], 0.35), 0.18 + li * 0.04);
    g.lineWidth = 1.2; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
    if (li === 0 && W > 640) paintWreck(g, W * srand(0.58, 0.85), H * (r.base - r.amp * 0.35), U * srand(9, 12), rgbStr(mixRGB(r.col, [14, 50, 84], 0.22), 0.7), rgbStr(mixRGB(r.col, [120, 200, 220], 0.12), 0.9));
    // haze between layers
    const hz = g.createLinearGradient(0, H * (r.base - r.amp * 1.3), 0, H);
    hz.addColorStop(0, 'rgba(40,130,170,0)'); hz.addColorStop(1, 'rgba(18,80,120,0.22)');
    g.fillStyle = hz; g.fillRect(0, H * (r.base - r.amp * 1.3), W, H);
  });
  // dither to keep the long gradients from banding
  g.setTransform(1, 0, 0, 1, 0, 0);
  const nz = mk(128, 128), ng = nz.getContext('2d'), id = ng.createImageData(128, 128);
  for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() < 0.5 ? 0 : 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = Math.random() * 10; }
  ng.putImageData(id, 0, 0);
  g.fillStyle = g.createPattern(nz, 'repeat'); g.fillRect(0, 0, c.width, c.height);
  ENV.bg = c;
}

function silhouetteCoral(g, x, y, s, col) {
  g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round';
  const kind = SR();
  if (kind < 0.4) { // branching tree
    const br = (x0, y0, a, len, w, d) => {
      const x1 = x0 + Math.sin(a) * len, y1 = y0 - Math.cos(a) * len;
      g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      if (d > 0) { br(x1, y1, a - srand(0.3, 0.7), len * 0.72, w * 0.7, d - 1); br(x1, y1, a + srand(0.3, 0.7), len * 0.72, w * 0.7, d - 1); }
    };
    br(x, y, srand(-0.2, 0.2), s * 0.9, s * 0.18, 3);
  } else if (kind < 0.7) { // fan
    g.beginPath(); g.moveTo(x, y);
    g.ellipse(x, y - s * 1.1, s * 1.1, s * 1.05, 0, Math.PI * 0.95, Math.PI * 2.05); g.closePath(); g.fill();
  } else { // boulder / brain coral
    g.beginPath(); g.ellipse(x, y, s * srand(0.8, 1.4), s * srand(0.55, 0.8), 0, Math.PI, 0); g.fill();
  }
}

function paintWreck(g, x, y, s, col, holeCol) {
  g.save(); g.translate(x, y); g.rotate(-0.09); g.fillStyle = col; g.strokeStyle = col;
  g.beginPath();
  g.moveTo(-s * 1.6, -s * 0.05); g.lineTo(-s * 1.4, -s * 0.42); g.lineTo(s * 0.9, -s * 0.46);
  g.quadraticCurveTo(s * 1.45, -s * 0.5, s * 1.75, -s * 0.78); g.lineTo(s * 1.55, s * 0.1); g.lineTo(-s * 1.6, s * 0.12); g.closePath(); g.fill();
  g.fillRect(-s * 0.9, -s * 0.66, s * 0.9, s * 0.22); // deck house
  g.lineWidth = s * 0.05; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-s * 0.2, -s * 0.5); g.lineTo(-s * 0.05, -s * 1.5); g.stroke();
  g.beginPath(); g.moveTo(s * 0.8, -s * 0.5); g.lineTo(s * 1.05, -s * 1.05); g.stroke();
  g.lineWidth = s * 0.02; g.beginPath(); g.moveTo(-s * 0.05, -s * 1.45); g.lineTo(s * 1.7, -s * 0.8); g.moveTo(-s * 0.05, -s * 1.45); g.lineTo(-s * 1.45, -s * 0.45); g.stroke();
  g.fillStyle = holeCol;
  for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(-s * 1.1 + i * s * 0.38, -s * 0.24, s * 0.05, 0, TAU); g.fill(); }
  g.beginPath(); g.ellipse(s * 0.35, -s * 0.12, s * 0.22, s * 0.14, 0.4, 0, TAU); g.fill(); // hole in the hull
  g.restore();
}

function makeRaySprite(rgb) {
  const w = 64, h = 512, c = mk(w, h), g = c.getContext('2d'), id = g.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const v = y / h, half = 0.16 + 0.34 * v;
    const fade = Math.pow(1 - v, 1.6) * smooth(v / 0.06);
    for (let x = 0; x < w; x++) {
      const u = (x / (w - 1) - 0.5) / half;
      const a = Math.exp(-u * u * 2.6) * fade;
      const i = (y * w + x) * 4;
      id.data[i] = rgb[0]; id.data[i + 1] = rgb[1]; id.data[i + 2] = rgb[2]; id.data[i + 3] = a * 255;
    }
  }
  g.putImageData(id, 0, 0); return c;
}

function buildRays() {
  ENV.rays = [];
  const n = clamp(Math.round(W / 130), 5, 15);
  for (let i = 0; i < n; i++) {
    const x = ENV.sunX + ((i + 0.5) / n - 0.5) * W * 1.5 + rand(-40, 40);
    ENV.rays.push({ x, w: rand(0.05, 0.13) * Math.min(W, H * 1.4), len: rand(0.7, 1.05) * H, a: rand(0.25, 0.6), f: rand(0.05, 0.16), ph: rand(TAU), sway: rand(8, 26) });
  }
  ENV.glints = [];
  for (let i = 0; i < Math.round(W / 55); i++) ENV.glints.push({ x: rand(W), y: rand(0.004, 0.05) * H, s: rand(0.6, 1.6), v: rand(-14, 14), ph: rand(TAU), f: rand(0.4, 1.3) });
}

// where each shaft is this frame; shared by the 2D rays and the 3D models swimming through them
function updateRays(t) {
  const day = TOD.day, amt = REDUCED ? 0.6 : 1, sunY = -H * 1.3;
  ENV.rayNow = ENV.rays.map((r) => {
    const x = r.x + Math.sin(t * r.f * 0.7 + r.ph) * r.sway, pulse = 0.55 + 0.45 * Math.sin(t * r.f * TAU * 0.35 + r.ph);
    return { r, x, ang: Math.atan2(x - ENV.sunX, -sunY) * 0.9, aDay: r.a * pulse * 0.42 * day * amt, aNight: r.a * 0.55 * TOD.night * amt * TOD.moon };
  });
}
function drawRays(g) {
  g.globalCompositeOperation = 'lighter';
  for (const { r, x, ang, aDay, aNight } of ENV.rayNow) {
    g.save(); g.translate(x, -H * 0.01); g.rotate(-ang);
    if (aDay > 0.005) { g.globalAlpha = aDay; g.drawImage(ENV.rayWarm, -r.w / 2, 0, r.w, r.len); }
    if (aNight > 0.005) { g.globalAlpha = aNight; g.drawImage(ENV.rayCool, -r.w / 2, 0, r.w * 0.8, r.len * 0.8); }
    g.restore();
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

function drawSurface(g, t) {
  // bright underside of the surface
  const lum = 0.35 + 0.65 * TOD.day;
  const gr = g.createLinearGradient(0, 0, 0, H * 0.1);
  gr.addColorStop(0, `rgba(235,255,252,${0.5 * lum})`); gr.addColorStop(0.35, `rgba(170,240,245,${0.16 * lum})`); gr.addColorStop(1, 'rgba(120,220,240,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H * 0.1);
  g.globalCompositeOperation = 'lighter';
  // travelling wave lines
  for (let k = 0; k < 4; k++) {
    const y0 = H * (0.012 + k * 0.011), amp = H * (0.004 + k * 0.0015), sp = 0.35 + k * 0.17;
    g.strokeStyle = `rgba(210,255,250,${(0.22 - k * 0.04) * lum})`; g.lineWidth = 1.6 - k * 0.25;
    g.beginPath();
    for (let x = 0; x <= W + 12; x += 12) {
      const y = y0 + Math.sin(x * 0.012 + t * sp * (k % 2 ? -1 : 1) * 2 + k) * amp + Math.sin(x * 0.031 - t * 1.3 + k * 2) * amp * 0.5;
      x ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  // sparkles of sun through the ripples
  for (const s of ENV.glints) {
    s.x += s.v * 0.016; if (s.x < -20) s.x = W + 20; if (s.x > W + 20) s.x = -20;
    const a = Math.max(0, Math.sin(t * s.f * 2 + s.ph)) * 0.55 * lum;
    if (a < 0.02) continue;
    g.globalAlpha = a; const w = U * 3.5 * s.s, h = U * 0.55 * s.s;
    g.drawImage(GLOW.soft, s.x - w / 2, s.y - h / 2, w, h);
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

/* ---------- caustics: tileable Worley F2–F1 frames, generated once ---------- */
function buildCausticFrames() {
  if (ENV.cFrames.length) return;
  const S = 128, F = 24, N = 15;
  const pts = [];
  for (let i = 0; i < N; i++) pts.push({ x: rand(S), y: rand(S), r: rand(5, 13), k: pick([1, -1, 1, -1, 2]), p: rand(TAU) });
  for (let f = 0; f < F; f++) {
    const th = (f / F) * TAU;
    const px = pts.map((p) => (p.x + p.r * Math.cos(p.k * th + p.p) + S) % S);
    const py = pts.map((p) => (p.y + p.r * Math.sin(p.k * th + p.p) + S) % S);
    const c = mk(S, S), g = c.getContext('2d'), id = g.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let f1 = 1e9, f2 = 1e9;
      for (let i = 0; i < N; i++) {
        let dx = Math.abs(x - px[i]); if (dx > S / 2) dx = S - dx;
        let dy = Math.abs(y - py[i]); if (dy > S / 2) dy = S - dy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
      }
      const e = clamp(1 - (f2 - f1) / 5.5, 0, 1);
      const v = Math.pow(e, 3) * 0.8 + Math.pow(e, 9) * 0.5 + 0.06 * Math.exp(-f1 * 0.08);
      const o = (y * S + x) * 4;
      id.data[o] = 255; id.data[o + 1] = 255; id.data[o + 2] = 235; id.data[o + 3] = clamp(v, 0, 1) * 255;
    }
    g.putImageData(id, 0, 0); ENV.cFrames.push(c);
  }
}

function drawCaustics(g, t) {
  if (!REEF.mask || !ENV.cFrames.length) return;
  const inten = 0.36 * TOD.day + 0.05 * TOD.night;
  if (inten < 0.02) return;
  const L = ENV.cLayer, lg = L.getContext('2d');
  const F = ENV.cFrames.length, ft = (t * (REDUCED ? 3 : 7)) % F, i0 = Math.floor(ft), fr = ft - i0;
  if (!ENV.cPats.length) ENV.cPats = ENV.cFrames.map((c) => lg.createPattern(c, 'repeat'));
  const sx = (U * 19) / 128 * L.scale, sy = (U * 10) / 128 * L.scale;
  const m = new DOMMatrix([sx, 0, 0, sy, (t * U * 0.8) * L.scale, 0]);
  lg.setTransform(1, 0, 0, 1, 0, 0);
  lg.globalCompositeOperation = 'copy'; lg.globalAlpha = 1 - fr;
  const pa = ENV.cPats[i0], pb = ENV.cPats[(i0 + 1) % F];
  pa.setTransform(m); lg.fillStyle = pa; lg.fillRect(0, 0, L.width, L.height);
  lg.globalCompositeOperation = 'lighter'; lg.globalAlpha = fr;
  pb.setTransform(m); lg.fillStyle = pb; lg.fillRect(0, 0, L.width, L.height);
  lg.globalAlpha = 1; lg.globalCompositeOperation = 'destination-in';
  lg.drawImage(REEF.mask, 0, 0, L.width, L.height);
  lg.globalCompositeOperation = 'source-over';
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = inten;
  g.drawImage(L, 0, REEF.bandTop, W, H - REEF.bandTop);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

/* ---------- grading and lens ---------- */
function drawGrade(g) {
  const n = TOD.night, w = TOD.warm;
  let top = mixRGB([255, 255, 255], [62, 86, 142], n), bot = mixRGB([196, 214, 232], [22, 34, 72], n);
  top = mixRGB(top, [255, 190, 150], w * 0.75); bot = mixRGB(bot, [112, 96, 150], w * 0.6);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, rgbStr(top)); gr.addColorStop(1, rgbStr(bot));
  g.globalCompositeOperation = 'multiply'; g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
}

function buildVignette() {
  const s = 0.25, c = mk(W * s, H * s), g = c.getContext('2d');
  const gr = g.createRadialGradient(c.width / 2, c.height * 0.45, Math.min(c.width, c.height) * 0.35, c.width / 2, c.height * 0.5, Math.hypot(c.width, c.height) * 0.62);
  gr.addColorStop(0, 'rgba(0,8,18,0)'); gr.addColorStop(1, 'rgba(0,8,18,0.5)');
  g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  ENV.vignette = c;
}

const GLOW = {};
function buildGlows() {
  GLOW.soft = makeGlow(32, [[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]);
  GLOW.cyan = makeGlow(32, [[0, 'rgba(170,255,250,1)'], [0.3, 'rgba(90,230,235,0.45)'], [1, 'rgba(40,160,220,0)']]);
  GLOW.green = makeGlow(32, [[0, 'rgba(190,255,190,1)'], [0.3, 'rgba(90,255,150,0.45)'], [1, 'rgba(30,200,120,0)']]);
  GLOW.warm = makeGlow(32, [[0, 'rgba(255,240,200,1)'], [0.35, 'rgba(255,200,120,0.4)'], [1, 'rgba(255,160,80,0)']]);
  GLOW.dot = makeGlow(8, [[0, 'rgba(255,255,255,0.95)'], [0.5, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
  GLOW.ink = makeGlow(32, [[0, 'rgba(22,10,30,0.95)'], [0.5, 'rgba(26,14,36,0.55)'], [1, 'rgba(30,18,40,0)']]);
}

function buildEnvironment() {
  SR = mulberry32(SEED);
  ENV.sunX = W * srand(0.28, 0.62);
  paintBackground();
  if (!ENV.rayWarm) { ENV.rayWarm = makeRaySprite([255, 250, 224]); ENV.rayCool = makeRaySprite([170, 205, 255]); }
  buildRays();
  buildVignette();
  buildCausticFrames();
}
