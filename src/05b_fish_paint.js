/* ---------------- Mandarinfish ---------------- */
defSpecies('mandarin', {
  name: 'Mandarinfish', sci: 'Synchiropus splendidus', fact: 'One of very few animals coloured by true blue pigment rather than light-scattering structures.',
  len: 4.6, res: 220, box: [1.04, 0.95], tailBox: [0.26, 0.4], tailAt: [-0.47, 0], pecBox: [0.26, 0.26], pecAt: [0.18, 0.05], pecAng: 0.2,
  swim: { speed: 1.2, burst: 3, agility: 3.5, tailHz: 2.2, tailAmp: 0.4, hop: true }, behavior: 'bottom', zone: [0.9, 1], z: [0.12, 0.3], count: 1,
  paintBody(g) {
    const body = new Path2D(); body.moveTo(0.5, 0.04); body.bezierCurveTo(0.48, -0.1, 0.35, -0.19, 0.15, -0.18); body.bezierCurveTo(-0.15, -0.17, -0.35, -0.1, -0.5, -0.05); body.lineTo(-0.5, 0.05); body.bezierCurveTo(-0.3, 0.12, -0.05, 0.2, 0.2, 0.19); body.bezierCurveTo(0.38, 0.18, 0.48, 0.12, 0.5, 0.06); body.closePath();
    const d1 = new Path2D(); d1.moveTo(0.14, -0.17); d1.bezierCurveTo(0.12, -0.36, 0.02, -0.46, -0.04, -0.42); d1.bezierCurveTo(-0.02, -0.3, -0.02, -0.2, -0.02, -0.16); d1.closePath();
    const d2 = new Path2D(); d2.moveTo(-0.06, -0.16); d2.bezierCurveTo(-0.12, -0.34, -0.36, -0.34, -0.47, -0.08); d2.lineTo(-0.3, -0.1); d2.closePath();
    const an = new Path2D(); an.moveTo(0.0, 0.18); an.bezierCurveTo(-0.08, 0.34, -0.36, 0.3, -0.47, 0.08); an.lineTo(-0.3, 0.1); an.closePath();
    const pv = new Path2D(); pv.moveTo(0.26, 0.17); pv.bezierCurveTo(0.26, 0.34, 0.12, 0.4, 0.04, 0.36); pv.lineTo(0.14, 0.16); pv.closePath();
    const swirl = (p, a, b) => withClip(g, p, () => {
      g.fillStyle = a; g.fill(p);
      for (let i = 0; i < 9; i++) { const y0 = -0.5 + i * 0.12; g.beginPath(); for (let x = -0.6; x <= 0.6; x += 0.02) { const y = y0 + Math.sin(x * 22 + i * 1.7) * 0.03 + Math.sin(x * 9 + i) * 0.02; x > -0.6 ? g.lineTo(x, y) : g.moveTo(x, y); } g.strokeStyle = '#1a2a88'; g.lineWidth = 0.05; g.stroke(); g.strokeStyle = b; g.lineWidth = 0.028; g.stroke(); }
    });
    for (const f of [d1, d2, an, pv]) { swirl(f, 'rgba(40,120,200,0.9)', '#ff7a1a'); rim(g, f, null, 0, 'rgba(120,230,255,0.9)', 0.012); }
    swirl(body, '#23a3b5', '#ff7d1f');
    withClip(g, body, () => { for (let i = 0; i < 16; i++) { const x = -0.4 + ((i * 53) % 90) / 100, y = -0.12 + ((i * 37) % 24) / 100; g.fillStyle = '#1a2a88'; g.beginPath(); g.arc(x, y, 0.028, 0, TAU); g.fill(); g.fillStyle = '#ffa030'; g.beginPath(); g.arc(x, y, 0.017, 0, TAU); g.fill(); } });
    shade(g, body, -0.19, 0.19, { top: 0.2, sheen: 0.3 });
    eye(g, 0.33, -0.08, 0.07, '#e04a1a');
    mouth(g, 0.5, 0.05, 0.04);
  },
  paintTail(g) { const p = roundTail(0.24, 0.38); withClip(g, p, () => { g.fillStyle = 'rgba(40,120,200,0.9)'; g.fill(p); g.strokeStyle = '#ff7a1a'; g.lineWidth = 0.02; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(0.05, 0, 0.06 + i * 0.045, Math.PI * 0.6, Math.PI * 1.4); g.stroke(); } }); rim(g, p, null, 0, 'rgba(120,230,255,0.9)', 0.012); },
  paintPec(g) { const p = new Path2D(); p.moveTo(0, -0.06); p.bezierCurveTo(-0.1, -0.2, -0.25, -0.12, -0.25, 0); p.bezierCurveTo(-0.24, 0.12, -0.1, 0.16, 0, 0.06); p.closePath(); fillP(g, p, '#ff9a3a', 0.45); rays(g, p, [0, -0.04], [0, 0.04], [-0.3, -0.2], [-0.3, 0.2], 10, 'rgba(255,120,20,0.5)', 0.006); },
});

