/* =====================================================================
   3D rigs for the special visitors (see 06b_fish_gl.js). Each glJobs()
   poses the model to match its 2D draw(): mirror = swimming direction,
   pitch = the canvas rotation. Where the 2D code rotates before it
   mirrors (scale then rotate), the pitch changes sign. Meshes are built
   the first time a visitor appears.
   ===================================================================== */
const rgb1 = (c) => c.map((v) => v / 255);

Turtle.prototype.glJobs = function () {
  const m = fglCached('turtle', () => {
    const skin = { rough: 0.6, finRough: 0.6, sss: 0.3 };
    return {
      shell: fglMesh({ paint: paintTurtleShell, x0: -0.54, x1: 0.54, y0: -0.37, y1: 0.37, thick: 0.5, NX: 96, mat: { rough: 0.45 } }),
      head: fglMesh({ paint: paintTurtleHead, x0: 0, x1: 0.38, y0: -0.12, y1: 0.12, thick: 0.6, NX: 48, mat: skin }),
      front: fglQuad({ paint: paintTurtleFlipper(0.7, 0.2), w: 0.72, h: 0.24, ox: 1, oy: 0.5, mat: skin }),
      rear: fglQuad({ paint: paintTurtleFlipper(0.28, 0.12), w: 0.3, h: 0.16, ox: 1, oy: 0.5, mat: skin }),
    };
  });
  const st = this.stroke, a = -(0.12 + 0.78 * Math.sin(st)), a2 = -(0.12 + 0.78 * Math.sin(st - 0.5)), sz = m.shell.hAt(0.2, 0.05);
  return [{ obj: this, x: this.x, y: this.y, z: this.z, k: this.k, hw: 1.0, hh: 0.9 + Math.abs(Math.sin(this.pitch)), render: () => {
    fglPose({ pitch: this.pitch * this.dir, mirror: this.dir, yaw: 0.2 * Math.sin(this.t * 0.4) });
    fglDraw(m.front, { x: 0.2, y: -0.04, z: -sz * 0.8, tilt: a2 - 0.1, splay: -0.35 });   // far front flipper
    fglDraw(m.rear, { x: -0.36, y: 0.07, z: sz * 0.5, tilt: -0.35 + 0.18 * Math.sin(st * 0.5), splay: 0.3 });
    fglDraw(m.shell);
    fglDraw(m.head, { x: 0.46, y: 0.03, tilt: Math.sin(st) * 0.06 });
    fglDraw(m.front, { x: 0.24, y: 0.07, z: sz * 0.8, tilt: a, splay: 0.35 });            // near front flipper
  } }];
};

// seen from below: the wings hinge about the body axis, flapping toward and away from us
Manta.prototype.glJobs = function () {
  if (!this.glMesh) this.glMesh = fglMesh({ paint: (g) => paintManta(g, 0, this.spots), x0: -0.62, x1: 0.3, y0: -0.52, y1: 0.52, thick: 0.18, NX: 96, mat: { rough: 0.35, sss: 0.2 } });
  return [{ obj: this, x: this.x, y: this.y, z: this.z, k: this.k, hw: 0.7, hh: 0.62, render: () => {
    fglPose({ pitch: this.pitch * this.dir * 0.5, mirror: this.dir, flap: [0.7, this.flap, 0.08] });
    fglDraw(this.glMesh);
  } }];
};

Shark.prototype.glJobs = function () {
  const m = fglCached('shark', () => fglMesh({ x0: -0.83, x1: 0.54, y0: -0.37, y1: 0.36, thick: 0.45, NX: 120, mat: { rough: 0.45, scale: 0.006, sss: 0.3 },
    paint: (g) => { g.save(); g.translate(-0.49, 0); paintSharkTail(g); g.restore(); paintSharkBody(g); } }));
  return [{ obj: this, x: this.x, y: this.y, z: this.z, k: this.k, hw: 0.9, hh: 0.45 + 0.9 * Math.abs(Math.sin(this.pitch)), render: () => {
    fglPose({ pitch: this.pitch * this.dir, mirror: this.dir, yaw: 0.12 * Math.sin(this.t * 0.5), phase: this.ph2, amp: 0.12, finAmp: 0.01 });
    fglDraw(m);
  } }];
};

