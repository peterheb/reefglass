/* =====================================================================
   Reef layout: layers (back, front, foreground), fluorescence, caustic
   mask, heightmap and anchor points for the animated life
   ===================================================================== */
const REEF = { back: null, front: null, fg: null, fluo: null, mask: null, bandTop: 0, top: null, step: 6, sand: null, rocks: [],
  anemone: null, cave: null, vent: null, chest: null, eelBed: null, grass: [], urchins: [] };

function sandY(x) { const a = REEF.sand; return a[clamp(Math.round(x / 4), 0, a.length - 1)]; }
function reefTopAt(x) { const t = REEF.top; if (!t) return H * 0.85; return t[clamp(Math.round(x / REEF.step), 0, t.length - 1)]; }

// Layers we read pixels back from stay in CPU memory: a GPU canvas readback stalls for seconds in Chrome/Edge.
function layerCanvas(scale, readBack = false) {
  const c = mk(W * PX * scale, (H - REEF.bandTop) * PX * scale), g = c.getContext('2d', readBack ? { willReadFrequently: true } : undefined);
  g.setTransform(PX * scale, 0, 0, PX * scale, 0, -REEF.bandTop * PX * scale);
  return [c, g];
}

function paintSand(g, mg) {
  const top = H * 0.84;
  const p = new Path2D(); p.moveTo(-5, H + 5);
  for (let x = -4; x <= W + 4; x += 4) p.lineTo(x, sandY(x));
  p.lineTo(W + 5, H + 5); p.closePath();
  const gr = g.createLinearGradient(0, top, 0, H);
  gr.addColorStop(0, '#d9c59a'); gr.addColorStop(0.35, '#cfb487'); gr.addColorStop(1, '#a18763');
  g.fillStyle = gr; g.fill(p);
  g.save(); g.clip(p);
  const hz = g.createLinearGradient(0, top, 0, top + H * 0.07);
  hz.addColorStop(0, rgbStr(FOG_RGB, 0.6)); hz.addColorStop(1, rgbStr(FOG_RGB, 0));
  g.fillStyle = hz; g.fillRect(0, top - 10, W, H * 0.09);
  let y = top + 2;
  while (y < H + 4) {
    const t = clamp((y - top) / (H - top), 0, 1), sp = lerp(U * 0.3, U * 1.5, t), wl = W / srand(7, 13), ph = srand(TAU);
    const path = (dy) => { g.beginPath(); for (let x = -8; x <= W + 8; x += 8) { const yy = y + dy + Math.sin(x / wl * TAU + ph) * sp * 0.35 + fbm1(x * 0.01 + ph, 2) * sp * 0.4; x > -8 ? g.lineTo(x, yy) : g.moveTo(x, yy); } };
    path(0); g.strokeStyle = `rgba(255,248,225,${0.12 + t * 0.1})`; g.lineWidth = sp * 0.22; g.stroke();
    path(sp * 0.22); g.strokeStyle = `rgba(90,66,40,${0.08 + t * 0.1})`; g.lineWidth = sp * 0.16; g.stroke();
    y += sp * srand(0.8, 1.2);
  }
  const n = (W * (H - top)) / 26;
  for (let i = 0; i < n; i++) {
    const r = SR();
    g.fillStyle = r < 0.45 ? 'rgba(255,250,235,0.45)' : r < 0.85 ? 'rgba(80,60,40,0.3)' : spick(['rgba(240,150,170,0.55)', 'rgba(170,190,210,0.5)', 'rgba(255,255,255,0.7)']);
    const yy = srand(top, H), s = lerp(0.6, 2.0, (yy - top) / (H - top)) * srand(0.6, 1.3);
    g.fillRect(srand(W), yy, s, s);
  }
  g.restore();
  const m = mg.createLinearGradient(0, top, 0, H); m.addColorStop(0, '#dddddd'); m.addColorStop(1, '#8a8a8a');
  mg.fillStyle = m; mg.fill(p);
}