/* ---------------- Red lionfish ---------------- */
defSpecies('lion', {
  name: 'Red lionfish', sci: 'Pterois volitans', fact: 'Its fin spines carry venom. Native to the Indo-Pacific, it has become invasive across the Caribbean.',
  len: 11, res: 320, box: [1.06, 1.45], tailBox: [0.3, 0.44], tailAt: [-0.47, 0], pecBox: [0.8, 0.95], pecAt: [0.16, 0.08], pecAng: 0.0,
  swim: { speed: 1.4, burst: 5, agility: 1.2, tailHz: 1.2, tailAmp: 0.35, pecHz: 0.6 }, behavior: 'hover', zone: [0.35, 0.95], z: [0.12, 0.5], count: 1,
  paintBody(g) {
    const body = new Path2D(); body.moveTo(0.5, 0.02); body.bezierCurveTo(0.46, -0.12, 0.3, -0.2, 0.1, -0.19); body.bezierCurveTo(-0.15, -0.18, -0.35, -0.1, -0.5, -0.05); body.lineTo(-0.5, 0.05); body.bezierCurveTo(-0.3, 0.12, -0.1, 0.19, 0.12, 0.19); body.bezierCurveTo(0.32, 0.19, 0.46, 0.12, 0.5, 0.04); body.closePath();
    const soft = new Path2D(); soft.moveTo(-0.14, -0.17); soft.bezierCurveTo(-0.2, -0.36, -0.4, -0.34, -0.47, -0.07); soft.lineTo(-0.3, -0.1); soft.closePath();
    const an = new Path2D(); an.moveTo(-0.1, 0.16); an.bezierCurveTo(-0.16, 0.36, -0.38, 0.34, -0.47, 0.07); an.lineTo(-0.3, 0.1); an.closePath();
    for (const f of [soft, an]) { fillP(g, f, 'rgba(250,235,220,0.45)'); withClip(g, f, () => { for (let i = 0; i < 40; i++) { g.fillStyle = i % 3 ? 'rgba(120,30,20,0.7)' : 'rgba(30,20,20,0.6)'; g.beginPath(); g.arc(-0.1 - ((i * 37) % 38) / 100, (f === an ? 0.1 : -0.3) + ((i * 53) % 24) / 100, 0.012, 0, TAU); g.fill(); } }); }
    // venomous dorsal spines with membranes
    const n = 13;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), bx = lerp(0.24, -0.14, t), by = -0.19 + t * 0.02, len = lerp(0.46, 0.34, Math.abs(t - 0.35) * 1.4), a = -Math.PI / 2 - lerp(0.25, 0.55, t);
      const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
      if (i < n - 1) { const t2 = (i + 1) / (n - 1), bx2 = lerp(0.24, -0.14, t2); g.fillStyle = 'rgba(245,225,210,0.28)'; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + (ex - bx) * 0.55, by + (ey - by) * 0.55); g.lineTo(bx2, by + 0.01); g.fill(); }
      for (let s = 0; s < 6; s++) { g.strokeStyle = s % 2 ? '#f6ead8' : '#8c2416'; g.lineWidth = 0.011 * (1 - s * 0.1); g.lineCap = 'round'; g.beginPath(); g.moveTo(lerp(bx, ex, s / 6), lerp(by, ey, s / 6)); g.lineTo(lerp(bx, ex, (s + 1) / 6), lerp(by, ey, (s + 1) / 6)); g.stroke(); }
    }
    g.fillStyle = '#f2e3cf'; g.fill(body);
    withClip(g, body, () => {
      const xs = [0.42, 0.34, 0.25, 0.16, 0.07, -0.02, -0.1, -0.18, -0.26, -0.33, -0.4, -0.46];
      xs.forEach((x, i) => { g.fillStyle = i % 3 === 2 ? '#5a1a10' : '#9a2c18'; const w = i % 3 === 2 ? 0.025 : 0.042; g.beginPath(); g.moveTo(x, -0.3); g.quadraticCurveTo(x + 0.05, 0, x - 0.01, 0.3); g.lineTo(x - 0.01 - w, 0.3); g.quadraticCurveTo(x + 0.05 - w, 0, x - w, -0.3); g.fill(); });
    });
    shade(g, body, -0.2, 0.2, { top: 0.25, sheen: 0.22 });
    for (let k = 0; k < 2; k++) { g.strokeStyle = '#f0e2cc'; g.lineWidth = 0.012; g.beginPath(); g.moveTo(0.36 - k * 0.04, -0.14); g.quadraticCurveTo(0.4 - k * 0.05, -0.26, 0.34 - k * 0.07, -0.3); g.stroke(); }
    g.strokeStyle = '#f0e2cc'; g.lineWidth = 0.01; g.beginPath(); g.moveTo(0.46, 0.06); g.quadraticCurveTo(0.5, 0.12, 0.47, 0.16); g.stroke();
    eye(g, 0.36, -0.07, 0.045, '#b03a1a', '#3a1008');
    mouth(g, 0.5, 0.03, 0.05);
  },
  paintTail(g) { const p = roundTail(0.28, 0.42); fillP(g, p, 'rgba(250,235,220,0.4)'); withClip(g, p, () => { for (let i = 0; i < 36; i++) { g.fillStyle = 'rgba(110,30,20,0.7)'; g.beginPath(); g.arc(-0.03 - ((i * 29) % 25) / 100, -0.18 + ((i * 47) % 36) / 100, 0.012, 0, TAU); g.fill(); } }); },
  paintPec(g) {
    const n = 14, pts = [];
    for (let i = 0; i < n; i++) { const a = Math.PI + lerp(-0.85, 0.75, i / (n - 1)), l = 0.72 * (0.85 + 0.15 * Math.sin((i / (n - 1)) * Math.PI)); pts.push([Math.cos(a) * l, Math.sin(a) * l]); }
    g.fillStyle = 'rgba(245,225,210,0.26)'; g.beginPath(); g.moveTo(0, 0); for (let i = 0; i < n; i++) { const p = pts[i], q = pts[Math.max(0, i - 1)]; i ? g.quadraticCurveTo((p[0] + q[0]) * 0.42, (p[1] + q[1]) * 0.42, p[0], p[1]) : g.lineTo(p[0], p[1]); } g.closePath(); g.fill();
    g.lineCap = 'round';
    for (const [x, y] of pts) for (let s = 0; s < 7; s++) { g.strokeStyle = s % 2 ? '#f5e8d6' : '#922815'; g.lineWidth = 0.012; g.beginPath(); g.moveTo(x * s / 7, y * s / 7); g.lineTo(x * (s + 1) / 7, y * (s + 1) / 7); g.stroke(); }
  },
});