WhaleShark.prototype.glJobs = function () {
  const m = fglCached('whaleshark', () => fglMesh({ x0: -0.75, x1: 0.53, y0: -0.35, y1: 0.33, thick: 0.5, NX: 140, mat: { rough: 0.55, sss: 0.2 },
    paint: (g) => { g.save(); g.translate(-0.49, 0); paintWhaleSharkTail(g); g.restore(); paintWhaleSharkBody(g); } }));
  return [{ obj: this, x: this.x, y: this.y, z: this.z, k: this.k, hw: 0.8, hh: 0.4 + 0.8 * Math.abs(Math.sin(this.pitch)), render: () => {
    fglPose({ pitch: this.pitch * this.dir, mirror: this.dir, yaw: 0.08 * Math.sin(this.t * 0.3), phase: this.ph2, amp: 0.09, finAmp: 0.008 });
    fglDraw(m);
  } }];
};

// mammals: the fluke beats up and down
Dolphins.prototype.glJobs = function () {
  const m = fglCached('dolphin', () => fglMesh({ x0: -0.75, x1: 0.55, y0: -0.31, y1: 0.31, thick: 0.5, NX: 110, mat: { rough: 0.22, sss: 0.3 },
    paint: (g) => { g.save(); g.translate(-0.49, 0); paintDolphinFluke(g); g.restore(); paintDolphinBody(g); } }));
  return this.pod.map((d) => d.k > 0 && { obj: d, x: d.x, y: d.y, z: d.z, k: d.k, hw: 0.85, hh: 0.85, render: () => {
    fglPose({ pitch: -(d.pitch * this.dir + Math.sin(d.ph) * 0.05), mirror: this.dir, phase: d.ph, amp: 0.1, axis: 1 });
    fglDraw(m);
  } });
};

Humpback.prototype.glJobs = function () {
  const m = fglCached('humpback', () => {
    const mat = { rough: 0.4, sss: 0.2 };
    const body = fglMesh({ x0: -0.69, x1: 0.53, y0: -0.15, y1: 0.15, thick: 0.45, NX: 140, mat,
      paint: (g) => { g.save(); g.translate(-0.49, 0); paintHumpbackFluke(g); g.restore(); paintHumpbackBody(g); } });
    return { body, fin: fglQuad({ paint: paintHumpbackFin, w: 0.36, h: 0.12, ox: 1, oy: 0.3, mat }), finZ: body.hAt(0.2, 0.07) + 0.005 };
  });
  const osc = Math.sin(this.kick);
  return [{ obj: this, x: this.x, y: this.y, z: this.z, k: this.k, hw: 0.75, hh: 0.45, render: () => {
    fglPose({ pitch: -(this.pitch * this.dir + osc * 0.02), mirror: this.dir, phase: this.kick, amp: 0.05, axis: 1 });
    fglDraw(m.body);
    fglDraw(m.fin, { x: 0.2, y: 0.07, z: m.finZ, tilt: -0.25 + Math.sin(this.kick * 0.5) * 0.12, splay: 0.35 });
  } }];
};

