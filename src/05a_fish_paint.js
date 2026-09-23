/* =====================================================================
   Fish sprites. Painted once in "length units": body spans x −0.5 (tail
   joint) to +0.5 (snout), y down. Tail and pectoral sprites have their
   pivot at the joint (x = 0) and extend to −x.
   ===================================================================== */
const SPECIES = {};
function defSpecies(id, d) { d.id = id; SPECIES[id] = d; return d; }

function rim(g, path, inner, innerW, outer, outerW) {
  g.lineJoin = 'round';
  if (outer) { g.strokeStyle = outer; g.lineWidth = outerW; g.stroke(path); }
  if (inner) { g.save(); g.clip(path); g.strokeStyle = inner; g.lineWidth = innerW; g.stroke(path); g.restore(); }
}
function fillP(g, path, col, a = 1) { g.globalAlpha = a; g.fillStyle = col; g.fill(path); g.globalAlpha = 1; }
function rays(g, path, A, B, C, D, n, col, lw) {
  g.save(); g.clip(path); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); g.beginPath(); g.moveTo(lerp(A[0], B[0], t), lerp(A[1], B[1], t)); g.lineTo(lerp(C[0], D[0], t), lerp(C[1], D[1], t)); g.stroke(); }
  g.restore();
}
function vgrad(g, y0, y1, stops) { const gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function hgrad(g, x0, x1, stops) { const gr = g.createLinearGradient(x0, 0, x1, 0); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function shade(g, path, y0, y1, o = {}) {
  g.save(); g.clip(path);
  g.fillStyle = vgrad(g, y0, y1, [[0, `rgba(8,18,48,${o.top ?? 0.34})`], [0.42, 'rgba(8,18,48,0)'], [0.68, 'rgba(255,255,240,0)'], [1, `rgba(255,252,236,${o.belly ?? 0.22})`]]);
  g.fillRect(-1, y0, 2, y1 - y0);
  const yc = (y0 + y1) / 2, rg = g.createRadialGradient(0.06, yc - (y1 - y0) * 0.08, 0.02, 0, yc, 0.6);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.72, 'rgba(0,0,0,0)'); rg.addColorStop(1, `rgba(0,8,26,${o.edge ?? 0.3})`);
  g.fillStyle = rg; g.fillRect(-1, y0, 2, y1 - y0);
  g.translate(0.1, y0 + (y1 - y0) * 0.3); g.scale(1, 0.32);
  const sh = g.createRadialGradient(0, 0, 0, 0, 0, 0.42); sh.addColorStop(0, `rgba(255,255,255,${o.sheen ?? 0.24})`); sh.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sh; g.fillRect(-0.5, -0.5, 1, 1);
  g.restore();
}
function scales(g, path, s, y0, y1, dark = 'rgba(0,10,30,0.13)', light = 'rgba(255,255,255,0.13)') {
  g.save(); g.clip(path); g.lineWidth = s * 0.12;
  let row = 0;
  for (let y = y0; y <= y1; y += s * 0.55, row++) for (let x = -0.55 + (row % 2) * s * 0.5; x <= 0.55; x += s) {
    g.strokeStyle = dark; g.beginPath(); g.arc(x, y, s * 0.56, Math.PI * 0.62, Math.PI * 1.38); g.stroke();
    g.strokeStyle = light; g.beginPath(); g.arc(x + s * 0.09, y, s * 0.56, Math.PI * 0.7, Math.PI * 1.05); g.stroke();
  }
  g.restore();
}
function eye(g, x, y, r, iris = '#d9a441', ring = null) {
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(x, y, r * 1.25, 0, TAU); g.fill();
  if (ring) { g.fillStyle = ring; g.beginPath(); g.arc(x, y, r * 1.1, 0, TAU); g.fill(); }
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  gr.addColorStop(0, shadeHex(iris, 0.35, '#ffffff')); gr.addColorStop(0.6, iris); gr.addColorStop(1, shadeHex(iris, 0.6));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.fillStyle = '#050508'; g.beginPath(); g.arc(x + r * 0.05, y, r * 0.55, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.34, r * 0.24, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(x + r * 0.28, y + r * 0.3, r * 0.1, 0, TAU); g.fill();
}
function gill(g, x, y0, y1, bulge = 0.05) {
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 0.009; g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x - bulge, (y0 + y1) / 2, x, y1); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 0.006; g.beginPath(); g.moveTo(x + 0.01, y0); g.quadraticCurveTo(x - bulge + 0.01, (y0 + y1) / 2, x + 0.01, y1); g.stroke();
}
function mouth(g, x, y, w = 0.04) { g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.007; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - w * 0.5, y + w * 0.35, x - w, y + w * 0.1); g.stroke(); }
function withClip(g, path, fn) { g.save(); g.clip(path); fn(); g.restore(); }
function curveBand(g, xt, xm, xb, yT = -0.6, yB = 0.6) { g.moveTo(xt, yT); g.quadraticCurveTo(xm, 0, xb, yB); }
function bandPath(front, back, yT = -0.6, yB = 0.6) {
  const p = new Path2D(); p.moveTo(front[0], yT); p.quadraticCurveTo(front[1], 0, front[2], yB); p.lineTo(back[2], yB); p.quadraticCurveTo(back[1], 0, back[0], yT); p.closePath(); return p;
}
function roundTail(len, h, notch = 0) {
  const p = new Path2D(); p.moveTo(0.005, -h * 0.28);
  p.bezierCurveTo(-len * 0.35, -h * 0.75, -len * 0.9, -h * 0.72, -len, -h * 0.35 + notch);
  p.quadraticCurveTo(-len * (1.06 - notch), 0, -len, h * 0.35 - notch);
  p.bezierCurveTo(-len * 0.9, h * 0.72, -len * 0.35, h * 0.75, 0.005, h * 0.28); p.closePath(); return p;
}
function forkTail(len, h, fork = 0.5, lobe = 1) {
  const p = new Path2D(); p.moveTo(0.005, -h * 0.2);
  p.quadraticCurveTo(-len * 0.5, -h * 0.35, -len * lobe, -h * 0.55);
  p.quadraticCurveTo(-len * (1 - fork * 0.9), -h * 0.12, -len * (1 - fork), 0);
  p.quadraticCurveTo(-len * (1 - fork * 0.9), h * 0.12, -len * lobe, h * 0.55);
  p.quadraticCurveTo(-len * 0.5, h * 0.35, 0.005, h * 0.2); p.closePath(); return p;
}
function simplePec(len, h, col, a = 0.6, edge = null) {
  return (g) => {
    const p = new Path2D(); p.moveTo(0, -h * 0.25); p.bezierCurveTo(-len * 0.4, -h * 0.7, -len, -h * 0.4, -len, 0.0); p.bezierCurveTo(-len * 0.8, h * 0.4, -len * 0.3, h * 0.45, 0, h * 0.25); p.closePath();
    fillP(g, p, col, a);
    rays(g, p, [0, -h * 0.2], [0, h * 0.2], [-len * 1.2, -h * 0.8], [-len * 1.2, h * 0.6], 7, 'rgba(0,0,0,0.18)', 0.004);
    if (edge) rim(g, p, edge, 0.02, null);
  };
}