/* ---------------- Porcupinefish ---------------- */
defSpecies('porcupine', {
  name: 'Long-spine porcupinefish', sci: 'Diodon holocanthus', fact: 'When threatened it gulps water, swelling into a ball bristling with spines.',
  len: 8.2, res: 300, box: [1.04, 0.72], tailBox: [0.2, 0.34], tailAt: [-0.47, 0], pecBox: [0.16, 0.16], pecAt: [0.15, 0.02], pecAng: 0.1,
  swim: { speed: 1.6, burst: 4, agility: 1.6, tailHz: 1.8, tailAmp: 0.4, pecHz: 5 }, behavior: 'hover', zone: [0.3, 0.95], z: [0.1, 0.5], count: 1,
  paintBody(g) {
    const body = new Path2D(); body.moveTo(0.5, 0.04); body.bezierCurveTo(0.5, -0.18, 0.3, -0.27, 0.05, -0.26); body.bezierCurveTo(-0.2, -0.25, -0.38, -0.14, -0.5, -0.05); body.lineTo(-0.5, 0.05); body.bezierCurveTo(-0.38, 0.16, -0.2, 0.28, 0.05, 0.28); body.bezierCurveTo(0.3, 0.28, 0.5, 0.2, 0.5, 0.06); body.closePath();
    const dors = new Path2D(); dors.moveTo(-0.3, -0.16); dors.bezierCurveTo(-0.34, -0.3, -0.44, -0.28, -0.47, -0.06); dors.closePath();
    const an = new Path2D(); an.moveTo(-0.3, 0.17); an.bezierCurveTo(-0.34, 0.3, -0.44, 0.28, -0.47, 0.06); an.closePath();
    fillP(g, dors, 'rgba(200,180,140,0.7)'); fillP(g, an, 'rgba(200,180,140,0.7)');
    g.fillStyle = vgrad(g, -0.27, 0.28, [[0, '#a88a58'], [0.5, '#cdb688'], [0.62, '#efe5cc'], [1, '#faf5e6']]); g.fill(body);
    withClip(g, body, () => {
      g.fillStyle = 'rgba(70,48,24,0.7)';
      for (const [x, w] of [[0.18, 0.1], [-0.05, 0.12], [-0.3, 0.1]]) { g.beginPath(); g.ellipse(x, -0.2, w, 0.1, 0, 0, TAU); g.fill(); }
      for (let i = 0; i < 70; i++) { const x = -0.45 + ((i * 41) % 90) / 100, y = -0.22 + ((i * 29) % 30) / 100; g.fillStyle = 'rgba(40,28,14,0.75)'; g.beginPath(); g.arc(x, y, 0.009, 0, TAU); g.fill(); }
      g.strokeStyle = 'rgba(60,40,20,0.45)'; g.lineWidth = 0.008; g.lineCap = 'round';
      for (let i = 0; i < 55; i++) { const x = -0.4 + ((i * 37) % 85) / 100, y = -0.22 + ((i * 53) % 44) / 100; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 0.05, y + 0.005); g.stroke(); }
    });
    shade(g, body, -0.27, 0.28, { top: 0.18, sheen: 0.3 });
    g.fillStyle = '#f4f0e0'; g.beginPath(); g.ellipse(0.48, 0.05, 0.03, 0.04, 0, 0, TAU); g.fill();
    eye(g, 0.28, -0.08, 0.085, '#8fae3a', '#2a2210');
  },
  paintTail(g) { const p = roundTail(0.18, 0.32); fillP(g, p, 'rgba(210,190,150,0.8)'); withClip(g, p, () => { for (let i = 0; i < 16; i++) { g.fillStyle = 'rgba(50,34,18,0.7)'; g.beginPath(); g.arc(-0.03 - ((i * 29) % 15) / 100, -0.12 + ((i * 47) % 24) / 100, 0.01, 0, TAU); g.fill(); } }); },
  paintPec: simplePec(0.14, 0.14, 'rgba(230,210,170,1)', 0.55),
  paintInflated(g) {
    const R = 0.4;
    g.strokeStyle = '#5a4630'; g.lineCap = 'round';
    for (let i = 0; i < 70; i++) { const a = (i / 70) * TAU + (i % 2) * 0.04, l = R * 1.32; g.lineWidth = 0.012; g.beginPath(); g.moveTo(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9); g.lineTo(Math.cos(a) * l, Math.sin(a) * l); g.stroke(); }
    const gr = g.createRadialGradient(-0.1, -0.12, 0.02, 0, 0, R);
    gr.addColorStop(0, '#fbf6e8'); gr.addColorStop(0.55, '#d8c294'); gr.addColorStop(1, '#8e7248');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
    g.fillStyle = 'rgba(70,48,24,0.55)'; for (const [x, y] of [[0.05, -0.28], [-0.2, -0.22], [0.25, -0.18]]) { g.beginPath(); g.ellipse(x, y, 0.1, 0.07, 0, 0, TAU); g.fill(); }
    for (let i = 0; i < 60; i++) { const a = i * 2.4, r = Math.sqrt((i + 0.5) / 60) * R * 0.9; g.fillStyle = 'rgba(40,28,14,0.7)'; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, 0.008, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(-0.1, -0.2, 0.14, 0.07, -0.4, 0, TAU); g.fill();
    eye(g, 0.2, -0.1, 0.07, '#8fae3a', '#2a2210');
    g.fillStyle = '#f4f0e0'; g.beginPath(); g.ellipse(0.38, 0.06, 0.03, 0.04, 0, 0, TAU); g.fill();
  },
});