// sculls with its tall dorsal and anal fins, swinging them to the side together
Mola.prototype.glJobs = function () {
  const m = fglCached('mola', () => {
    const mat = { rough: 0.6, sss: 0.2 };
    return {
      body: fglMesh({ paint: paintMolaBody, x0: -0.54, x1: 0.52, y0: -0.46, y1: 0.46, thick: 0.35, NX: 96, mat }),
      dorsal: fglQuad({ paint: paintMolaFin(true), w: 0.26, h: 0.6, ox: 0.5, oy: 1, mat }),
      anal: fglQuad({ paint: paintMolaFin(false), w: 0.26, h: 0.6, ox: 0.5, oy: 0, mat }),
    };
  });
  const o = Math.sin(this.fl);
  return [{ obj: this, x: this.x, y: this.y, z: this.z, k: this.k, hw: 0.75, hh: 1.2, render: () => {
    fglPose({ pitch: -(0.12 * Math.sin(this.t * 0.3) + this.pitch * this.dir), mirror: this.dir, yaw: 0.1 * Math.sin(this.t * 0.25) });
    fglDraw(m.dorsal, { x: -0.22, y: -0.36, tilt: -0.35 + o * 0.1, roll: o * 0.6 });
    fglDraw(m.anal, { x: -0.22, y: 0.36, tilt: 0.35 + o * 0.1, roll: -o * 0.6 });
    fglDraw(m.body);
  } }];
};

// tubes for limbs, ellipsoids for torso, tank and head; mask and regulator are drawn over in 2D
Diver.prototype.glJobs = function () {
  const m = fglCached('diver', () => ({
    torso: fglEllipsoid(0.19, 0.058, 0.075, { cx: 0.02 }),
    tank: fglEllipsoid(0.15, 0.042, 0.045, { cx: 0.02, cy: -0.085, mat: { rough: 0.25, tint: rgb1([229, 194, 41]) } }),
    head: fglEllipsoid(0.048, 0.048, 0.05, { cx: 0.25, cy: -0.01 }),
    torch: fglEllipsoid(0.04, 0.013, 0.013, { mat: { rough: 0.4, tint: [0.2, 0.2, 0.2] } }),
    fin: fglQuad({ paint: (g) => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -0.02); g.lineTo(0.24, -0.035); g.quadraticCurveTo(0.26, 0.0, 0.24, 0.03); g.lineTo(0, 0.025); g.closePath(); g.fill(); },
      w: 0.27, h: 0.08, ox: 0, oy: 0.5, mat: { rough: 0.4 } }),
  }));
  const s1 = Math.sin(this.kick), s2 = Math.sin(this.kick + Math.PI);
  const leg = (s) => this.limbPts(-0.15, 0.01, Math.PI - 0.05 + s * 0.2, 0.2, -0.18 - s * 0.16, 0.19);
  const L1 = leg(s2), L2 = leg(s1), A1 = this.limbPts(0.15, 0.03, 0.9 + s1 * 0.05, 0.12, -0.6, 0.12), A2 = this.limbPts(0.15, 0.035, 0.75 + s2 * 0.05, 0.12, -0.55, 0.12);
  this.hand = [A2[2], A2[3]];
  const tube = (x0, y0, P, r0, r1, z) => ({ pts: [[x0, y0, z], [(x0 + P[0]) / 2, (y0 + P[1]) / 2, z], [P[0], P[1], z], [(P[0] + P[2]) / 2, (P[1] + P[3]) / 2, z], [P[2], P[3], z]],
    r: [0, 0.25, 0.5, 0.75, 1].map((f) => lerp(r0, r1, f)) });
  const suit = { rough: 0.75, sss: 0.1, tint: rgb1([26, 32, 44]) }, suit2 = { ...suit, tint: rgb1([14, 18, 26]) }, fin = { ...m.fin.mat, tint: rgb1(hexRGB(this.fin)) };
  return [{ obj: this, x: this.x, y: this.y, z: this.z, k: this.k, hw: 0.9, hh: 0.5 + 0.9 * Math.abs(Math.sin(this.pitch)), render: () => {
    fglPose({ pitch: this.pitch * this.dir * 0.6, mirror: this.dir });
    fglDraw(fglDynamic(fglTubes([tube(-0.15, 0.01, L1, 0.035, 0.025, -0.045), tube(0.15, 0.03, A1, 0.025, 0.018, -0.05)])), null, true, suit2);
    fglDraw(m.fin, { x: L1[2], y: L1[3], z: -0.045, tilt: L1[4] - 0.1 + s2 * 0.25 }, true, fin);
    fglDraw(m.tank); fglDraw(m.torso, null, true, suit); fglDraw(m.head, null, true, suit2);
    fglDraw(fglDynamic(fglTubes([tube(-0.15, 0.01, L2, 0.035, 0.025, 0.045), tube(0.15, 0.035, A2, 0.027, 0.02, 0.05)])), null, true, suit);
    fglDraw(m.fin, { x: L2[2], y: L2[3], z: 0.045, tilt: L2[4] - 0.1 + s1 * 0.25 }, true, fin);
    fglDraw(m.torch, { x: A2[2] + Math.cos(-0.2) * 0.03, y: A2[3] + Math.sin(-0.2) * 0.03, z: 0.05, tilt: -0.2 });
  } }];
};