/* ---------------- Ocellaris clownfish ---------------- */
defSpecies('clown', {
  name: 'Ocellaris clownfish', sci: 'Amphiprion ocellaris', fact: 'A slime coat protects it from its anemone’s stings. All are born male; the dominant fish becomes female.',
  len: 5.4, res: 220, box: [1.04, 0.84], tailBox: [0.3, 0.46], tailAt: [-0.47, 0], pecBox: [0.18, 0.14], pecAt: [0.16, 0.05], pecAng: 0.35,
  swim: { speed: 2.4, burst: 7, agility: 3.2, tailHz: 3.4, tailAmp: 0.55 }, behavior: 'home', zone: [0.55, 1], z: [0.2, 0.28], count: 3,
  paintBody(g) {
    const body = new Path2D(); body.moveTo(0.5, 0.01); body.bezierCurveTo(0.46, -0.14, 0.3, -0.215, 0.1, -0.215); body.bezierCurveTo(-0.15, -0.22, -0.36, -0.14, -0.5, -0.07); body.lineTo(-0.5, 0.07); body.bezierCurveTo(-0.36, 0.14, -0.15, 0.205, 0.1, 0.2); body.bezierCurveTo(0.3, 0.2, 0.46, 0.13, 0.5, 0.03); body.closePath();
    const dors = new Path2D(); dors.moveTo(0.2, -0.19); dors.bezierCurveTo(0.14, -0.31, 0.04, -0.31, -0.02, -0.27); dors.bezierCurveTo(-0.1, -0.38, -0.28, -0.39, -0.41, -0.1); dors.lineTo(0.2, -0.12); dors.closePath();
    const anal = new Path2D(); anal.moveTo(-0.07, 0.18); anal.bezierCurveTo(-0.12, 0.33, -0.3, 0.33, -0.41, 0.09); anal.lineTo(-0.07, 0.1); anal.closePath();
    const pelv = new Path2D(); pelv.moveTo(0.18, 0.18); pelv.bezierCurveTo(0.12, 0.3, 0.05, 0.34, 0.01, 0.32); pelv.lineTo(0.08, 0.17); pelv.closePath();
    for (const f of [dors, anal, pelv]) { fillP(g, f, '#ff7a1a', 0.96); rays(g, f, [0.2, -0.1], [-0.4, -0.1], [0.3, -0.5], [-0.6, -0.4], 12, 'rgba(120,40,0,0.25)', 0.005); rim(g, f, '#141414', 0.05, 'rgba(255,255,255,0.9)', 0.014); }
    g.fillStyle = vgrad(g, -0.22, 0.22, [[0, '#f0620e'], [0.5, '#ff8425'], [1, '#ffa855']]); g.fill(body);
    withClip(g, body, () => {
      const bands = [bandPath([0.29, 0.35, 0.27], [0.19, 0.24, 0.17]), bandPath([0.07, 0.15, 0.05], [-0.05, 0.02, -0.07]), bandPath([-0.34, -0.33, -0.34], [-0.44, -0.43, -0.44])];
      for (const b of bands) { g.fillStyle = '#fbfbf6'; g.fill(b); rim(g, b, '#151515', 0.035, null); }
    });
    shade(g, body, -0.22, 0.22, { top: 0.22, sheen: 0.3 });
    gill(g, 0.23, -0.14, 0.13);
    eye(g, 0.365, -0.045, 0.058, '#c8541a');
    mouth(g, 0.5, 0.02, 0.035);
  },
  paintTail(g) { const p = roundTail(0.27, 0.42); fillP(g, p, '#ff7a1a', 0.95); rays(g, p, [0, -0.06], [0, 0.06], [-0.35, -0.3], [-0.35, 0.3], 12, 'rgba(120,40,0,0.3)', 0.005); rim(g, p, '#141414', 0.05, 'rgba(255,255,255,0.9)', 0.014); },
  paintPec: simplePec(0.16, 0.13, '#ff8a2a', 0.75, 'rgba(20,20,20,0.6)'),
});