/* ---------------- Royal gramma ---------------- */
defSpecies('gramma', {
  name: 'Royal gramma', sci: 'Gramma loreto', fact: 'Under ledges it swims belly-to-the-rock — even upside down.',
  len: 4.2, res: 200, box: [1.04, 0.66], tailBox: [0.24, 0.34], tailAt: [-0.47, 0], pecBox: [0.14, 0.1], pecAt: [0.18, 0.04], pecAng: 0.3,
  swim: { speed: 2, burst: 6, agility: 3.5, tailHz: 3.2, tailAmp: 0.5 }, behavior: 'picker', zone: [0.72, 1], z: [0.15, 0.4], count: 2,
  paintBody(g) {
    const body = new Path2D(); body.moveTo(0.5, 0.02); body.bezierCurveTo(0.45, -0.1, 0.3, -0.15, 0.1, -0.15); body.bezierCurveTo(-0.15, -0.15, -0.35, -0.1, -0.5, -0.05); body.lineTo(-0.5, 0.05); body.bezierCurveTo(-0.35, 0.1, -0.15, 0.15, 0.1, 0.15); body.bezierCurveTo(0.3, 0.15, 0.45, 0.1, 0.5, 0.03); body.closePath();
    const dors = new Path2D(); dors.moveTo(0.2, -0.14); dors.bezierCurveTo(0.1, -0.27, -0.3, -0.27, -0.46, -0.07); dors.lineTo(0, -0.1); dors.closePath();
    const an = new Path2D(); an.moveTo(0.0, 0.14); an.bezierCurveTo(-0.1, 0.26, -0.34, 0.25, -0.46, 0.07); an.lineTo(0, 0.1); an.closePath();
    const col = hgrad(g, 0.5, -0.5, [[0, '#b640e0'], [0.44, '#a236d6'], [0.56, '#ffc21a'], [1, '#ffd21a']]);
    g.globalAlpha = 0.95; g.fillStyle = col; g.fill(dors); g.fill(an); g.globalAlpha = 1;
    g.fillStyle = '#121212'; g.beginPath(); g.arc(0.1, -0.2, 0.035, 0, TAU); g.fill();
    g.fillStyle = col; g.fill(body);
    shade(g, body, -0.16, 0.16, { top: 0.22, sheen: 0.3 });
    g.strokeStyle = '#1a0a20'; g.lineWidth = 0.012; g.beginPath(); g.moveTo(0.5, -0.02); g.lineTo(0.3, -0.06); g.stroke();
    eye(g, 0.36, -0.045, 0.045, '#e0b020');
  },
  paintTail(g) { const p = roundTail(0.22, 0.32, 0.04); fillP(g, p, '#ffd21a', 0.95); rays(g, p, [0, -0.05], [0, 0.05], [-0.3, -0.24], [-0.3, 0.24], 10, 'rgba(160,110,0,0.3)', 0.004); },
  paintPec: simplePec(0.12, 0.09, '#d070f0', 0.5),
});

