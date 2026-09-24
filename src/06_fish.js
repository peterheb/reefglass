/* =====================================================================
   Fish: articulated drawing, behaviours, schooling, feeding, fleeing
   ===================================================================== */
const FISH = { list: [], schools: [], seahorse: null };
const WATER_TOP = () => H * 0.075;
function floorY(x, z) { return z < 0.3 ? H * 0.935 : Math.min(H * 0.93, reefTopAt(x)) - U * 0.8; }
function zoneY(sp, x, z, f) { const top = WATER_TOP(), fl = floorY(x, z); return lerp(top, fl, lerp(sp.zone[0], sp.zone[1], f)); }

class Fish {
  constructor(sp, o = {}) {
    this.sp = sp; this.kind = 'fish';
    this.size = sp.len * rand(0.86, 1.12) * 1.18;
    this.z = o.z ?? rand(sp.z[0], sp.z[1]); this.tz = this.z;
    this.x = o.x ?? rand(-0.05, 1.05) * W;
    this.y = o.y ?? zoneY(sp, this.x, this.z, Math.random());
    this.dir = Math.random() < 0.5 ? -1 : 1; this.face = this.dir;
    this.vx = this.dir * U * sp.swim.speed * 0.5; this.vy = 0;
    this.tx = this.x; this.ty = this.y; this.retarget = 0; this.pause = 0;
    this.phase = rand(TAU); this.pecPh = rand(TAU); this.seed = rand(100); this.age = rand(100);
    this.pitch = 0; this.speed = 0; this.turnCd = 0; this.hunger = rand(0.4, 1); this.flee = 0; this.inflate = 0; this.gulp = 0;
    this.school = o.school ?? null; this.rest = 0;
  }
  get info() { return this.sp; }
  get px() { return this.size * U * depthScale(this.z); }
  cruise() { return U * this.sp.swim.speed * 1.35 * depthScale(this.z) * (0.9 + 0.2 * Math.sin(this.seed)); }
  pickTarget() {
    const sp = this.sp, b = sp.behavior, night = TOD.night > 0.6;
    this.retarget = rand(4, 10);
    if (b === 'home' && LIFE.anemone) {
      const A = LIFE.anemone, r = night ? U * 0.8 : U * rand(2, 8);
      const a = rand(Math.PI * 1.05, Math.PI * 1.95);
      this.tx = A.x + Math.cos(a) * r * 1.3; this.ty = A.y - U * 1.5 + Math.sin(a) * r * 0.6; this.tz = rand(0.22, 0.27);
      this.retarget = rand(1.2, 3.5); return;
    }
    if (b === 'bottom') {
      this.tx = clamp(this.x + rand(-W * 0.12, W * 0.12), W * 0.05, W * 0.95); this.ty = H * rand(0.9, 0.935); this.retarget = rand(1.5, 4); this.pause = rand(0.4, 1.6); return;
    }
    if (night && b !== 'school') {
      const x = clamp(this.x + rand(-W * 0.15, W * 0.15), W * 0.04, W * 0.96);
      this.tx = x; this.ty = reefTopAt(x) - this.px * rand(0.5, 1.2); this.retarget = rand(8, 16); this.pause = rand(3, 8); return;
    }
    if (b === 'picker' && Math.random() < 0.55) {
      const x = rand(W * 0.03, W * 0.97); this.tx = x; this.ty = Math.max(WATER_TOP(), reefTopAt(x) - this.px * rand(0.35, 0.8));
      this.tz = clamp(this.z + rand(-0.15, 0.15), sp.z[0], Math.min(sp.z[1], 0.6)); this.pause = rand(1.5, 5); this.retarget = rand(5, 9); return;
    }
    if (b === 'hover') {
      this.tx = clamp(this.x + rand(-W * 0.25, W * 0.25), W * 0.05, W * 0.95); this.tz = rand(sp.z[0], sp.z[1]);
      this.ty = zoneY(sp, this.tx, this.tz, Math.random()); this.pause = rand(2, 6); this.retarget = rand(6, 12); return;
    }
    this.tz = rand(sp.z[0], sp.z[1]);
    this.tx = Math.random() < 0.6 ? (this.dir > 0 ? rand(0.6, 1.18) : rand(-0.18, 0.4)) * W : rand(-0.15, 1.15) * W;
    this.ty = zoneY(sp, this.tx, this.tz, Math.random()); this.pause = Math.random() < 0.3 ? rand(0.8, 3) : 0;
  }
  update(dt, t) {
    const sp = this.sp, sw = sp.swim; this.age += dt; this.turnCd -= dt;
    const night = TOD.night > 0.6;
    let cruise = this.cruise() * (night ? 0.45 : 1), ax = 0, ay = 0, burst = 1;
    // danger
    let threat = null;
    for (const d of LIFE.danger) { if (d.scare === false) continue; const dd = Math.hypot(d.x - this.x, d.y - this.y); if (dd < d.r) { threat = d; break; } }
    if (threat) {
      this.flee = rand(4, 7);
      if (sp.behavior === 'home' && LIFE.anemone) { this.tx = LIFE.anemone.x + rand(-U, U); this.ty = LIFE.anemone.y - U * 1.2; this.tz = 0.26; }
      else { const away = sgn(this.x - threat.x); this.tx = clamp(this.x + away * W * 0.3, -W * 0.1, W * 1.1); this.ty = reefTopAt(this.tx) - this.px * 0.6; this.tz = Math.min(0.62, this.z + 0.1); }
      this.retarget = 3; this.pause = 0;
      if (sp.inflSpr) this.inflT = 6;
    }
    if (this.flee > 0) { this.flee -= dt; burst = sw.burst / sw.speed; }
    // food
    let food = null;
    if (!threat && LIFE.food.length && this.hunger > 0.15 && sp.behavior !== 'bottom') {
      let best = W * (this.z < 0.4 ? 0.45 : 0.3);
      for (const f of LIFE.food) { const d = Math.hypot(f.x - this.x, f.y - this.y); if (d < best) { best = d; food = f; } }
      if (food) {
        this.tx = food.x; this.ty = food.y; this.tz = 0.16; this.pause = 0; this.retarget = 0.6; burst = 1.8;
        if (best < this.px * 0.45 + U * 0.6 && Math.abs(this.z - 0.16) < 0.12) { LIFE.food.splice(LIFE.food.indexOf(food), 1); this.hunger -= 0.08; this.gulp = 0.25; }
      }
    }
    this.hunger = Math.min(1, this.hunger + dt * 0.004); this.gulp = Math.max(0, this.gulp - dt);
    if (this.inflT > 0) { this.inflT -= dt; }
    if (sp.inflSpr) { if (!this.inflT && Math.random() < dt * 0.006 && !night) this.inflT = rand(3, 5); this.inflate = ease(this.inflate, this.inflT > 0 ? 1 : 0, this.inflT > 0 ? 3 : 0.8, dt); if (this.inflT <= 0) this.inflT = 0; }
    // schooling
    if (this.school) {
      const S = this.school; let cx = 0, cy = 0, avx = 0, avy = 0, n = 0, sx = 0, sy = 0;
      const sepR = this.px * 1.1;
      for (const o of S.members) {
        if (o === this) continue; const dx = o.x - this.x, dy = o.y - this.y, d2 = dx * dx + dy * dy;
        if (d2 < (U * 18) * (U * 18)) { cx += o.x; cy += o.y; avx += o.vx; avy += o.vy; n++; if (d2 < sepR * sepR) { const d = Math.sqrt(d2) + 0.01; sx -= dx / d * (sepR - d); sy -= dy / d * (sepR - d); } }
      }
      const gx = S.tx + this.offx * U, gy = S.ty + this.offy * U;
      ax += (gx - this.x) * 0.25 + sx * 3.5; ay += (gy - this.y) * 0.25 + sy * 3.5;
      if (n) { ax += (cx / n - this.x) * 0.3 + (avx / n - this.vx) * 0.9; ay += (cy / n - this.y) * 0.3 + (avy / n - this.vy) * 0.9; }
      if (!food && !this.flee) { this.tz = ease(this.tz, S.tz + this.offz, 1, dt); }
      if (food || this.flee > 0) { const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy) + 1; ax += dx / d * cruise * 3; ay += dy / d * cruise * 3; }
      const k = 1 - Math.exp(-sw.agility * dt);
      this.vx += ax * dt; this.vy += ay * dt;
      const sp2 = Math.hypot(this.vx, this.vy), mx = cruise * burst * (this.flee > 0 ? 2.2 : 1.35);
      if (sp2 > mx) { this.vx *= mx / sp2; this.vy *= mx / sp2; }
      if (sp2 < cruise * 0.25) { this.vx += this.dir * cruise * k; }
    } else {
      this.retarget -= dt;
      let dx = this.tx - this.x, dy = this.ty - this.y; const d = Math.hypot(dx, dy) + 0.001;
      if (d < Math.max(U * 2, this.px * 0.5)) { if (this.pause > 0) { this.pause -= dt; dx = 0; dy = 0; } else if (!food) this.retarget = 0; }
      if (this.retarget <= 0) this.pickTarget();
      let spd = cruise * burst * clamp(d / (U * 5), 0.12, 1);
      if (sw.hop) spd *= 0.5 + 0.5 * Math.max(0, Math.sin(this.age * 2.2 + this.seed));
      const dvx = (dx / d) * spd, dvy = (dy / d) * spd * 0.75;
      const k = 1 - Math.exp(-sw.agility * dt * (this.flee > 0 ? 2 : 1));
      this.vx += (dvx - this.vx) * k; this.vy += (dvy - this.vy) * k;
      if (sp.behavior === 'hover' || this.pause > 0) this.vy += Math.sin(this.age * 1.3 + this.seed) * U * 0.25 * dt;
    }
    // keep inside the water column
    const top = WATER_TOP() + this.px * 0.3, fl = floorY(this.x, this.z) - this.px * 0.25;
    if (this.y < top) this.vy += (top - this.y) * 3 * dt;
    if (this.y > fl) this.vy -= (this.y - fl) * 4 * dt;
    if (this.x < -W * 0.2) this.vx += U * 8 * dt; if (this.x > W * 1.2) this.vx -= U * 8 * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.z = ease(this.z, this.tz, this.flee > 0 ? 1.2 : 0.25, dt);
    // orientation
    if (this.vx * this.dir < -U * 0.35 * depthScale(this.z) && this.turnCd <= 0) { this.dir = -this.dir; this.turnCd = 0.7; }
    this.face = ease(this.face, this.dir, 6.5, dt);
    const pt = clamp(Math.atan2(this.vy, Math.abs(this.vx) + U * 0.8), -0.5, 0.5);
    this.pitch = ease(this.pitch, pt, 4, dt);
    this.speed = Math.hypot(this.vx, this.vy);
    const eff = clamp(this.speed / (cruise + 1), 0.25, 2.2);
    this.phase += dt * TAU * sw.tailHz * (0.35 + 0.75 * eff) * (night ? 0.7 : 1);
    this.pecPh += dt * TAU * (sw.pecHz ?? 2.5) * (0.6 + 0.4 * eff);
    if (TOD.night > 0.3 && this.speed > U * 2 && Math.random() < dt * this.speed / U * 0.25) spark(this.x - this.dir * this.px * 0.5, this.y + rand(-2, 2), 0.7);
  }
  draw(g) {
    const sp = this.sp, s = depthScale(this.z), k = this.size * U * s, fog = depthFog(this.z), dev = PX, gl = !!this.glTile;
    const fx = this.face, fw = Math.max(Math.abs(fx), 0.12) * sgn(fx);
    const osc = Math.sin(this.phase), ta = sp.swim.tailAmp * clamp(0.55 + 0.5 * this.speed / (this.cruise() + 1), 0.4, 1.3);
    const inf = this.inflate || 0, bodyA = 1 - inf;
    // a 3D fish replaces the tail, body and pectoral sprites; overlays below still draw on top
    if (gl && bodyA > 0.02) { g.globalAlpha = bodyA; fglBlit(g, this); g.globalAlpha = 1; }
    g.save(); g.translate(this.x, this.y); g.rotate(this.pitch * sgn(fx)); g.scale(fw, 1);
    if (this.gulp > 0) g.scale(1 + this.gulp * 0.12, 1 - this.gulp * 0.06);
    if (bodyA > 0.02) {
      g.globalAlpha = bodyA;
      if (!gl) {
        g.save(); g.translate(sp.tailAt[0] * k, sp.tailAt[1] * k); g.rotate(osc * ta * 0.18); g.scale(Math.cos(osc * ta * 1.5), 1 - 0.04 * Math.abs(osc));
        sp.tailSpr.draw(g, 0, 0, sp.tailBox[0] * k, sp.tailBox[1] * k, fog, dev); g.restore();
      }
      g.save(); g.translate(-osc * ta * k * 0.012, 0);
      if (!gl) sp.bodySpr.draw(g, 0, 0, sp.box[0] * k, sp.box[1] * k, fog, dev);
      if (sp.extra) { g.globalAlpha = bodyA * (1 - fog * 0.75); sp.extra(g, this, k); g.globalAlpha = bodyA; }
      g.restore();
      if (sp.pecSpr && !gl) {
        g.save(); g.translate(sp.pecAt[0] * k, sp.pecAt[1] * k); g.rotate(-(sp.pecAng + 0.28 * Math.sin(this.pecPh)));
        g.scale(0.55 + 0.45 * Math.abs(Math.cos(this.pecPh)), 1); sp.pecSpr.draw(g, 0, 0, sp.pecBox[0] * k, sp.pecBox[1] * k, fog, dev); g.restore();
      }
    }
    if (inf > 0.02 && sp.inflSpr) { g.globalAlpha = inf; const q = k * (0.75 + 0.45 * inf); sp.inflSpr.draw(g, 0, 0, q * 1.1, q * 1.1, fog, dev); }
    g.globalAlpha = 1;
    // parrotfish mucus cocoon at night
    if (sp.id === 'parrot' && TOD.night > 0.7 && this.speed < U * 1.2) {
      const a = (TOD.night - 0.7) / 0.3 * 0.5; g.strokeStyle = `rgba(210,240,255,${a})`; g.fillStyle = `rgba(200,235,255,${a * 0.18})`; g.lineWidth = 1;
      g.beginPath(); g.ellipse(-k * 0.05, 0, k * 0.72, k * 0.36, 0, 0, TAU); g.fill(); g.stroke();
    }
    g.restore();
  }
  hit(x, y) { const r = this.px * 0.5 + U * 1.2; return dist2(x, y, this.x, this.y) < r * r ? Math.sqrt(dist2(x, y, this.x, this.y)) / r : -1; }
  anchor() { return [this.x, this.y - this.px * 0.35]; }
}