function decorateRock(g, r, baseY, dens = 1, reserve = []) {
  const n = Math.floor(((r.x1 - r.x0) / (U * 2.5)) * dens), items = [];
  for (let i = 0; i < n; i++) {
    const x = srand(Math.max(r.x0 + U, U), Math.min(r.x1 - U, W - U)), top = r.topAt(x);
    const crest = SR() < 0.58, y = crest ? top + U * 0.5 : lerp(top, baseY, srand(0.18, 0.72));
    if (reserve.some((q) => Math.abs(q.x - x) < q.r * 1.3 && Math.abs(q.y - y) < q.r * 1.3)) continue;
    items.push({ x, y, k: SR(), crest });
  }
  items.sort((a, b) => a.y - b.y);
  for (const it of items) {
    const s = U * srand(1.2, 2.3), k = it.k;
    if (k < 0.15) brainCoral(g, it.x, it.y, s * 1.25);
    else if (k < 0.35) branchingCoral(g, it.x, it.y, s);
    else if (k < 0.44) (it.crest && SR() < 0.45 ? tableCoral : branchingCoral)(g, it.x, it.y, s * 0.9);
    else if (k < 0.54) (it.crest ? seaFan : zoanthids)(g, it.x, it.y, s * 0.9);
    else if (k < 0.64) tubeSponge(g, it.x, it.y, s * 0.85);
    else if (k < 0.75) zoanthids(g, it.x, it.y, s);
    else if (k < 0.83) treeCoral(g, it.x, it.y, s * 0.85);
    else if (k < 0.89) bubbleCoral(g, it.x, it.y, s * 0.85);
    else if (k < 0.95) giantClam(g, it.x, it.y, s * 0.8);
    else seaWhip(g, it.x, it.y, s * 0.8);
  }
}