/* ---------------- Steephead parrotfish ---------------- */
defSpecies('parrot', {
  name: 'Steephead parrotfish', sci: 'Chlorurus microrhinos', fact: 'Crunches coral with a fused beak — much of a reef’s white sand has passed through parrotfish. Some sleep in a mucus bubble.',
  len: 13.5, res: 360, box: [1.04, 0.74], tailBox: [0.34, 0.52], tailAt: [-0.47, 0], pecBox: [0.2, 0.14], pecAt: [0.2, 0.05], pecAng: 0.3,
  swim: { speed: 3.6, burst: 8, agility: 1.5, tailHz: 1.6, tailAmp: 0.4, pecHz: 2.2 }, behavior: 'picker', zone: [0.35, 0.97], z: [0.1, 0.6], count: 1,
  paintBody(g) {
    const body = new Path2D(); body.moveTo(0.5, 0.06); body.bezierCurveTo(0.5, -0.12, 0.38, -0.22, 0.15, -0.225); body.bezierCurveTo(-0.15, -0.22, -0.38, -0.13, -0.5, -0.06); body.lineTo(-0.5, 0.06); body.bezierCurveTo(-0.38, 0.13, -0.15, 0.21, 0.15, 0.21); body.bezierCurveTo(0.38, 0.2, 0.48, 0.16, 0.5, 0.08); body.closePath();
    const dors = new Path2D(); dors.moveTo(0.26, -0.2); dors.bezierCurveTo(0.1, -0.29, -0.3, -0.26, -0.46, -0.1); dors.lineTo(0, -0.15); dors.closePath();
    const an = new Path2D(); an.moveTo(0.0, 0.2); an.bezierCurveTo(-0.12, 0.28, -0.36, 0.24, -0.46, 0.1); an.lineTo(0, 0.15); an.closePath();
    for (const f of [dors, an]) { fillP(g, f, '#ff8fa8', 0.9); withClip(g, f, () => { g.strokeStyle = '#2aa6d8'; g.lineWidth = 0.03; g.stroke(f); g.strokeStyle = 'rgba(40,160,200,0.8)'; g.lineWidth = 0.012; g.beginPath(); g.moveTo(0.26, f === an ? 0.22 : -0.22); g.bezierCurveTo(0.1, f === an ? 0.24 : -0.24, -0.3, f === an ? 0.2 : -0.2, -0.46, f === an ? 0.1 : -0.1); g.stroke(); }); }
    g.fillStyle = vgrad(g, -0.23, 0.22, [[0, '#1f8f9e'], [0.5, '#2fc2a6'], [1, '#7ee0b8']]); g.fill(body);
    scales(g, body, 0.075, -0.24, 0.24, 'rgba(10,70,90,0.55)', 'rgba(255,170,190,0.45)');
    withClip(g, body, () => {
      g.fillStyle = 'rgba(255,150,170,0.35)'; g.beginPath(); g.ellipse(0.35, 0.08, 0.1, 0.09, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,140,170,0.8)'; g.lineWidth = 0.012; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(0.46, 0.02 + k * 0.04); g.quadraticCurveTo(0.36, 0.0 + k * 0.05, 0.26, 0.03 + k * 0.06); g.stroke(); }
    });
    shade(g, body, -0.23, 0.22, { top: 0.25, sheen: 0.22 });
    g.fillStyle = '#d7f4f0'; g.beginPath(); g.moveTo(0.5, 0.03); g.quadraticCurveTo(0.53, 0.07, 0.49, 0.11); g.quadraticCurveTo(0.46, 0.07, 0.5, 0.03); g.fill();
    g.strokeStyle = 'rgba(0,60,70,0.6)'; g.lineWidth = 0.008; g.beginPath(); g.moveTo(0.48, 0.07); g.lineTo(0.515, 0.07); g.stroke();
    gill(g, 0.22, -0.13, 0.14, 0.06);
    eye(g, 0.36, -0.08, 0.04, '#e0a020');
  },
  paintTail(g) { const p = forkTail(0.32, 0.5, 0.22, 1.05); fillP(g, p, '#2fb6a6', 0.95); withClip(g, p, () => { g.fillStyle = '#ff8fa8'; g.beginPath(); g.ellipse(-0.12, 0, 0.09, 0.14, 0, 0, TAU); g.fill(); }); rim(g, p, '#2a86d8', 0.03, null); rays(g, p, [0, -0.05], [0, 0.05], [-0.4, -0.3], [-0.4, 0.3], 12, 'rgba(0,60,70,0.25)', 0.004); },
  paintPec: simplePec(0.18, 0.12, '#80e0ff', 0.55, 'rgba(255,150,180,0.6)'),
});