class Seahorse {
  constructor() {
    this.kind = 'seahorse'; this.z = 0.2; this.clump = null; this.u = 0.55; this.age = rand(10);
    const cands = LIFE.grass.filter((c) => !c.front);
    if (cands.length) { this.clump = cands.reduce((a, b) => (b.h > a.h ? b : a)); this.blade = this.clump.blades.reduce((a, b) => (b.h > a.h ? b : a)); }
  }
  get info() { return SEAHORSE; }
  update(dt) { this.age += dt; }
  // where it clings on its blade of seagrass, and how it leans
  pose() {
    const b = this.blade; if (!b || !b.pts) return null;
    const n = b.pts.length - 1, [px, py, pa] = b.pts[Math.round(this.u * n)], h = U * 6.2;
    this.x = px; this.y = py - h * 0.5;
    return { px, py, h, rot: (pa + Math.PI / 2) * 0.5 + Math.sin(this.age * 0.4) * 0.08 - 0.05 };
  }
  draw(g) {
    if (this.glTile) return fglBlit(g, this);
    const P = this.pose(); if (!P) return;
    const { px, py, h } = P, t = this.age;
    g.save(); g.translate(px, py); g.rotate(P.rot);
    const spr = SEAHORSE.spr;
    spr.draw(g, 0, 0, h * 0.8, h * 1.18, 0.05, PX);
    g.save(); g.translate(-0.12 * h, -0.52 * h); g.scale(0.35 + 0.65 * Math.abs(Math.sin(t * 37)), 1);
    SEAHORSE.fin.draw(g, 0, 0, h * 0.14, h * 0.14, 0.05, PX); g.restore();
    g.restore();
  }
  hit(x, y) { if (this.x === undefined) return -1; const r = U * 4.5; return dist2(x, y, this.x, this.y) < r * r ? Math.sqrt(dist2(x, y, this.x, this.y)) / r : -1; }
  anchor() { return [this.x, this.y - U * 3]; }
}

