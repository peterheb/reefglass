/* =====================================================================
   Sound, interaction, render pipeline, boot
   ===================================================================== */
const AUDIO = {
  ctx: null, on: false, master: null, rev: null, timer: 0,
  ensure() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    const c = (this.ctx = new AC());
    this.master = c.createGain(); this.master.gain.value = 0; this.master.connect(c.destination);
    const len = c.sampleRate * 2.5, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 340; lp.Q.value = 0.6;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 140; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    const ag = c.createGain(); ag.gain.value = 0.55; src.connect(lp); lp.connect(ag); ag.connect(this.master); src.start();
    const ir = c.createBuffer(2, c.sampleRate * 3, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const x = ir.getChannelData(ch); for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / x.length, 2.6); }
    this.rev = c.createConvolver(); this.rev.buffer = ir; const rg = c.createGain(); rg.gain.value = 0.7; this.rev.connect(rg); rg.connect(this.master);
    return true;
  },
  toggle() {
    if (!this.ensure()) return false;
    this.on = !this.on; const c = this.ctx, g = this.master.gain;
    if (this.on) { c.resume(); g.cancelScheduledValues(c.currentTime); g.setTargetAtTime(0.9, c.currentTime, 0.6); }
    else { g.cancelScheduledValues(c.currentTime); g.setTargetAtTime(0, c.currentTime, 0.25); }
    return this.on;
  },
  blip(vol = 1, when = 0) {
    if (!this.on) return; const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain(), f = rand(380, 1100);
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * rand(1.6, 2.8), t + 0.07);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 * vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(g); g.connect(this.master); g.connect(this.rev); o.start(t); o.stop(t + 0.14);
  },
  bubbles(amt = 1) { if (!this.on) return; for (let i = 0; i < 6 + amt * 8; i++) this.blip(rand(0.4, 1), rand(0, 0.9)); },
  tick(dt) { if (!this.on) return; this.timer -= dt; if (this.timer < 0) { this.timer = rand(0.35, 1.6); this.blip(rand(0.25, 0.6)); } },
  whale() {
    if (!this.on) return; const c = this.ctx;
    let t = c.currentTime + 0.3;
    for (let n = 0; n < 5; n++) {
      const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), vib = c.createOscillator(), vg = c.createGain(), lp = c.createBiquadFilter();
      const f0 = rand(110, 380), f1 = f0 * rand(0.55, 1.8), d = rand(1.2, 2.6);
      o.type = 'sine'; o2.type = 'triangle'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d); o2.frequency.setValueAtTime(f0 * 2.01, t); o2.frequency.exponentialRampToValueAtTime(f1 * 2.01, t + d);
      vib.frequency.value = rand(4, 7); vg.gain.value = rand(3, 9); vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
      lp.type = 'lowpass'; lp.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.35); g.gain.setValueAtTime(0.07, t + d - 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      const g2 = c.createGain(); g2.gain.value = 0.25; o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(this.rev); lp.connect(this.master);
      o.start(t); o2.start(t); vib.start(t); o.stop(t + d + 0.1); o2.stop(t + d + 0.1); vib.stop(t + d + 0.1);
      t += d + rand(0.4, 1.6);
    }
  },
};

/* ---------------- identification targets beyond fish ---------------- */
const JELLY_INFO = {
  moon: { name: 'Moon jellyfish', sci: 'Aurelia aurita', fact: 'No brain, heart or bones — a simple nerve net keeps the bell pulsing. The four rings are its gonads.' },
  crystal: { name: 'Crystal jelly', sci: 'Aequorea victoria', fact: 'Source of green fluorescent protein (GFP), a glowing lab tool that earned a Nobel Prize in 2008.' },
};
Jelly.prototype.hit = function (x, y) { const r = this.r * depthScale(this.z) * 1.1; const d = Math.hypot(x - this.x, y - this.y); return d < r ? d / r : -1; };
Jelly.prototype.anchor = function () { return [this.x, this.y - this.r * depthScale(this.z) * 0.6]; };
const EEL_ENT = { z: 0.2, info: { name: 'Spotted garden eel', sci: 'Heteroconger hassi', fact: 'A colony anchored tail-first in sand burrows, picking plankton from the current. They vanish when something big swims by.' },
  hit(x, y) { const b = REEF.eelBed; if (!b) return -1; return x > b.x0 - U * 2 && x < b.x1 + U * 2 && y > H * 0.8 && y < H * 0.97 ? 0.8 : -1; }, anchor() { const b = REEF.eelBed; return [(b.x0 + b.x1) / 2, H * 0.84]; } };