/* ---------------- Anthias (schooling) ---------------- */
function anthiasPaint(c1, c2, male) {
  return {
    paintBody(g) {
      const body = new Path2D(); body.moveTo(0.5, 0.02); body.bezierCurveTo(0.46, -0.11, 0.3, -0.17, 0.1, -0.17); body.bezierCurveTo(-0.15, -0.17, -0.35, -0.1, -0.5, -0.05); body.lineTo(-0.5, 0.05); body.bezierCurveTo(-0.35, 0.1, -0.15, 0.16, 0.1, 0.16); body.bezierCurveTo(0.3, 0.16, 0.46, 0.1, 0.5, 0.03); body.closePath();
      const dors = new Path2D(); dors.moveTo(0.2, -0.16); dors.bezierCurveTo(0.1, -0.26, -0.3, -0.25, -0.46, -0.07); dors.lineTo(0, -0.1); dors.closePath();
      const an = new Path2D(); an.moveTo(0.0, 0.15); an.bezierCurveTo(-0.1, 0.26, -0.34, 0.24, -0.46, 0.07); an.lineTo(0, 0.1); an.closePath();
      fillP(g, dors, c1, 0.85); fillP(g, an, c1, 0.85);
      if (male) { g.strokeStyle = '#ff4aa8'; g.lineWidth = 0.014; g.lineCap = 'round'; g.beginPath(); g.moveTo(0.14, -0.18); g.quadraticCurveTo(0.08, -0.36, -0.02, -0.42); g.stroke(); g.fillStyle = '#e02a6a'; g.beginPath(); g.ellipse(0.1, 0.02, 0.05, 0.035, 0, 0, TAU); g.fill(); }
      g.fillStyle = vgrad(g, -0.17, 0.16, [[0, c2], [0.55, c1], [1, shadeHex(c1, 0.35, '#ffffff')]]); g.fill(body);
      shade(g, body, -0.17, 0.16, { top: 0.15, sheen: 0.35 });
      g.strokeStyle = 'rgba(150,80,220,0.9)'; g.lineWidth = 0.014; g.beginPath(); g.moveTo(0.4, -0.02); g.quadraticCurveTo(0.3, 0.05, 0.18, 0.06); g.stroke();
      eye(g, 0.36, -0.05, 0.05, '#d06a20');
    },
    paintTail(g) { const p = forkTail(0.3, 0.44, 0.45, 1.1); fillP(g, p, c1, 0.9); rim(g, p, male ? '#b01a6a' : '#ff5a2a', 0.02, null); },
    paintPec: simplePec(0.12, 0.09, c1, 0.55),
  };
}
defSpecies('anthias', { name: 'Sea goldie', sci: 'Pseudanthias squamipinnis', fact: 'Lives in harems. If the male dies, the largest female changes sex and takes his place.',
  len: 4.3, res: 180, box: [1.04, 0.62], tailBox: [0.32, 0.46], tailAt: [-0.47, 0], pecBox: [0.12, 0.1], pecAt: [0.18, 0.04], pecAng: 0.3,
  swim: { speed: 3.6, burst: 9, agility: 3, tailHz: 3.4, tailAmp: 0.5 }, behavior: 'school', zone: [0.35, 0.9], z: [0.25, 0.55], count: 22, ...anthiasPaint('#ff9a2a', '#ff7a1a', false) });
defSpecies('anthiasM', { name: 'Sea goldie (male)', sci: 'Pseudanthias squamipinnis', fact: 'Males are magenta with a long third dorsal spine; each guards a harem of orange females.',
  len: 4.9, res: 180, box: [1.04, 0.9], tailBox: [0.34, 0.5], tailAt: [-0.47, 0], pecBox: [0.12, 0.1], pecAt: [0.18, 0.04], pecAng: 0.3,
  swim: { speed: 3.6, burst: 9, agility: 3, tailHz: 3.4, tailAmp: 0.5 }, behavior: 'school', zone: [0.35, 0.9], z: [0.25, 0.55], count: 3, ...anthiasPaint('#e8409a', '#a02a8a', true) });

/* ---------------- Blue-green chromis ---------------- */
defSpecies('chromis', { name: 'Blue-green chromis', sci: 'Chromis viridis', fact: 'Shoals hover above branching coral and dive into it at the first sign of danger.',
  len: 3.8, res: 150, box: [1.04, 0.66], tailBox: [0.3, 0.44], tailAt: [-0.47, 0], pecBox: [0.12, 0.1], pecAt: [0.18, 0.04], pecAng: 0.3,
  swim: { speed: 3.2, burst: 8, agility: 3, tailHz: 3.6, tailAmp: 0.5 }, behavior: 'school', zone: [0.3, 0.85], z: [0.55, 0.9], count: 26,
  paintBody(g) {
    const body = new Path2D(); body.moveTo(0.5, 0.02); body.bezierCurveTo(0.46, -0.14, 0.3, -0.21, 0.1, -0.21); body.bezierCurveTo(-0.15, -0.2, -0.35, -0.12, -0.5, -0.05); body.lineTo(-0.5, 0.05); body.bezierCurveTo(-0.35, 0.12, -0.15, 0.19, 0.1, 0.19); body.bezierCurveTo(0.3, 0.19, 0.46, 0.12, 0.5, 0.03); body.closePath();
    const dors = new Path2D(); dors.moveTo(0.2, -0.2); dors.bezierCurveTo(0.1, -0.3, -0.3, -0.3, -0.46, -0.07); dors.lineTo(0, -0.1); dors.closePath();
    const an = new Path2D(); an.moveTo(0.0, 0.18); an.bezierCurveTo(-0.1, 0.3, -0.34, 0.28, -0.46, 0.07); an.lineTo(0, 0.1); an.closePath();
    fillP(g, dors, '#8fe8d8', 0.6); fillP(g, an, '#8fe8d8', 0.6);
    g.fillStyle = vgrad(g, -0.21, 0.19, [[0, '#4fc6c8'], [0.5, '#8ff0dc'], [1, '#d6fff2']]); g.fill(body);
    shade(g, body, -0.21, 0.19, { top: 0.12, sheen: 0.45 });
    eye(g, 0.34, -0.05, 0.055, '#6a8a8a');
  },
  paintTail(g) { const p = forkTail(0.28, 0.42, 0.5, 1.05); fillP(g, p, '#9ff0e0', 0.7); },
  paintPec: simplePec(0.12, 0.09, '#bff8ea', 0.4) });