/* ---------------- Blue tang ---------------- */
defSpecies('bluetang', {
  name: 'Blue tang', sci: 'Paracanthurus hepatus', fact: 'A surgeonfish: a scalpel-sharp spine hides at the base of its tail.',
  len: 9.2, res: 300, box: [1.04, 0.84], tailBox: [0.26, 0.5], tailAt: [-0.47, 0], pecBox: [0.2, 0.14], pecAt: [0.18, 0.06], pecAng: 0.3,
  swim: { speed: 4.2, burst: 10, agility: 2.2, tailHz: 2.4, tailAmp: 0.5 }, behavior: 'cruise', zone: [0.1, 0.85], z: [0.05, 0.75], count: 3,
  paintBody(g) {
    const body = new Path2D(); body.moveTo(0.5, 0.04); body.bezierCurveTo(0.47, -0.12, 0.34, -0.27, 0.1, -0.29); body.bezierCurveTo(-0.15, -0.3, -0.38, -0.16, -0.5, -0.06); body.lineTo(-0.5, 0.06); body.bezierCurveTo(-0.38, 0.16, -0.15, 0.3, 0.1, 0.29); body.bezierCurveTo(0.34, 0.27, 0.46, 0.16, 0.5, 0.06); body.closePath();
    const dors = new Path2D(); dors.moveTo(0.28, -0.24); dors.bezierCurveTo(0.15, -0.38, -0.2, -0.39, -0.45, -0.13); dors.lineTo(0, -0.2); dors.closePath();
    const anal = new Path2D(); anal.moveTo(0.06, 0.28); anal.bezierCurveTo(-0.1, 0.37, -0.3, 0.33, -0.45, 0.12); anal.lineTo(0, 0.2); anal.closePath();
    for (const f of [dors, anal]) { fillP(g, f, '#1b46c8', 0.95); rays(g, f, [0.3, 0], [-0.45, 0], [0.2, -0.6], [-0.6, -0.3], 20, 'rgba(0,0,40,0.3)', 0.004); rays(g, f, [0.3, 0], [-0.45, 0], [0.2, 0.6], [-0.6, 0.3], 20, 'rgba(0,0,40,0.3)', 0.004); rim(g, f, '#0a0a14', 0.03, 'rgba(120,200,255,0.8)', 0.012); }
    g.fillStyle = vgrad(g, -0.3, 0.3, [[0, '#1d4fd8'], [0.55, '#2b73ee'], [1, '#5aa0ff']]); g.fill(body);
    withClip(g, body, () => {
      const pal = new Path2D(); pal.moveTo(0.38, -0.12); pal.bezierCurveTo(0.2, -0.24, -0.2, -0.26, -0.38, -0.16); pal.bezierCurveTo(-0.47, -0.12, -0.52, -0.03, -0.48, 0.04);
      pal.bezierCurveTo(-0.4, 0.05, -0.3, 0.12, -0.12, 0.13); pal.bezierCurveTo(0.06, 0.14, 0.2, 0.03, 0.32, -0.04); pal.closePath();
      g.fillStyle = '#0b0c1a'; g.fill(pal);
      g.fillStyle = vgrad(g, -0.15, 0.05, [[0, '#2560e6'], [1, '#2f7cf0']]); g.beginPath(); g.ellipse(-0.1, -0.055, 0.17, 0.068, -0.06, 0, TAU); g.fill();
      g.fillStyle = '#ffd21a'; g.beginPath(); g.moveTo(-0.5, -0.05); g.lineTo(-0.36, 0); g.lineTo(-0.5, 0.05); g.fill();
    });
    shade(g, body, -0.3, 0.3, { top: 0.2, sheen: 0.26 });
    gill(g, 0.24, -0.16, 0.16);
    eye(g, 0.35, -0.075, 0.05, '#2a2a3a');
    mouth(g, 0.5, 0.045, 0.03);
  },
  paintTail(g) {
    const p = new Path2D(); p.moveTo(0.005, -0.06); p.lineTo(-0.22, -0.23); p.bezierCurveTo(-0.18, -0.1, -0.18, 0.1, -0.22, 0.23); p.lineTo(0.005, 0.06); p.closePath();
    fillP(g, p, '#ffd21a', 0.97); rays(g, p, [0, -0.05], [0, 0.05], [-0.26, -0.26], [-0.26, 0.26], 12, 'rgba(120,80,0,0.28)', 0.004);
    withClip(g, p, () => { g.strokeStyle = '#0b0c1a'; g.lineWidth = 0.06; g.beginPath(); g.moveTo(0.02, -0.08); g.lineTo(-0.23, -0.25); g.moveTo(0.02, 0.08); g.lineTo(-0.23, 0.25); g.stroke(); });
  },
  paintPec(g) { const p = new Path2D(); p.moveTo(0, -0.04); p.bezierCurveTo(-0.08, -0.08, -0.18, -0.03, -0.19, 0.01); p.bezierCurveTo(-0.15, 0.05, -0.06, 0.06, 0, 0.04); p.closePath(); g.fillStyle = hgrad(g, 0, -0.19, [[0, 'rgba(40,100,230,0.8)'], [0.55, 'rgba(255,215,40,0.85)'], [1, 'rgba(255,215,40,0.7)']]); g.fill(p); },
});