function makeSchool(ids, n, zc) {
  const S = { members: [], tx: rand(0.2, 0.8) * W, ty: H * rand(0.3, 0.55), tz: zc, retarget: 0, spread: 1 };
  for (let i = 0; i < n; i++) {
    const sp = SPECIES[ids[i % ids.length] === 'anthias' && i % 9 === 4 ? 'anthiasM' : ids[i % ids.length]];
    const f = new Fish(sp, { x: S.tx + rand(-U * 12, U * 12), y: S.ty + rand(-U * 6, U * 6), z: clamp(zc + rand(-0.08, 0.08), 0.05, 0.95), school: S });
    f.offx = rand(-8, 8); f.offy = rand(-4, 4); f.offz = rand(-0.07, 0.07);
    S.members.push(f); FISH.list.push(f);
  }
  FISH.schools.push(S); return S;
}
function updateSchools(dt) {
  for (const S of FISH.schools) {
    S.retarget -= dt;
    const threat = LIFE.danger.find((d) => d.scare !== false && Math.abs(d.x - S.tx) < d.r * 1.3);
    if (threat) { S.tx = clamp(S.tx + sgn(S.tx - threat.x) * W * 0.2, W * 0.05, W * 0.95); S.ty = reefTopAt(S.tx) - U * 6; S.retarget = 4; }
    if (S.retarget <= 0) {
      S.retarget = rand(6, 14);
      const night = TOD.night > 0.6;
      S.tx = rand(-0.05, 1.05) * W;
      S.ty = night ? reefTopAt(S.tx) - U * rand(3, 6) : H * rand(0.18, 0.62);
      S.ty = Math.min(S.ty, reefTopAt(S.tx) - U * 5);
    }
  }
}

function spawnFish() {
  FISH.list = []; FISH.schools = [];
  const area = clamp((W * H) / (1920 * 1080), 0.42, 1.7);
  const solo = ['clown', 'bluetang', 'yellowtang', 'idol', 'emperor', 'copperband', 'mandarin', 'lion', 'porcupine', 'gramma', 'parrot', 'boxfish'];
  for (const id of solo) {
    const sp = SPECIES[id];
    const n = id === 'clown' ? 3 : Math.max(1, Math.round(sp.count * (area > 1 ? Math.sqrt(area) : area)));
    for (let i = 0; i < n; i++) FISH.list.push(new Fish(sp));
  }
  makeSchool(['anthias'], Math.round(clamp(20 * area, 10, 34)), 0.38);
  makeSchool(['chromis'], Math.round(clamp(24 * area, 10, 40)), 0.74);
  FISH.seahorse = new Seahorse();
}