/* ---------------- Yellow boxfish ---------------- */
defSpecies('boxfish', { name: 'Yellow boxfish', sci: 'Ostracion cubicus', fact: 'Armoured in a bony box, it sculls with its small fins. Stressed boxfish can release a toxin into the water.',
  len: 5.2, res: 220, box: [1.04, 0.66], tailBox: [0.22, 0.36], tailAt: [-0.44, 0], pecBox: [0.12, 0.1], pecAt: [0.16, 0.04], pecAng: 0.1,
  swim: { speed: 1.4, burst: 3.5, agility: 2.2, tailHz: 4.5, tailAmp: 0.3, pecHz: 9 }, behavior: 'hover', zone: [0.4, 0.95], z: [0.1, 0.45], count: 1,
  paintBody(g) {
    const body = new Path2D(); body.moveTo(0.5, 0.0); body.bezierCurveTo(0.5, -0.2, 0.4, -0.25, 0.2, -0.25); body.lineTo(-0.3, -0.21); body.bezierCurveTo(-0.42, -0.2, -0.46, -0.1, -0.46, -0.05); body.lineTo(-0.46, 0.05); body.bezierCurveTo(-0.46, 0.12, -0.42, 0.22, -0.3, 0.23); body.lineTo(0.2, 0.25); body.bezierCurveTo(0.4, 0.25, 0.5, 0.18, 0.5, 0.0); body.closePath();
    const dors = new Path2D(); dors.moveTo(-0.2, -0.2); dors.bezierCurveTo(-0.24, -0.3, -0.34, -0.3, -0.36, -0.2); dors.closePath();
    const an = new Path2D(); an.moveTo(-0.2, 0.22); an.bezierCurveTo(-0.24, 0.32, -0.34, 0.32, -0.36, 0.22); an.closePath();
    fillP(g, dors, '#ffd21a', 0.7); fillP(g, an, '#ffd21a', 0.7);
    g.fillStyle = vgrad(g, -0.25, 0.25, [[0, '#f0b800'], [0.5, '#ffd81f'], [1, '#fff08a']]); g.fill(body);
    withClip(g, body, () => {
      g.strokeStyle = 'rgba(160,110,0,0.35)'; g.lineWidth = 0.006;
      for (let x = -0.45; x < 0.5; x += 0.07) for (let y = -0.25; y < 0.26; y += 0.07) { g.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; const px = x + Math.cos(a) * 0.04, py = y + Math.sin(a) * 0.04; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); g.stroke(); }
      for (let x = -0.42; x < 0.44; x += 0.07) for (let y = -0.21; y < 0.23; y += 0.07) { g.fillStyle = '#141414'; g.beginPath(); g.arc(x, y, 0.016, 0, TAU); g.fill(); }
    });
    shade(g, body, -0.25, 0.25, { top: 0.14, sheen: 0.35, edge: 0.25 });
    g.fillStyle = '#ffec8a'; g.beginPath(); g.ellipse(0.47, 0.06, 0.03, 0.035, 0, 0, TAU); g.fill();
    eye(g, 0.3, -0.12, 0.06, '#3a3a2a', '#f0c000');
  },
  paintTail(g) { const p = roundTail(0.2, 0.34); fillP(g, p, '#ffd21a', 0.8); rays(g, p, [0, -0.04], [0, 0.04], [-0.26, -0.24], [-0.26, 0.24], 10, 'rgba(160,110,0,0.35)', 0.004); },
  paintPec: simplePec(0.1, 0.09, '#fff0a0', 0.5) });