/* ---------------- Yellow tang ---------------- */
defSpecies('yellowtang', {
  name: 'Yellow tang', sci: 'Zebrasoma flavescens', fact: 'Grazes algae all day. At night its yellow dulls and a pale patch appears on its side.',
  len: 7.4, res: 280, box: [1.04, 1.18], tailBox: [0.24, 0.44], tailAt: [-0.47, 0], pecBox: [0.18, 0.14], pecAt: [0.16, 0.04], pecAng: 0.35,
  swim: { speed: 3.4, burst: 8, agility: 2.4, tailHz: 2.2, tailAmp: 0.45 }, behavior: 'picker', zone: [0.15, 0.95], z: [0.08, 0.7], count: 3,
  paintBody(g) {
    const body = new Path2D(); body.moveTo(0.5, 0.03); body.bezierCurveTo(0.44, -0.08, 0.36, -0.2, 0.2, -0.3); body.bezierCurveTo(0.0, -0.37, -0.3, -0.25, -0.5, -0.07); body.lineTo(-0.5, 0.07); body.bezierCurveTo(-0.3, 0.25, 0.0, 0.36, 0.2, 0.3); body.bezierCurveTo(0.36, 0.22, 0.44, 0.11, 0.5, 0.05); body.closePath();
    const dors = new Path2D(); dors.moveTo(0.25, -0.28); dors.bezierCurveTo(0.15, -0.5, -0.06, -0.58, -0.26, -0.46); dors.bezierCurveTo(-0.37, -0.37, -0.44, -0.22, -0.47, -0.09); dors.lineTo(0, -0.2); dors.closePath();
    const anal = new Path2D(); anal.moveTo(0.2, 0.28); anal.bezierCurveTo(0.12, 0.48, -0.06, 0.56, -0.26, 0.44); anal.bezierCurveTo(-0.37, 0.35, -0.44, 0.21, -0.47, 0.09); anal.lineTo(0, 0.2); anal.closePath();
    for (const f of [dors, anal]) { g.fillStyle = '#ffd000'; g.globalAlpha = 0.95; g.fill(f); g.globalAlpha = 1; rays(g, f, [0.3, 0], [-0.47, 0], [0.4, -0.7], [-0.7, -0.3], 22, 'rgba(160,110,0,0.35)', 0.004); rays(g, f, [0.3, 0], [-0.47, 0], [0.4, 0.7], [-0.7, 0.3], 22, 'rgba(160,110,0,0.35)', 0.004); rim(g, f, 'rgba(255,240,150,0.9)', 0.02, null); }
    g.fillStyle = vgrad(g, -0.34, 0.34, [[0, '#ffc400'], [0.5, '#ffd81f'], [1, '#ffe86a']]); g.fill(body);
    withClip(g, body, () => { g.strokeStyle = 'rgba(200,140,0,0.16)'; g.lineWidth = 0.008; for (let x = -0.4; x < 0.25; x += 0.028) { g.beginPath(); g.moveTo(x, -0.4); g.quadraticCurveTo(x + 0.04, 0, x, 0.4); g.stroke(); } });
    shade(g, body, -0.34, 0.34, { top: 0.16, sheen: 0.3, edge: 0.22 });
    gill(g, 0.2, -0.18, 0.18);
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(-0.42, 0, 0.035, 0.014, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 0.004; g.stroke();
    eye(g, 0.3, -0.1, 0.048, '#3a2a10', '#ffe25a');
    mouth(g, 0.5, 0.04, 0.025);
  },
  paintTail(g) { const p = new Path2D(); p.moveTo(0.005, -0.06); p.lineTo(-0.2, -0.2); p.bezierCurveTo(-0.16, -0.08, -0.16, 0.08, -0.2, 0.2); p.lineTo(0.005, 0.06); p.closePath(); fillP(g, p, '#ffd000', 0.95); rays(g, p, [0, -0.05], [0, 0.05], [-0.24, -0.24], [-0.24, 0.24], 12, 'rgba(160,110,0,0.35)', 0.004); rim(g, p, 'rgba(255,240,150,0.9)', 0.02, null); },
  paintPec: simplePec(0.16, 0.12, '#ffdc30', 0.7),
});

/* ---------------- Moorish idol ---------------- */
defSpecies('idol', {
  name: 'Moorish idol', sci: 'Zanclus cornutus', fact: 'The only living member of its family, Zanclidae. Its trailing dorsal streamer can outgrow its body.',
  len: 8.4, res: 300, box: [1.04, 1.5], tailBox: [0.24, 0.4], tailAt: [-0.47, 0], pecBox: [0.16, 0.12], pecAt: [0.12, 0.08], pecAng: 0.4,
  swim: { speed: 3.2, burst: 8, agility: 2, tailHz: 2, tailAmp: 0.45 }, behavior: 'picker', zone: [0.2, 0.9], z: [0.1, 0.65], count: 2,
  paintBody(g) {
    const body = new Path2D(); body.moveTo(0.5, 0.05); body.bezierCurveTo(0.45, 0.01, 0.38, -0.03, 0.3, -0.12); body.bezierCurveTo(0.24, -0.34, 0.05, -0.45, -0.1, -0.4); body.bezierCurveTo(-0.3, -0.3, -0.42, -0.14, -0.5, -0.05); body.lineTo(-0.5, 0.05); body.bezierCurveTo(-0.42, 0.14, -0.3, 0.3, -0.1, 0.38); body.bezierCurveTo(0.08, 0.42, 0.24, 0.3, 0.3, 0.14); body.bezierCurveTo(0.36, 0.09, 0.44, 0.08, 0.5, 0.07); body.closePath();
    const dors = new Path2D(); dors.moveTo(0.04, -0.42); dors.bezierCurveTo(0.0, -0.58, -0.05, -0.68, -0.09, -0.72); dors.bezierCurveTo(-0.17, -0.56, -0.34, -0.3, -0.46, -0.1); dors.lineTo(-0.1, -0.3); dors.closePath();
    const anal = new Path2D(); anal.moveTo(0.02, 0.38); anal.bezierCurveTo(-0.02, 0.5, -0.07, 0.58, -0.12, 0.62); anal.bezierCurveTo(-0.2, 0.48, -0.34, 0.28, -0.46, 0.1); anal.lineTo(-0.1, 0.3); anal.closePath();
    const all = new Path2D(); all.addPath(body); all.addPath(dors); all.addPath(anal);
    g.fillStyle = '#f5f0dc'; g.fill(dors); g.fill(anal);
    g.fillStyle = hgrad(g, 0.3, -0.5, [[0, '#f7f3e3'], [0.45, '#fff2c0'], [0.8, '#ffd84a'], [1, '#ffcc30']]); g.fill(body);
    withClip(g, all, () => {
      g.fillStyle = '#101012';
      g.fill(bandPath([0.3, 0.32, 0.27], [0.08, 0.12, 0.06], -0.9, 0.9));
      g.fill(bandPath([-0.2, -0.16, -0.22], [-0.34, -0.3, -0.36], -0.9, 0.9));
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(-0.4, -0.9, 0.03, 1.8);
      g.fillStyle = '#101012'; g.fillRect(-0.6, -0.9, 0.2, 1.8);
    });
    withClip(g, dors, () => rays(g, dors, [0.05, -0.4], [-0.45, -0.1], [-0.05, -0.9], [-0.6, -0.4], 18, 'rgba(0,0,0,0.25)', 0.004));
    shade(g, body, -0.42, 0.42, { top: 0.14, sheen: 0.28, edge: 0.22 });
    g.fillStyle = '#ff8a2a'; g.beginPath(); g.ellipse(0.36, -0.05, 0.06, 0.03, -0.4, 0, TAU); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 0.008; g.stroke();
    eye(g, 0.22, -0.13, 0.045, '#2a2a2a', '#ffe070');
    mouth(g, 0.5, 0.06, 0.02);
  },
  paintTail(g) { const p = new Path2D(); p.moveTo(0.005, -0.05); p.lineTo(-0.2, -0.17); p.bezierCurveTo(-0.17, -0.06, -0.17, 0.06, -0.2, 0.17); p.lineTo(0.005, 0.05); p.closePath(); fillP(g, p, '#101012', 0.95); rim(g, p, 'rgba(255,255,255,0.9)', 0.04, null); },
  paintPec: simplePec(0.14, 0.1, '#fff4d0', 0.5),
  extra(g, f, k) {
    // long white dorsal streamer trailing and swaying
    const t = f.age, x0 = -0.09 * k, y0 = -0.71 * k;
    const sway = Math.sin(t * 1.7 + f.seed) * 0.12, drag = clamp(f.speed / (U * 5), 0, 1);
    const x1 = x0 - k * (0.45 + 0.2 * drag), y1 = y0 - k * (0.1 - 0.06 * drag) + sway * k * 0.6;
    const x2 = x0 - k * (0.95 + 0.25 * drag), y2 = y0 + k * (0.1 + sway * 0.7);
    g.lineCap = 'round'; g.strokeStyle = 'rgba(250,248,235,0.95)';
    g.lineWidth = Math.max(0.8, k * 0.018); g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2); g.stroke();
    g.lineWidth = Math.max(0.5, k * 0.009); g.beginPath(); g.moveTo((x1 + x2) / 2, (y1 + y2) / 2); g.quadraticCurveTo(x2 + k * 0.1, y2 - k * 0.04, x2, y2); g.stroke();
  },
});