function paintCave(g, x, y, r) {
  const gr = g.createRadialGradient(x, y + r * 0.25, r * 0.1, x, y, r * 1.25);
  gr.addColorStop(0, '#030108'); gr.addColorStop(0.62, '#0c0612'); gr.addColorStop(1, 'rgba(24,14,34,0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.35, r * 0.95, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,228,220,0.2)'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y + 1, r * 1.12, r * 0.74, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
  if (MK) { MK.fillStyle = '#000'; MK.beginPath(); MK.ellipse(x, y, r * 1.1, r * 0.75, 0, 0, TAU); MK.fill(); }
}

function paintForeground(g) {
  const tmp = mk(W * PX, (H - REEF.bandTop) * PX), tg = tmp.getContext('2d');
  tg.setTransform(PX, 0, 0, PX, 0, -REEF.bandTop * PX);
  const saveFL = FL, saveMK = MK; FL = null; MK = null;
  const L = paintRockMass(tg, -W * 0.08, W * (W < H ? 0.3 : 0.15), H * 0.83, H * 1.02, { light: '#5a4c5e', mid: '#352c40', dark: '#150f1e', peak: 0.3, round: 0.8 });
  const R = paintRockMass(tg, W * (W < H ? 0.72 : 0.88), W * 1.07, H * 0.8, H * 1.02, { light: '#5a4c5e', mid: '#352c40', dark: '#150f1e', peak: 0.7, round: 0.8 });
  for (const r of [L, R]) for (let i = 0; i < 3; i++) { const x = srand(Math.max(r.x0 + U * 2, U), Math.min(r.x1 - U * 2, W - U)); (SR() < 0.5 ? branchingCoral : seaFan)(tg, x, r.topAt(x) + U * 0.3, U * srand(1.6, 2.4)); }
  tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = 'source-atop';
  tg.fillStyle = 'rgba(6,16,30,0.5)'; tg.fillRect(0, 0, tmp.width, tmp.height);
  FL = saveFL; MK = saveMK;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  if ('filter' in g) g.filter = `blur(${Math.max(1, 1.6 * PX)}px)`;
  g.drawImage(tmp, 0, 0); g.restore();
}

function buildReef() {
  SR = mulberry32(SEED ^ 0x5eed);
  REEF.bandTop = Math.floor(H * 0.34);
  const o = srand(100);
  REEF.sand = new Float32Array(Math.ceil(W / 4) + 3);
  for (let i = 0; i < REEF.sand.length; i++) { const x = i * 4; REEF.sand[i] = H * (0.868 + 0.014 * fbm1((x / W) * 2.2 + o, 3) + 0.006 * Math.sin((x / W) * 8 + o)); }

  const [back, bg] = layerCanvas(1, true), [front, fg] = layerCanvas(1, true), [fore, fog] = layerCanvas(1);
  const [fl, flg] = layerCanvas(0.5), [mask, mg] = layerCanvas(0.25, true);
  mg.fillStyle = '#000'; mg.fillRect(-10, REEF.bandTop - 10, W + 20, H);
  MK = mg; FL = flg;

  /* back reef — farther formations, fogged */
  FLA = 0.35;
  const nb = Math.max(2, Math.round(W / 420));
  for (let i = 0; i < nb; i++) {
    const cx = ((i + 0.5) / nb) * W + srand(-W * 0.06, W * 0.06), w = W * srand(0.3, 0.46) / Math.max(1, nb * 0.45);
    const base = sandY(cx) + H * 0.012, top = H * (W / H < 0.9 ? srand(0.64, 0.72) : srand(0.5, 0.62));
    const r = paintRockMass(bg, cx - w / 2, cx + w / 2, top, base, { light: '#948da2', mid: '#5f5874', dark: '#2e2b44', peak: srand(0.3, 0.7), round: srand(0.5, 0.9), freq: srand(2, 4) });
    decorateRock(bg, r, base, 1.0);
  }
  bg.save(); bg.globalCompositeOperation = 'source-atop'; bg.fillStyle = rgbStr(FOG_RGB, 0.44); bg.fillRect(-10, REEF.bandTop - 10, W + 20, H); bg.restore();

  /* front reef */
  FLA = 1;
  paintSand(fg, mg);
  const narrow = W / H < 0.9;
  const spec = narrow
    ? [{ x0: -0.14, x1: 0.46, top: 0.71, base: 0.975, peak: 0.45 }, { x0: 0.58, x1: 1.14, top: 0.73, base: 0.98, peak: 0.55 }]
    : [{ x0: -0.04, x1: 0.34, top: 0.56, base: 0.972, peak: 0.36 }, { x0: 0.415, x1: 0.595, top: 0.748, base: 0.93, peak: 0.5, round: 0.95 }, { x0: 0.705, x1: 1.05, top: 0.585, base: 0.978, peak: 0.62 }];
  REEF.rocks = [];
  for (const s of spec) {
    const r = paintRockMass(fg, W * s.x0, W * s.x1, H * s.top, H * s.base, { peak: s.peak, round: s.round ?? 0.6, freq: 3.2 });
    r.base = H * s.base; REEF.rocks.push(r);
  }
  // anchors
  const L = REEF.rocks[0], C = narrow ? REEF.rocks[1] : REEF.rocks[1], Rr = REEF.rocks[REEF.rocks.length - 1];
  const ax = narrow ? lerp(C.x0, C.x1, 0.42) : (C.x0 + C.x1) / 2;
  REEF.anemone = { x: ax, y: C.topAt(ax) + U * 0.6 };
  const cx = lerp(Math.max(L.x0, 0), L.x1, narrow ? 0.4 : 0.52), cy = lerp(L.topAt(cx), L.base, 0.42);
  REEF.cave = { x: cx, y: cy, r: U * 3.2 };
  const vx = lerp(Rr.x0, Math.min(Rr.x1, W), 0.35); REEF.vent = { x: vx, y: Rr.topAt(vx) + U * 0.5 };
  const reserve = [{ x: REEF.anemone.x, y: REEF.anemone.y, r: U * 5 }, { x: cx, y: cy, r: U * 4.2 }, { x: vx, y: REEF.vent.y, r: U * 1.5 }];
  paintCave(fg, cx, cy, REEF.cave.r);
  for (const r of REEF.rocks) decorateRock(fg, r, r.base, 1.75, reserve);

  // open sand: eel bed, chest, grass, details
  const gap = narrow ? [0.44, 0.6] : [0.6, 0.705];
  REEF.eelBed = { x0: W * (gap[0] + 0.012), x1: W * (gap[1] - 0.012) };
  const chx = narrow ? W * 0.52 : W * 0.375;
  REEF.chest = { x: chx, y: H * 0.955 };
  REEF.grass = [];
  const grassSpots = narrow ? [[0.45, 0.93], [0.05, 0.995], [0.95, 0.99]] : [[0.345, 0.915], [0.395, 0.9], [0.405, 0.935], [0.6, 0.93], [0.03, 0.995], [0.97, 0.99], [0.68, 0.965]];
  for (const [gx, gy] of grassSpots) REEF.grass.push({ x: W * gx, y: H * gy, n: randi(5, 9), h: U * rand(5, 10) * (gy > 0.97 ? 1.6 : 1) });
  const onRock = (x, y) => REEF.rocks.some((r) => x > r.x0 && x < r.x1 && y < r.base + U * 0.8 && y > r.topAt(x) - U);
  for (let i = 0; i < W / 70; i++) { const x = srand(W), y = srand(sandY(x) + U, H - U * 0.5); if (!onRock(x, y)) shell(fg, x, y, U * srand(0.5, 1.0) * lerp(0.6, 1.3, (y - H * 0.85) / (H * 0.15))); }
  for (let i = 0; i < randi(2, 4); i++) { const x = srand(W * 0.05, W * 0.95), y = srand(sandY(x) + U * 2, H - U * 2); if (!onRock(x, y) && Math.abs(x - chx) > U * 6) starfish(fg, x, y, U * srand(1.2, 1.9)); }
  for (const r of REEF.rocks) { const x = srand(r.x0 + U * 3, r.x1 - U * 3), y = lerp(r.topAt(x), r.base, 0.55); if (x > 0 && x < W) starfish(fg, x, y, U * srand(1.0, 1.5), null, 0.85); }
  for (const r of REEF.rocks) for (let i = 0; i < randi(1, 3); i++) { const x = clamp(r.x0 + srand(r.x1 - r.x0), U, W - U); urchin(fg, x, r.base + U * srand(0.2, 1.2), U * srand(0.8, 1.2)); }

  /* foreground corners */
  paintForeground(fog);

  /* caustic mask: grey level → alpha */
  const mctx = mask.getContext('2d'), md = mctx.getImageData(0, 0, mask.width, mask.height);
  for (let i = 0; i < md.data.length; i += 4) { const v = md.data[i]; md.data[i] = md.data[i + 1] = md.data[i + 2] = 255; md.data[i + 3] = v; }
  mctx.putImageData(md, 0, 0);

  /* heightmap of the reef silhouette for swimmers */
  const st = REEF.step, cols = Math.ceil(W / st) + 1, rows = Math.ceil((H - REEF.bandTop) / st);
  const hm = mk(cols, rows), hg = hm.getContext('2d', { willReadFrequently: true });
  hg.drawImage(back, 0, 0, cols, rows); hg.drawImage(front, 0, 0, cols, rows);
  const hd = hg.getImageData(0, 0, cols, rows).data;
  REEF.top = new Float32Array(cols);
  for (let c = 0; c < cols; c++) { let r = 0; while (r < rows && hd[(r * cols + c) * 4 + 3] < 140) r++; REEF.top[c] = REEF.bandTop + r * st; }

  REEF.back = back; REEF.front = front; REEF.fg = fore; REEF.fluo = fl; REEF.mask = mask;
  REEF.lit = fglRelight(back, front);
  const cl = mk(W * PX * 0.38, (H - REEF.bandTop) * PX * 0.38); cl.scale = PX * 0.38; ENV.cLayer = cl; ENV.cPats = [];
  FL = null; MK = null;
}