const ANEMONE_ENT = { z: 0.215, info: { name: 'Bubble-tip anemone', sci: 'Entacmaea quadricolor', fact: 'Home base for the clownfish. Its stinging tentacles swell into bulbs at the tips.' },
  hit(x, y) { const A = LIFE.anemone; if (!A) return -1; const d = Math.hypot(x - A.x, (y - (A.y - U * 1.5)) * 1.3); return d < A.R * 1.3 ? 0.9 : -1; }, anchor() { const A = LIFE.anemone; return [A.x, A.y - U * 3]; },
  draw(g) { drawAnemone(g, CLOCK.t, 'front'); } };

/* ---------------- labels & captions ---------------- */
const tagEl = document.getElementById('tag'), capEl = document.getElementById('caption');
const LABEL = { ent: null, until: 0 };
function identify(ent) {
  const info = ent.info; if (!info) return;
  tagEl.querySelector('.tag-name').textContent = info.name;
  tagEl.querySelector('.tag-sci').textContent = info.sci;
  tagEl.querySelector('.tag-fact').textContent = info.fact;
  LABEL.ent = ent; LABEL.until = CLOCK.t + 7; tagEl.classList.add('show');
}
function placeLabel(g) {
  if (!LABEL.ent) return;
  if (CLOCK.t > LABEL.until || (LABEL.ent.kind === 'visitor' && LABEL.ent !== VIS.active)) { tagEl.classList.remove('show'); LABEL.ent = null; return; }
  const f = par(LABEL.ent.z), [ax, ay] = LABEL.ent.anchor().map((v, i) => v + (i ? CAM.y : CAM.x) * f);
  const tw = tagEl.offsetWidth, th = tagEl.offsetHeight;
  let tx = ax + U * 3, ty = ay - th - U * 4;
  if (tx + tw > W - 16) tx = ax - tw - U * 3;
  tx = clamp(tx, 16, W - tw - 16); ty = clamp(ty, 16, H - th - 16);
  tagEl.style.transform = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px)`;
  const cx = clamp(ax, tx, tx + tw), cy = clamp(ay, ty, ty + th);
  g.strokeStyle = 'rgba(230,250,248,0.75)'; g.lineWidth = 1; g.setLineDash([3, 3]);
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(cx, cy); g.stroke(); g.setLineDash([]);
  g.fillStyle = 'rgba(230,250,248,0.95)'; g.beginPath(); g.arc(ax, ay, 2.5, 0, TAU); g.fill();
}
let capTimer = 0;
function showCaption(v) {
  if (body.classList.contains('idle')) return;
  capEl.querySelector('.cap-name').textContent = v.name;
  capEl.querySelector('.cap-sci').textContent = v.sci;
  capEl.querySelector('.cap-fact').textContent = v.fact;
  capEl.classList.add('show'); clearTimeout(capTimer); capTimer = setTimeout(() => capEl.classList.remove('show'), 8500);
}

/* ---------------- render ---------------- */
const CLOCK = { t: 0 };
const buckets = { far: [], mid: [], near: [] };
// shift the view for a layer at parallax factor f
function view(g, f) { g.setTransform(PX, 0, 0, PX, CAM.x * f * PX, CAM.y * f * PX); }
function drawList(g, list, t) { for (const e of list) { view(g, par(e.z)); e.draw(g, t); } }
const REEF_BACK = 0.45, REEF_FRONT = 0.75;
function render(t) {
  const g = ctx;
  g.setTransform(PX, 0, 0, PX, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  // sprites carry their own mips, so bilinear is enough; 'high' roughly halves the frame rate
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'low';
  const P = CAM.pad;
  view(g, 0.1); g.drawImage(ENV.bg, -P, -P * 0.5, W + 2 * P, H + P);
  view(g, 0.15); drawSurface(g, t);
  buckets.far.length = buckets.mid.length = buckets.near.length = 0;
  const all = [...FISH.list, ...LIFE.jellies];
  if (VIS.active) all.push(VIS.active);
  if (FISH.seahorse) all.push(FISH.seahorse);
  if (LIFE.anemone) all.push(ANEMONE_ENT);
  for (const e of all) (e.z > 0.62 ? buckets.far : e.z > 0.3 ? buckets.mid : buckets.near).push(e);
  for (const b of Object.values(buckets)) b.sort((a, c) => c.z - a.z);
  updateRays(t); fglPrepare(all, t);
  const bt = REEF.bandTop, bh = H - bt;
  drawList(g, buckets.far, t);
  view(g, 0.4); drawRays(g);
  view(g, 0.55); drawSnow(g, false);
  view(g, REEF_BACK); g.drawImage(reefLayer('back'), -P, bt, W + 2 * P, bh);
  drawList(g, buckets.mid, t);
  view(g, REEF_FRONT); g.drawImage(reefLayer('front'), -P, bt, W + 2 * P, bh);
  drawCaustics(g, t); drawShadows(g);
  drawEels(g, t); drawMoray(g); drawAnemone(g, t, 'back'); drawGrass(g, t, false); drawChest(g); drawCrab(g);
  drawList(g, buckets.near, t);
  view(g, 0.9); drawFood(g); drawBubbles(g);
  drawGrass(g, t, true);
  view(g, 1.3); g.drawImage(REEF.fg, -P * 1.8, bt, W + 3.6 * P, bh);
  view(g, 1.1); drawSnow(g, true);
  view(g, 0); drawGrade(g);
  // light that survives the dark: fluorescence, bioluminescence, torches
  g.globalCompositeOperation = 'lighter';
  view(g, REEF_FRONT);
  if (TOD.night > 0.02) { g.globalAlpha = TOD.night * (0.62 + 0.1 * Math.sin(t * 0.5)); g.drawImage(REEF.fluo, -P, bt, W + 2 * P, bh); g.globalAlpha = 1; }
  glowAnemone(g); glowChest(g);
  for (const j of LIFE.jellies) { view(g, par(j.z)); j.glow(g); }
  if (VIS.active && VIS.active.glow) { view(g, par(VIS.active.z)); VIS.active.glow(g); }
  view(g, 0.8); drawSparks(g);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  view(g, 0); g.drawImage(ENV.vignette, 0, 0, W, H);
  placeLabel(g);
}

/* ---------------- update ---------------- */
let clockTick = 0;
const clockEl = document.getElementById('clock');
function update(dt, t) {
  updateTOD(dt); updateCurrent(t); updateCam(dt, t, !body.classList.contains('idle'));
  LIFE.danger.length = 0;
  updateVisitors(dt, t);
  updateSchools(dt);
  for (const f of FISH.list) f.update(dt, t);
  FISH.seahorse && FISH.seahorse.update(dt);
  for (const j of LIFE.jellies) j.update(dt, t);
  updateEels(dt); updateMoray(dt); updateCrab(dt); updateChest(dt); updateBubbles(dt); updateSnow(dt, t); updateSparks(dt); updateFood(dt, t);
  const A = LIFE.anemone; if (A) { const near = LIFE.danger.some((d) => Math.abs(d.x - A.x) < d.r && d.y > H * 0.3); A.shrink = ease(A.shrink, near ? 1 : TOD.night * 0.3, 2, dt); }
  if (LIFE.chest && LIFE.chest.burst > 2.1 && !LIFE.chest.sounded) { LIFE.chest.sounded = true; AUDIO.bubbles(1); } if (LIFE.chest && LIFE.chest.burst <= 0) LIFE.chest.sounded = false;
  AUDIO.tick(dt);
  clockTick -= dt; if (clockTick < 0) { clockTick = 1; clockEl.textContent = todLabel(); }
}

/* ---------------- build / rebuild ---------------- */
let rebuildTimer = 0;
function rebuild() {
  const oW = W, oH = H;
  measure(); buildEnvironment(); buildReef();
  const sx = W / oW, sy = H / oH;
  for (const f of FISH.list) { f.x *= sx; f.y *= sy; f.tx *= sx; f.ty *= sy; }
  for (const S of FISH.schools) { S.tx *= sx; S.ty *= sy; }
  for (const j of LIFE.jellies) { j.x *= sx; j.y *= sy; }
  initAnemone(); initGrass(); initEels(); initChest(); initSnow(); initMoray(); initCrab(); FISH.seahorse = new Seahorse();
  if (VIS.active && VIS.active instanceof Octopus) VIS.active = null;
}
function requestRebuild() { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(rebuild, 250); }
addEventListener('resize', () => { if (Math.abs(innerWidth - W) > 2 || Math.abs(innerHeight - H) > 2) requestRebuild(); });

/* ---------------- interaction ---------------- */
function pickAt(x, y) {
  let best = null, bs = 9;
  const cands = [...FISH.list, ...LIFE.jellies, EEL_ENT, ANEMONE_ENT, MORAY, CRAB];
  if (FISH.seahorse) cands.push(FISH.seahorse);
  if (VIS.active) cands.push(VIS.active);
  for (const e of cands) { const f = par(e.z), h = e.hit(x - CAM.x * f, y - CAM.y * f); if (h >= 0) { const s = h + e.z * 0.8; if (s < bs) { bs = s; best = e; } } }
  return best;
}
cv.addEventListener('pointerdown', (ev) => {
  wake();
  const x = ev.clientX, y = ev.clientY, e = pickAt(x, y);
  if (e) { identify(e); if (e.tapped) e.tapped(); if (e.sp && e.sp.inflSpr) e.inflT = 4; }
  else { dropFood(x, y, 12); AUDIO.blip(0.5); }
});

const body = document.body;
let idleTimer = 0, dockHover = false;
function wake() { body.classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (!dockHover) { body.classList.add('idle'); body.classList.remove('open'); capEl.classList.remove('show'); tagEl.classList.remove('show'); LABEL.ent = null; } }, 3800); }
addEventListener('pointermove', (e) => { CAM.px = (e.clientX / W - 0.5) * 2; CAM.py = (e.clientY / H - 0.5) * 2; wake(); }, { passive: true });
addEventListener('keydown', (e) => {
  wake();
  if (e.target.closest && e.target.closest('button')) return;
  if (e.key === 'f' || e.key === 'F') toggleFull();
  else if (e.key === 'v' || e.key === 'V') callVisitor();
  else if (e.key === 'g' || e.key === 'G') fglToggle();
  else if (e.key === ' ') { e.preventDefault(); feed(); }
});
const dock = document.getElementById('dock');
dock.addEventListener('pointerenter', () => { dockHover = true; wake(); });
dock.addEventListener('pointerleave', () => { dockHover = false; wake(); });
dock.addEventListener('focusin', () => { dockHover = true; body.classList.add('open'); wake(); });
dock.addEventListener('focusout', () => { dockHover = false; if (!body.classList.contains('idle')) wake(); }); // hiding the panel blurs it; don't wake on that

// stray mouse movement reveals just a small handle; the panel opens on click, and once on load
const dockTab = document.getElementById('dockTab');
dockTab.addEventListener('click', () => { body.classList.add('open'); wake(); dock.querySelector('[aria-pressed="true"]').focus(); });
body.classList.add('open');

function setMode(m) { TOD.mode = m; liveT = 99; try { localStorage.setItem('reefglass.mode', m); } catch (_) {} document.querySelectorAll('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m))); clockTick = 0; }
document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
function feed() { dropFood(rand(0.2, 0.8) * W, H * 0.1, 20); AUDIO.blip(0.6); }
document.getElementById('btnFeed').addEventListener('click', feed);
document.getElementById('btnVisitor').addEventListener('click', callVisitor);
const btnSound = document.getElementById('btnSound');
btnSound.addEventListener('click', () => { const on = AUDIO.toggle(); btnSound.setAttribute('aria-pressed', String(on)); btnSound.querySelector('span').textContent = on ? 'Sound on' : 'Sound off'; });
let wakeLock = null;
async function toggleFull() {
  try {
    if (!document.fullscreenElement) { await document.documentElement.requestFullscreen(); if (navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen').catch(() => null); }
    else await document.exitFullscreen();
  } catch (_) { /* fullscreen not available in this view */ }
}
document.getElementById('btnFull').addEventListener('click', toggleFull);
document.addEventListener('fullscreenchange', () => { const b = document.getElementById('btnFull'); b.lastChild.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen'; });

/* ---------------- boot ---------------- */
function boot() {
  measure(); buildGlows(); buildBubbleSprite(); buildSpecies(); fglInit();
  buildEnvironment(); buildReef();
  initAnemone(); initGrass(); initEels(); initChest(); initSnow(); initJellies(); initMoray(); initCrab(); spawnFish();
  for (const j of LIFE.jellies) j.info = JELLY_INFO[j.kind];
  // settle the scene so the first frame already looks alive
  for (let i = 0; i < 90; i++) { CLOCK.t += 1 / 30; update(1 / 30, CLOCK.t); }
  try { const m = localStorage.getItem('reefglass.mode'); if (['live', 'cycle', 'day', 'night'].includes(m)) setMode(m); } catch (_) {}
  if (TOD.mode === 'live') { const s = liveState(); TOD.day = s.day; TOD.warm = s.warm; TOD.night = 1 - s.day; }
  VIS.next = TOD.mode === 'cycle' ? 12 : 45;
  wake();
  let last = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (now - last < 10) return; // hold ~60 fps on 120/144 Hz displays; a slow ambient scene gains nothing from more
    const ms = clamp(now - last, 0, 100); last = Math.max(last, now);
    const dt = Math.min(0.05, ms / 1000); CLOCK.t += dt;
    update(dt, CLOCK.t); render(CLOCK.t); governPerf(ms);
  };
  requestAnimationFrame(loop);
}
window.reef = { summon(id) { const v = VISITORS.find((q) => q.id === id); if (v) { VIS.active = v.make(v); showCaption(v); } }, mode: setMode, feed, gl: fglToggle, advance(s) { for (let i = 0; i < s * 30; i++) { CLOCK.t += 1 / 30; update(1 / 30, CLOCK.t); } } };
boot();