/* ---------------- Emperor angelfish ---------------- */
defSpecies('emperor', {
  name: 'Emperor angelfish', sci: 'Pomacanthus imperator', fact: 'Juveniles wear white rings on navy blue, then transform into these yellow-striped adults.',
  len: 10.5, res: 320, box: [1.04, 0.98], tailBox: [0.24, 0.46], tailAt: [-0.47, 0], pecBox: [0.2, 0.14], pecAt: [0.13, 0.06], pecAng: 0.3,
  swim: { speed: 3.3, burst: 8, agility: 1.8, tailHz: 1.9, tailAmp: 0.45 }, behavior: 'picker', zone: [0.25, 0.95], z: [0.05, 0.6], count: 1,
  paintBody(g) {
    const body = new Path2D(); body.moveTo(0.5, 0.05); body.bezierCurveTo(0.47, -0.1, 0.36, -0.26, 0.15, -0.3); body.bezierCurveTo(-0.1, -0.34, -0.36, -0.2, -0.5, -0.07); body.lineTo(-0.5, 0.07); body.bezierCurveTo(-0.36, 0.2, -0.1, 0.34, 0.15, 0.3); body.bezierCurveTo(0.36, 0.26, 0.47, 0.14, 0.5, 0.06); body.closePath();
    const dors = new Path2D(); dors.moveTo(0.12, -0.3); dors.bezierCurveTo(-0.05, -0.43, -0.3, -0.44, -0.44, -0.3); dors.bezierCurveTo(-0.5, -0.22, -0.49, -0.12, -0.47, -0.08); dors.lineTo(0, -0.2); dors.closePath();
    const anal = new Path2D(); anal.moveTo(0.06, 0.3); anal.bezierCurveTo(-0.08, 0.43, -0.3, 0.43, -0.44, 0.3); anal.bezierCurveTo(-0.5, 0.22, -0.49, 0.12, -0.47, 0.08); anal.lineTo(0, 0.2); anal.closePath();
    const striped = new Path2D(); striped.addPath(body); striped.addPath(dors);
    g.fillStyle = '#16225e'; g.fill(anal);
    withClip(g, anal, () => { g.strokeStyle = 'rgba(110,190,255,0.7)'; g.lineWidth = 0.012; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(-0.2, 0.18, 0.1 + i * 0.05, 0.05 + i * 0.045, 0, 0, Math.PI); g.stroke(); } });
    rim(g, anal, null, 0, 'rgba(120,200,255,0.9)', 0.012);
    g.fillStyle = '#ffd23a'; g.fill(striped);
    withClip(g, striped, () => {
      g.strokeStyle = '#2446c8'; g.lineWidth = 0.022;
      for (let y = -0.5; y < 0.5; y += 0.047) { g.beginPath(); g.moveTo(0.3, y + 0.02); g.bezierCurveTo(0.1, y - 0.03, -0.2, y + 0.02, -0.55, y + 0.1); g.stroke(); }
      g.fillStyle = '#16225e'; g.beginPath(); g.moveTo(0.2, -0.4); g.bezierCurveTo(0.08, -0.1, 0.08, 0.15, 0.16, 0.4); g.lineTo(0.08, 0.4); g.bezierCurveTo(0.0, 0.15, 0.0, -0.1, 0.1, -0.4); g.fill();
      g.fillStyle = '#bfe4ff'; g.fillRect(0.2, -0.5, 0.4, 1);
      g.fillStyle = '#0c1030'; g.beginPath(); g.moveTo(0.38, -0.32); g.bezierCurveTo(0.36, -0.1, 0.32, 0.05, 0.34, 0.32); g.lineTo(0.26, 0.32); g.bezierCurveTo(0.24, 0.05, 0.28, -0.1, 0.28, -0.32); g.fill();
      g.strokeStyle = '#7cc6ff'; g.lineWidth = 0.012; g.stroke();
      g.strokeStyle = 'rgba(80,140,230,0.5)'; g.lineWidth = 0.01; for (let y = -0.2; y < 0.2; y += 0.05) { g.beginPath(); g.moveTo(0.4, y); g.lineTo(0.52, y + 0.02); g.stroke(); }
    });
    rim(g, dors, null, 0, 'rgba(255,255,255,0.7)', 0.01);
    shade(g, body, -0.33, 0.33, { top: 0.16, sheen: 0.22 });
    eye(g, 0.33, -0.08, 0.048, '#1a1a2a');
    mouth(g, 0.5, 0.05, 0.03);
  },
  paintTail(g) { const p = roundTail(0.22, 0.44, 0.03); fillP(g, p, '#ffb11a', 0.97); rays(g, p, [0, -0.05], [0, 0.05], [-0.3, -0.3], [-0.3, 0.3], 14, 'rgba(160,80,0,0.3)', 0.004); },
  paintPec: simplePec(0.18, 0.13, '#2a3a8a', 0.7, 'rgba(255,210,60,0.8)'),
});