/* ---------------- Seahorse (painted upright; origin at tail grip) ---------------- */
const SEAHORSE = { name: 'Yellow seahorse', sci: 'Hippocampus kuda', fact: 'The male carries the eggs in a brood pouch and gives birth to the young.' };
function paintSeahorse(g) {
  const col = '#f0b030', dark = '#a8661a';
  const tail = [[-0.02, -0.36], [-0.045, -0.26], [-0.035, -0.15], [0.0, -0.07], [0.05, -0.03], [0.075, 0.02], [0.05, 0.065], [0.0, 0.055], [-0.015, 0.01], [0.01, -0.01]];
  const wd = (i) => lerp(0.07, 0.022, i / (tail.length - 1));
  g.beginPath();
  for (let i = 0; i < tail.length; i++) { const p = tail[i], q = tail[Math.min(i + 1, tail.length - 1)], r = tail[Math.max(i - 1, 0)]; const a = Math.atan2(q[1] - r[1], q[0] - r[0]); const nx = -Math.sin(a), ny = Math.cos(a); i ? g.lineTo(p[0] + nx * wd(i) / 2, p[1] + ny * wd(i) / 2) : g.moveTo(p[0] + nx * wd(i) / 2, p[1] + ny * wd(i) / 2); }
  for (let i = tail.length - 1; i >= 0; i--) { const p = tail[i], q = tail[Math.min(i + 1, tail.length - 1)], r = tail[Math.max(i - 1, 0)]; const a = Math.atan2(q[1] - r[1], q[0] - r[0]); const nx = -Math.sin(a), ny = Math.cos(a); g.lineTo(p[0] - nx * wd(i) / 2, p[1] - ny * wd(i) / 2); }
  g.closePath(); g.fillStyle = hgrad(g, -0.08, 0.08, [[0, dark], [0.6, col], [1, shadeHex(col, 0.2)]]); g.fill();
  const b = new Path2D();
  b.moveTo(0.0, -0.36); b.bezierCurveTo(0.2, -0.42, 0.2, -0.62, 0.06, -0.74); b.bezierCurveTo(0.1, -0.8, 0.14, -0.84, 0.2, -0.853); b.lineTo(0.33, -0.86); b.lineTo(0.335, -0.9); b.lineTo(0.18, -0.905);
  b.bezierCurveTo(0.12, -0.93, 0.1, -0.99, 0.045, -1.02); b.lineTo(0.02, -1.07); b.lineTo(-0.005, -1.03); b.lineTo(-0.03, -1.05); b.lineTo(-0.045, -1.0);
  b.bezierCurveTo(-0.1, -0.97, -0.1, -0.9, -0.06, -0.86); b.bezierCurveTo(-0.15, -0.8, -0.17, -0.6, -0.1, -0.45); b.bezierCurveTo(-0.08, -0.4, -0.06, -0.37, -0.05, -0.34); b.closePath();
  g.fillStyle = hgrad(g, -0.16, 0.2, [[0, dark], [0.45, col], [1, shadeHex(col, 0.25, '#fff4c0')]]); g.fill(b);
  withClip(g, b, () => {
    g.strokeStyle = 'rgba(120,60,10,0.45)'; g.lineWidth = 0.008;
    for (let y = -0.72; y < -0.36; y += 0.045) { g.beginPath(); g.moveTo(-0.2, y); g.quadraticCurveTo(0.0, y + 0.03, 0.2, y - 0.01); g.stroke(); }
    for (let i = 0; i < 30; i++) { g.fillStyle = i % 2 ? 'rgba(255,245,210,0.7)' : 'rgba(120,60,10,0.5)'; g.beginPath(); g.arc(-0.1 + ((i * 37) % 26) / 100, -0.95 + ((i * 53) % 58) / 100, 0.008, 0, TAU); g.fill(); }
  });
  g.strokeStyle = 'rgba(120,60,10,0.5)'; g.lineWidth = 0.007;
  for (let i = 1; i < tail.length - 3; i++) { const [x, y] = tail[i]; g.beginPath(); g.moveTo(x - 0.035, y - 0.004); g.lineTo(x + 0.035, y + 0.004); g.stroke(); }
  eye(g, 0.075, -0.905, 0.028, '#8a5a10');
}
function paintSeahorseFin(g) { const p = new Path2D(); p.moveTo(0, -0.05); p.bezierCurveTo(-0.07, -0.07, -0.12, -0.02, -0.12, 0.02); p.bezierCurveTo(-0.1, 0.06, -0.05, 0.06, 0, 0.05); p.closePath(); fillP(g, p, 'rgba(255,230,160,1)', 0.55); rays(g, p, [0, -0.04], [0, 0.04], [-0.14, -0.06], [-0.14, 0.07], 9, 'rgba(160,100,20,0.4)', 0.004); }

/* ---------------- build all sprites ---------------- */
function buildSpecies() {
  for (const sp of Object.values(SPECIES)) {
    if (sp.bodySpr) continue;
    const L = sp.res;
    sp.bodySpr = new Sprite(sp.box[0] * L, sp.box[1] * L, (g, w, h) => { g.setTransform(L, 0, 0, L, w / 2, h / 2); sp.paintBody(g); });
    sp.tailSpr = new Sprite(sp.tailBox[0] * L, sp.tailBox[1] * L, (g, w, h) => { g.setTransform(L, 0, 0, L, w, h / 2); sp.paintTail(g); }, 1, 0.5);
    if (sp.paintPec) sp.pecSpr = new Sprite(sp.pecBox[0] * L, sp.pecBox[1] * L, (g, w, h) => { g.setTransform(L, 0, 0, L, w, h / 2); sp.paintPec(g); }, 1, 0.5);
    if (sp.paintInflated) sp.inflSpr = new Sprite(L * 1.1, L * 1.1, (g, w, h) => { g.setTransform(L, 0, 0, L, w / 2, h / 2); sp.paintInflated(g); });
  }
  if (!SEAHORSE.spr) {
    const L = 260;
    SEAHORSE.spr = new Sprite(0.8 * L, 1.18 * L, (g, w, h) => { g.setTransform(L, 0, 0, L, 0.38 * L, 1.1 * L); paintSeahorse(g); }, 0.38 / 0.8, 1.1 / 1.18);
    SEAHORSE.fin = new Sprite(0.14 * L, 0.14 * L, (g, w, h) => { g.setTransform(L, 0, 0, L, w, h / 2); paintSeahorseFin(g); }, 1, 0.5);
  }
}