// arms are tubes along the same centre lines the 2D drawing uses, the mantle an ellipsoid; skin tinted by its mood colour
function octopusSkin() {
  const c = mk(256, 256), g = c.getContext('2d');
  g.fillStyle = '#ece4dc'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(90,50,40,${rand(0.12, 0.3)})`; g.beginPath(); g.ellipse(rand(256), rand(256), rand(4, 14), rand(3, 9), rand(TAU), 0, TAU); g.fill(); }
  for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(255,248,240,0.45)'; g.beginPath(); g.arc(rand(256), rand(256), rand(0.8, 2.2), 0, TAU); g.fill(); }
  // two rows of suckers along the side of each arm that faces us (v ≈ 0.25)
  for (let x = 6; x < 256; x += 11) for (const y of [56, 72]) {
    g.fillStyle = '#f6eee4'; g.beginPath(); g.arc(x + (y > 60 ? 5 : 0), y, 4.5, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(120,70,60,0.5)'; g.lineWidth = 1; g.stroke();
  }
  return { t: fglTexture(c), texel: [1 / 256, 1 / 256] };
}
Octopus.prototype.glJobs = function (t) {
  if (this.gone || this.out <= 0.01) return null;
  const skin = fglCached('octoSkin', octopusSkin);
  const mantle = fglCached('octoMantle', () => fglEllipsoid(0.45, 0.62, 0.42, { cy: -0.45, tex: skin }));
  const m = this.m * (0.35 + 0.65 * this.out), jet = this.state === 'jet', lines = this.armLines(t, m, jet);
  let ext = 1.1;
  const tubes = lines.map((pts, i) => ({
    pts: pts.map(([x, y], s) => { ext = Math.max(ext, Math.abs(x) / m, Math.abs(y) / m); return [x / m, y / m, (i % 2 ? -1 : 1) * 0.12 + Math.sin(t * 1.1 + i + s * 0.4) * 0.08]; }),
    r: pts.map((_, s) => 0.21 * (1 - (s / 12) * 0.88)),
  }));
  const mat = { rough: 0.35, sss: 0.8, tint: rgb1(this.palette()) };
  return [{ obj: this, x: this.x, y: this.y, z: this.z, k: m, hw: ext + 0.3, hh: ext + 0.3, render: () => {
    fglPose({});
    fglDraw(fglDynamic(fglTubes(tubes), { tex: skin }), null, true, mat);
    fglDraw(mantle, { tilt: jet ? 0 : -0.5 * this.dir }, true, mat);
  } }];
};

Flashlights.prototype.glJobs = function () {
  const m = fglCached('flashlight', () => fglMesh({ paint: paintFlashlightFish, x0: -0.78, x1: 0.52, y0: -0.25, y1: 0.25, thick: 0.45, NX: 48, mat: { rough: 0.3, scale: 0.03, iri: 0.2 } }));
  const k = U * 2.6;
  return this.fish.map((f) => ({ obj: f, x: f.x, y: f.y, z: this.z, k: k * f.s, hw: 0.85, hh: 0.5, render: () => {
    fglPose({ mirror: f.d, phase: this.t * 9 + f.ph, amp: 0.1, finAmp: 0.015 });
    fglDraw(m);
  } }));
};