/* ---------------- Copperband butterflyfish ---------------- */
defSpecies('copperband', {
  name: 'Copperband butterflyfish', sci: 'Chelmon rostratus', fact: 'Its tweezer snout plucks worms from crevices; the false eyespot near its tail confuses predators.',
  len: 7.2, res: 280, box: [1.04, 1.02], tailBox: [0.22, 0.38], tailAt: [-0.47, 0], pecBox: [0.16, 0.12], pecAt: [0.12, 0.06], pecAng: 0.35,
  swim: { speed: 2.8, burst: 7, agility: 2.2, tailHz: 2.4, tailAmp: 0.45 }, behavior: 'picker', zone: [0.3, 0.97], z: [0.08, 0.55], count: 2,
  paintBody(g) {
    const body = new Path2D(); body.moveTo(0.5, 0.0); body.lineTo(0.3, -0.045); body.bezierCurveTo(0.24, -0.25, 0.05, -0.36, -0.12, -0.34); body.bezierCurveTo(-0.3, -0.3, -0.44, -0.15, -0.5, -0.05); body.lineTo(-0.5, 0.05); body.bezierCurveTo(-0.44, 0.15, -0.3, 0.3, -0.12, 0.33); body.bezierCurveTo(0.05, 0.35, 0.24, 0.22, 0.3, 0.035); body.lineTo(0.5, 0.018); body.closePath();
    const dors = new Path2D(); dors.moveTo(0.1, -0.33); dors.bezierCurveTo(-0.08, -0.46, -0.3, -0.5, -0.42, -0.32); dors.bezierCurveTo(-0.47, -0.22, -0.48, -0.12, -0.48, -0.06); dors.lineTo(-0.1, -0.2); dors.closePath();
    const anal = new Path2D(); anal.moveTo(0.02, 0.33); anal.bezierCurveTo(-0.12, 0.44, -0.32, 0.44, -0.42, 0.3); anal.bezierCurveTo(-0.47, 0.2, -0.48, 0.12, -0.48, 0.06); anal.lineTo(-0.1, 0.2); anal.closePath();
    const all = new Path2D(); all.addPath(body); all.addPath(dors); all.addPath(anal);
    g.fillStyle = '#f4f4ee'; g.fill(all);
    g.fillStyle = vgrad(g, -0.4, 0.4, [[0, 'rgba(200,210,215,0.6)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(210,220,225,0.4)']]); g.fill(all);
    withClip(g, all, () => {
      const bands = [[[0.27, 0.3, 0.26], [0.2, 0.22, 0.19]], [[0.09, 0.14, 0.07], [-0.01, 0.03, -0.03]], [[-0.15, -0.11, -0.17], [-0.25, -0.21, -0.27]], [[-0.35, -0.33, -0.37], [-0.43, -0.41, -0.45]]];
      for (const [fr, bk] of bands) { const b = bandPath(fr, bk, -0.7, 0.7); g.fillStyle = hgrad(g, fr[1], bk[1], [[0, '#f28a2c'], [0.5, '#e8701e'], [1, '#f28a2c']]); g.fill(b); rim(g, b, '#3a1f10', 0.018, null); }
      g.fillStyle = '#e8701e'; g.beginPath(); g.moveTo(0.3, -0.03); g.lineTo(0.5, -0.004); g.lineTo(0.5, 0.012); g.lineTo(0.3, 0.02); g.fill();
    });
    g.fillStyle = '#101010'; g.beginPath(); g.arc(-0.33, -0.32, 0.052, 0, TAU); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 0.012; g.stroke();
    rim(g, dors, null, 0, 'rgba(60,40,20,0.5)', 0.006); rim(g, anal, null, 0, 'rgba(60,40,20,0.5)', 0.006);
    shade(g, body, -0.35, 0.35, { top: 0.14, sheen: 0.3, edge: 0.2 });
    eye(g, 0.235, -0.1, 0.04, '#2a1a10');
  },
  paintTail(g) { const p = roundTail(0.2, 0.36, 0.02); fillP(g, p, 'rgba(235,240,245,0.55)'); withClip(g, p, () => { g.fillStyle = '#121212'; g.fillRect(-0.06, -0.3, 0.035, 0.6); g.fillStyle = '#ffffff'; g.fillRect(-0.025, -0.3, 0.02, 0.6); }); rays(g, p, [0, -0.05], [0, 0.05], [-0.26, -0.26], [-0.26, 0.26], 12, 'rgba(90,90,90,0.25)', 0.004); },
  paintPec: simplePec(0.14, 0.1, 'rgba(240,240,240,1)', 0.35),
});
