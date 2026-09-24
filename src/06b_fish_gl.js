/* =====================================================================
   3D materials in WebGL2.
   Creatures — every fish species, the seahorse and the special visitors are
   drawn as lit 3D models instead of flat sprites. Most are inflated from
   their own painted side view: the body outline (the path a painter passes
   to shade(), or else the painted silhouette) gets a rounded cross-section
   across its narrower dimension, fins stay thin sheets, and the painting,
   redone without baked shading or outlines, is the albedo on both flanks.
   Rigid parts (pectorals, flippers, sculling fins) hang off hinges with
   tilt/splay/roll; the octopus and the diver are built from tubes and
   ellipsoids. Swimming: a travelling body wave (sideways for fish and
   sharks, up-and-down for dolphins and whales), head recoil, rippling fin
   membranes, banking into turns, flapping manta wings.
   Shading is GGX with a guanine F0 (underwater, plain tissue reflects almost
   nothing), procedural scales plus relief from the painted pattern as the
   normal map, subsurface wrap, and sunlight through thin fins.
   Each model renders into its own tile of one offscreen canvas at the start
   of the frame; its draw() copies the tile in, so depth order, fog and
   grading work as before, and 2D overlays (streamers, eyes, lights) still
   draw on top.
   Reef — once per build, the painted back/front layers get a height field
   (multi-scale blur of the silhouette + the painting's luminance detail),
   micro relief (pitted rock, rippled grainy sand) and are re-lit from the
   sun. Only the relief is applied, so the painted light survives.
   Toggle everything with G.
   ===================================================================== */
const FGL = { on: false, want: true, gl: null, canvas: null, fish: null, blur: null, relit: null, quad: null, hdr: false, dyn: null, white: null, cache: {}, tiled: [] };

const GLSL_NOISE = `
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }
vec3 srgb(vec3 c) { return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)); }`;

/* ---------- creatures ---------- */
// One source, two programs: per-model uniforms, or (with INST defined) per-fish instance attributes so a
// whole species draws in one call, each instance placed into its own tile of the canvas.
const FGL_FISH_VS = `#version 300 es
precision highp float;
__DEFS__
in vec3 aPos; in vec3 aNrm; in vec2 aUV; in float aFin;
uniform float uAxis, uFinAmp;
uniform vec4 uPart;     // hinge x, y, z; w = 1 for a rigid part, 0 for the body
uniform vec3 uPartRot;  // in-plane tilt, splay (about the part's y axis), roll (about its x axis)
uniform vec3 uPartS;    // part scale, applied before its rotation
uniform vec3 uFlap;     // wing flap: amplitude, phase, rigid half-width
#ifdef INST
in vec4 iTile;          // tile x, y (from the canvas top), width, height, in canvas pixels
in vec4 iFish;          // world x, y; canvas px per body length; canvas px per CSS px
in vec4 iPose;          // pitch, yaw, roll, swim phase
in vec4 iSwim;          // wave amplitude, gulp, near side (±1), view distance
in vec4 iPec;           // pectoral tilt, pectoral splay, caustic strength, -
uniform vec2 uCanvas; uniform float uPecSide, uPecZ;
#else
uniform vec2 uHalf, uGulp, uFish; uniform float uScale, uPX, uDepth, uPitch, uYaw, uRoll, uMirror, uPhase, uAmp, uDist, uCaus;
#endif
out vec2 vUV, vWorld, vBody; out vec3 vN, vT, vB; out float vFin, vSide, vDist, vCaus; out vec4 vTile;
float gPhase, gAmp, gPitch, gYaw, gRoll, gMirror; vec3 gRot;
// travelling wave, growing toward the tail, plus a small counter-swing of the head (recoil)
float bend(float x) {
  float e = pow(clamp((0.3 - x) / 1.05, 0.0, 1.0), 1.5);
  return gAmp * (e * sin(gPhase - 5.6 * (0.5 - x)) - 0.12 * max(x, 0.0) * sin(gPhase + 0.6));
}
vec3 rotXY(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x * c - v.y * s, v.x * s + v.y * c, v.z); }
vec3 rotYZ(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c); }
vec3 rotXZ(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }
vec3 part(vec3 v) { return rotXZ(rotYZ(rotXY(v, gRot.x), gRot.z), gRot.y); }
// model (canvas y-down) -> view: mirror, roll, pitch (canvas rotation), y up, yaw
vec3 orient(vec3 v) { v.x *= gMirror; v = rotYZ(v, gRoll); v = rotXY(v, gPitch); v.y = -v.y; return rotXZ(v, gYaw); }
vec3 slopeZ(vec3 v, float m) { return vec3(v.x - v.z * m, v.y, v.z + v.x * m); }
vec3 slopeY(vec3 v, float m) { return vec3(v.x - v.y * m, v.y + v.x * m, v.z); }
void main() {
  vec4 hinge = uPart; gRot = uPartRot;
#ifdef INST
  gPitch = iPose.x; gYaw = iPose.y; gRoll = iPose.z; gPhase = iPose.w; gAmp = iSwim.x; gMirror = 1.0;
  vec2 gulp = vec2(1.0 + iSwim.y * 0.12, 1.0 - iSwim.y * 0.06), fish = iFish.xy;
  float scale = iFish.z, pxs = iFish.w, near = iSwim.z;
  vDist = iSwim.w; vCaus = iPec.z;
  if (hinge.w > 0.5) { float side = uPecSide * near; hinge.z = uPecZ * side; gRot = vec3(iPec.x, iPec.y * side, 0.0); }
#else
  gPitch = uPitch; gYaw = uYaw; gRoll = uRoll; gPhase = uPhase; gAmp = uAmp; gMirror = uMirror;
  vec2 gulp = uGulp, fish = uFish;
  float scale = uScale, pxs = uPX, near = 1.0;
  vDist = uDist; vCaus = uCaus;
#endif
  vec3 p = aPos, n = aNrm;
  // tangent frame along the painting's +x / +y, projected onto the surface
  vec3 t = vec3(1.0, 0.0, 0.0) - n * n.x, b = vec3(0.0, 1.0, 0.0) - n * n.y;
  t = length(t) > 0.05 ? normalize(t) : normalize(cross(vec3(0.0, 1.0, 0.0), n));
  b = length(b) > 0.05 ? normalize(b) : normalize(cross(n, vec3(1.0, 0.0, 0.0)));
  vSide = aNrm.z < 0.0 ? -1.0 : 1.0;
  if (hinge.w > 0.5) {
    p = part(p * uPartS) + hinge.xyz; n = part(normalize(n / uPartS)); t = part(t); b = part(b);
    float d = bend(hinge.x);
    if (uAxis > 0.5) p.y += d; else p.z += d;
  } else {
    // a fish seen from its other side swaps its two sheets, so the first-drawn sheet is always the near one
    p.z *= near; n.z *= near; t.z *= near; b.z *= near; vSide *= near;
    if (uFlap.x > 0.0) {                 // manta: each wing hinges about the body axis, the tips lagging
      float s = p.y < 0.0 ? -1.0 : 1.0, w = max(abs(p.y) - uFlap.z, 0.0);
      float a = s * uFlap.x * sin(uFlap.y - w * 2.5) * min(w * 6.0, 1.0);
      vec3 q = rotYZ(vec3(p.x, s * w, p.z), a);
      p = vec3(q.x, q.y + s * min(abs(p.y), uFlap.z), q.z); n = rotYZ(n, a); t = rotYZ(t, a); b = rotYZ(b, a);
    }
    // fin membranes ripple on their own, most at the free edge
    p.z += aFin * uFinAmp * sin(gPhase * 1.3 + p.x * 16.0 + p.y * 9.0) * clamp(abs(p.y) * 3.0 - 0.3, 0.0, 1.0);
    float d = bend(p.x), m = (bend(p.x + 0.01) - d) / 0.01;
    if (uAxis > 0.5) { p.y += d; n = normalize(slopeY(n, m)); t = slopeY(t, m); b = slopeY(b, m); }
    else { p.z += d; n = normalize(slopeZ(n, m)); t = slopeZ(t, m); b = slopeZ(b, m); }
  }
  vBody = aPos.xy;
  p.xy *= gulp;
  p = orient(p); vN = orient(n); vT = orient(t); vB = orient(b);
  vec2 px = p.xy * scale;
#ifdef INST
  vec2 c = vec2(iTile.x + iTile.z * 0.5, uCanvas.y - iTile.y - iTile.w * 0.5);   // tile centre, GL pixels (y up)
  gl_Position = vec4((c + px) / uCanvas * 2.0 - 1.0, -p.z * scale / max(iTile.z, iTile.w), 1.0);
  vTile = vec4(iTile.x, uCanvas.y - iTile.y - iTile.w, iTile.z, iTile.w);
#else
  gl_Position = vec4(px / uHalf, -p.z * scale * uDepth, 1.0);
  vTile = vec4(0.0);
#endif
  vUV = aUV; vFin = aFin; vWorld = fish + vec2(px.x, -px.y) / pxs;
}`;

const FGL_FISH_FS = `#version 300 es
precision highp float;
in vec2 vUV, vWorld, vBody; in vec3 vN, vT, vB; in float vFin, vSide, vDist, vCaus; in vec4 vTile;
uniform sampler2D uTex, uBg; uniform vec2 uTexel;
uniform float uTime, uU, uDay, uSunX, uW, uH, uSSS, uBump, uGlass;
uniform vec4 uMat;   // body roughness, fin roughness, scale size (body lengths; 0 = none), iridescence
uniform vec3 uTint, uEye;   // uEye: the painted eye (x, y, radius) in body units; radius 0 = none
uniform vec4 uRay[15]; uniform float uRayA[15]; uniform int uRayN;   // light shafts: top x, angle, width, length; strength
out vec4 o;
${GLSL_NOISE}
float caustic(vec2 p) {
  p /= uU * 6.0; float t = uTime * 0.6;
  vec2 q = p + 0.6 * vec2(sin(p.y * 1.3 + t), cos(p.x * 1.1 - t * 0.8));
  float v = abs(sin(q.x * 2.1 + t) + sin(q.y * 2.6 - t * 1.2) + sin((q.x + q.y) * 1.7 + t * 0.7));
  return pow(clamp(1.0 - v / 1.4, 0.0, 1.0), 4.0);
}
// overlapping scales: staggered rows of arcs, each free edge raised and facing the tail
float scaleH(vec2 p) {
  vec2 q = p / uMat.z;
  float row = floor(q.y), cy = fract(q.y) - 0.5;
  float f = fract(q.x + 0.5 * mod(row, 2.0) - 1.4 * cy * cy);
  return (1.0 - f) * smoothstep(0.0, 0.14, f);
}
float lum(vec2 uv) { return dot(texture(uTex, uv).rgb, vec3(0.3, 0.59, 0.11)); }
vec3 ambient(vec3 N) {   // water light: bright from above, blue to the sides, sand bounce below
  vec3 up = vec3(0.95, 1.0, 1.05), side = vec3(0.5, 0.6, 0.68), down = vec3(0.5, 0.45, 0.38);
  return N.y > 0.0 ? mix(side, up, N.y) : mix(side, down, -N.y);
}
vec3 envSpec(vec3 R, float rough) {  // Snell's window overhead, open water elsewhere
  vec3 sharp = mix(vec3(0.18, 0.4, 0.55) * (0.6 + 0.4 * R.y), vec3(1.6, 1.75, 1.7), smoothstep(0.55, 0.8, R.y));
  return mix(sharp, ambient(R) * 0.6, rough);
}
// how much of the sun's shafts reach this point (the same shafts the 2D rays draw)
float shafts(vec2 p) {
  float s = 0.0;
  for (int i = 0; i < 15; i++) {
    if (i >= uRayN) break;
    vec4 r = uRay[i]; vec2 d = vec2(p.x - r.x, p.y + 0.01 * uH);
    float c = cos(r.y), sn = sin(r.y), a = d.x * c - d.y * sn, v = (d.x * sn + d.y * c) / r.w;
    float u = a / r.z / (0.16 + 0.34 * v);
    s += exp(-u * u * 2.6) * pow(max(1.0 - v, 0.0), 1.6) * smoothstep(0.0, 0.06, v) * uRayA[i];
  }
  return s;
}
vec3 shoulder(vec3 c) { return mix(c, 0.8 + 0.2 * (1.0 - exp(-(c - 0.8) * 5.0)), step(0.8, c)); }
void main() {
  if (vTile.z > 0.0 && (gl_FragCoord.x < vTile.x || gl_FragCoord.y < vTile.y || gl_FragCoord.x > vTile.x + vTile.z || gl_FragCoord.y > vTile.y + vTile.w)) discard;
  vec4 tex = texture(uTex, vUV);
  if (tex.a < 0.01) discard;
  // normal map: scales on the body + relief from the painted pattern (fin rays, band edges)
  vec2 g = vec2(0.0);
  if (vFin < 0.99 && uMat.z > 0.0) {
    // fade the scales out once each is only a few pixels across, before they alias
    float e = 0.12 * uMat.z, h0 = scaleH(vBody), lod = 1.0 - smoothstep(0.12, 0.3, length(fwidth(vBody)) / uMat.z);
    g = vec2(scaleH(vBody + vec2(e, 0.0)) - h0, scaleH(vBody + vec2(0.0, e)) - h0) / e * 0.06 * uMat.z * (1.0 - vFin) * lod;
  }
  // the eye is a glossy dome: its highlight moves with the light
  vec2 de = uEye.z > 0.0 ? (vBody - uEye.xy) / uEye.z : vec2(9.0);
  float ed = dot(de, de), inEye = 1.0 - smoothstep(0.75, 1.0, ed);
  g -= de / sqrt(max(1.0 - ed, 0.06)) * 0.5 * inEye;
  g += vec2(lum(vUV + vec2(uTexel.x, 0.0)) - lum(vUV - vec2(uTexel.x, 0.0)), lum(vUV + vec2(0.0, uTexel.y)) - lum(vUV - vec2(0.0, uTexel.y))) * uBump;
  vec3 N = normalize(normalize(vN) - vSide * (g.x * normalize(vT) + g.y * normalize(vB)));
  if (vFin > 0.5 && N.z < 0.0) N = -N;                       // thin fins are lit on whichever side we see
  const vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(uSunX - vWorld.x, vWorld.y + 0.15 * uH, 0.3 * uH));
  // sunlight loses red first on its way down from the surface
  vec3 sun = vec3(1.0, 0.96, 0.88) * exp(-clamp(vWorld.y / uH, 0.0, 1.0) * vec3(0.45, 0.12, 0.05)) * 1.35;
  vec3 alb = lin(tex.rgb * uTint) * (1.0 + 0.1 * (vnoise(vBody * 34.0) - 0.5) + 0.06 * (vnoise(vBody * 110.0) - 0.5));
  sun *= 0.8 + 1.6 * shafts(vWorld);                      // brighter where a shaft passes through
  float rough = mix(mix(uMat.x, uMat.y, vFin), 0.07, inEye), a = rough * rough;
  float NoL = dot(N, L), NoV = max(dot(N, V), 0.02);
  // subsurface: light wraps further round the flesh in red than in blue
  vec3 w = uSSS * vec3(0.45, 0.22, 0.12) * (1.0 - vFin);
  vec3 diff = clamp((vec3(NoL) + w) / (1.0 + w), 0.0, 1.0);
  // GGX specular; guanine platelets give the scales an F0 above plain tissue, iridescent at an angle
  vec3 Hv = normalize(L + V); float NoH = max(dot(N, Hv), 0.0), VoH = max(dot(V, Hv), 0.0);
  vec3 irid = 0.5 + 0.5 * cos(6.2832 * (NoV * 1.3 + vec3(0.0, 0.33, 0.67)));
  vec3 F0 = mix(mix(vec3(0.035), 0.12 * irid, uMat.w) * (1.0 - 0.6 * vFin), vec3(0.05), inEye);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - VoH, 5.0), Fv = F0 + (1.0 - F0) * pow(1.0 - NoV, 5.0);
  float dd = NoH * NoH * (a * a - 1.0) + 1.0, D = a * a / (3.14159 * dd * dd);
  float k = a * 0.5, Vis = 0.25 / ((NoV * (1.0 - k) + k) * (max(NoL, 0.0) * (1.0 - k) + k));
  vec3 col = alb * (ambient(N) * 0.5 + sun * diff * 0.62);
  col += (sun * D * Vis * F * max(NoL, 0.0) + envSpec(reflect(-V, N), rough) * Fv * 0.5) * (0.4 + 0.6 * uDay);
  col += alb * sun * vFin * 0.7 * clamp(-NoL, 0.0, 1.0);                  // sunlight through thin fins
  col += alb * sun * caustic(vWorld) * clamp(N.y, 0.0, 1.0) * vCaus;
  // along the view ray the water absorbs the colour (red first) and replaces it with the water behind
  vec3 T = exp(-vDist * vec3(1.8, 0.85, 0.65));
  col = shoulder(col) * T + lin(texture(uBg, vWorld / vec2(uW, uH)).rgb) * (1.0 - T);
  // glassy bodies (jellyfish) are clear face-on and denser toward their rim
  float A = uGlass > 0.0 ? clamp(tex.a + pow(1.0 - NoV, 2.0) * uGlass, 0.0, 1.0) : tex.a;
  o = vec4(srgb(col) * A, A);
}`;

/* ---------- reef relight ---------- */
const FGL_QUAD_VS = `#version 300 es
in vec2 aPos; out vec2 vUV;
void main() { vUV = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

// separable gaussian; the first pass turns the painting into (alpha, luminance·alpha)
const FGL_BLUR_FS = `#version 300 es
precision highp float;
in vec2 vUV; uniform sampler2D uSrc; uniform vec2 uStep; uniform float uLod, uFirst;
out vec4 o;
vec4 fetch(vec2 uv) { vec4 c = textureLod(uSrc, uv, uLod); return uFirst > 0.5 ? vec4(c.a, dot(c.rgb, vec3(0.3, 0.59, 0.11)) * c.a, 0.0, 1.0) : c; }
void main() {
  vec4 s = vec4(0.0); float ws = 0.0;
  for (int i = -6; i <= 6; i++) { float w = exp(-float(i * i) / 18.0); s += fetch(vUV + uStep * float(i)) * w; ws += w; }
  o = s / ws;
}`;

const FGL_RELIT_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uAlb, uS, uM, uL, uSand;
uniform vec2 uPx; uniform vec4 uGeo;   // W, H, bandTop, U (CSS px)
uniform float uSunX, uRelief, uPXr, uMask;
out vec4 o;
${GLSL_NOISE}
// height: rounded silhouettes at three scales + the painting's own light/dark detail
float hgt(vec2 uv) {
  vec4 s = texture(uS, uv), m = texture(uM, uv), l = texture(uL, uv);
  return 0.6 * l.x + 0.3 * m.x + 0.1 * s.x + 0.5 * (s.y - m.y);
}
// gradient of value noise (height per U, y down)
vec2 ngrad(vec2 q, float f) { float d = 0.3 / f, n = vnoise(q * f); return vec2(vnoise((q + vec2(d, 0.0)) * f) - n, vnoise((q + vec2(0.0, d)) * f) - n) / d; }
float lit(vec3 N, vec3 L) { return 0.35 + 0.25 * N.y + 1.25 * clamp((dot(N, L) + 0.15) / 1.15, 0.0, 1.0); }
void main() {
  vec4 alb = texture(uAlb, vUV);
  if (alb.a < 0.004) { o = vec4(0.0); return; }
  vec2 p = vec2(vUV.x * uGeo.x, uGeo.z + (1.0 - vUV.y) * (uGeo.y - uGeo.z)), q = p / uGeo.w;
  float K = 110.0 * uRelief * uPXr;
  float gx = (hgt(vUV + vec2(uPx.x, 0.0)) - hgt(vUV - vec2(uPx.x, 0.0))) * 0.5 * K;
  float gy = (hgt(vUV + vec2(0.0, uPx.y)) - hgt(vUV - vec2(0.0, uPx.y))) * 0.5 * K;   // uv.y points up
  float sand = texture(uSand, vUV).r;   // r = open sand, g = rock
  vec3 floorN = normalize(vec3(0.0, 1.0, 0.55));
  vec3 N0 = mix(vec3(0.0, 0.0, 1.0), floorN, sand);
  vec3 N = mix(normalize(vec3(-gx, -gy, 1.0)), floorN, sand);
  // micro relief (slopes, y down): pitted rock and coral; sand ripples that widen toward the glass, and grain
  vec2 mg = (ngrad(q, 5.0) * 0.06 + ngrad(q, 17.0) * 0.02) * uRelief * (1.0 - sand);
  if (sand > 0.0) {
    float t = clamp((p.y - uGeo.y * 0.84) / (uGeo.y * 0.16), 0.0, 1.0), sp = mix(0.3, 1.5, t);
    float ph = 6.2832 * (q.y + 0.35 * sin(q.x * 0.9) + 0.8 * vnoise(q * 0.35)) / sp;
    mg += sand * (vec2(0.0, cos(ph) * 6.2832 / sp * 0.08 * sp) + ngrad(q, 9.0) * 0.03);
  }
  N = normalize(N + vec3(-mg.x, mg.y, 0.0));
  vec3 L = normalize(vec3(uSunX - p.x, p.y + 0.15 * uGeo.y, 0.45 * uGeo.y));
  if (uMask > 0.5) {
    // where caustics can land: surfaces facing up toward the light, not the dark of the cave
    float m = alb.a * smoothstep(-0.05, 0.6, N.y) * smoothstep(0.04, 0.16, dot(alb.rgb, vec3(0.3, 0.59, 0.11)));
    o = vec4(m, m, m, m); return;
  }
  float f = clamp(lit(N, L) / lit(N0, L), 0.3, 2.0);
  // sunlight loses red first on its way down, so the direct part of the light is bluer near the floor
  vec3 sunT = mix(vec3(1.0), exp(-clamp(p.y / uGeo.y, 0.0, 1.0) * vec3(0.45, 0.12, 0.05)), clamp(f - 0.5, 0.0, 1.0));
  // crevices: where the painting is darker than its surroundings, deepen it
  float cav = clamp((texture(uM, vUV).y - texture(uS, vUV).y) * 4.0, 0.0, 1.0) * (1.0 - sand);
  // sand: soft shadow from rocks between it and the sun, and darkening at their feet
  float sh = 0.0;
  if (sand > 0.0) {
    vec2 dir = normalize(vec2((uSunX - p.x) / uGeo.x * 2.0, 1.0));
    for (int i = 1; i <= 6; i++) sh += textureLod(uSand, vUV + dir * float(i) * 0.014, 2.0).g;
    sh = sand * clamp(sh / 6.0 * 0.9 + textureLod(uSand, vUV, 4.0).g * 0.35, 0.0, 0.55);
  }
  float vary = 1.0 + (0.1 * (vnoise(q * 0.55) - 0.5) + 0.06 * (vnoise(q * 3.3) - 0.5)) * uRelief;
  float sheen = pow(max(dot(N, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 24.0) * 0.05 * (1.0 - sand) * uRelief;   // faint, wet
  vec3 col = srgb(lin(alb.rgb) * vary * f * sunT * (1.0 - 0.4 * cav) * (1.0 - sh) + sheen * f);
  o = vec4(col * alb.a, alb.a);
}`;

function fglProgram(gl, vs, fs, attrs) {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
  gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
  return { p, u };
}

function fglInit() {
  const c = mk(2048, 512);
  const gl = c.getContext('webgl2', { antialias: true, premultipliedAlpha: true, alpha: true, depth: true });
  if (!gl) return;
  try {
    const attrs = ['aPos', 'aNrm', 'aUV', 'aFin', 'iTile', 'iFish', 'iPose', 'iSwim', 'iPec'];
    FGL.fish = fglProgram(gl, FGL_FISH_VS.replace('__DEFS__', ''), FGL_FISH_FS, attrs);
    FGL.fishI = fglProgram(gl, FGL_FISH_VS.replace('__DEFS__', '#define INST'), FGL_FISH_FS, attrs);
    FGL.blur = fglProgram(gl, FGL_QUAD_VS, FGL_BLUR_FS, ['aPos']);
    FGL.relit = fglProgram(gl, FGL_QUAD_VS, FGL_RELIT_FS, ['aPos']);
  } catch (err) { console.warn('[reefglass] 3D materials disabled:', err); return; }
  FGL.canvas = c; FGL.gl = gl;
  FGL.hdr = !!gl.getExtension('EXT_color_buffer_float');
  FGL.quad = gl.createVertexArray(); gl.bindVertexArray(FGL.quad);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  FGL.dyn = { vao: gl.createVertexArray(), vb: gl.createBuffer(), ib: gl.createBuffer() };
  FGL.instBuf = gl.createBuffer(); FGL.inst = true;
  fglAttribs(FGL.dyn.vao, FGL.dyn.vb, FGL.dyn.ib);
  gl.bindVertexArray(null);
  const w = mk(1, 1), wg = w.getContext('2d'); wg.fillStyle = '#fff'; wg.fillRect(0, 0, 1, 1);
  FGL.white = { t: fglTexture(w), texel: [1, 1] };
  c.addEventListener('webglcontextlost', (e) => { e.preventDefault(); FGL.on = false; FGL.gl = null; });
  FGL.on = FGL.want;
  for (const sp of Object.values(SPECIES)) if (sp.gl) fglBuildSpecies(sp);
}

function fglTexture(canvas, flip = false) {
  const gl = FGL.gl, t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}
// interleaved [x y z nx ny nz u v fin] vertices
function fglAttribs(vao, vb, ib) {
  const gl = FGL.gl; gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  [3, 3, 2, 1].reduce((off, n, i) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, gl.FLOAT, false, 36, off * 4); return off + n; }, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
}
function fglVAO(verts, idx) {
  const gl = FGL.gl, vao = gl.createVertexArray(), vb = gl.createBuffer(), ib = gl.createBuffer();
  fglAttribs(vao, vb, ib);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  gl.bindVertexArray(null); vao.vb = vb; vao.ib = ib; return vao;
}
// the same mesh plus per-instance attributes (20 floats per fish) from the shared instance buffer
function fglInstVAO(m) {
  if (m.ivao) return m.ivao;
  const gl = FGL.gl, vao = gl.createVertexArray();
  fglAttribs(vao, m.vao.vb, m.vao.ib);
  gl.bindBuffer(gl.ARRAY_BUFFER, FGL.instBuf);
  for (let i = 0; i < 5; i++) { gl.enableVertexAttribArray(4 + i); gl.vertexAttribPointer(4 + i, 4, gl.FLOAT, false, 80, i * 16); gl.vertexAttribDivisor(4 + i, 1); }
  gl.bindVertexArray(null); return (m.ivao = vao);
}
// build once per key (visitors are built the first time they appear)
function fglCached(key, make) { return FGL.cache[key] || (FGL.cache[key] = make()); }

/* Inflate a painting into a two-sided mesh.
   o: { paint(g) in model units, x0, x1, y0, y1 (bounds), thick, NX, mat }
   The body is the outline passed to shade() while painting — anything else painted is a thin fin — or,
   when the painter never calls shade(), the whole painted silhouette. Each point is rounded across the
   narrower of its vertical and horizontal runs through the body, so a long fish is round top-to-bottom
   and an upright tail is round side-to-side. */
function fglMesh(o) {
  const L = o.L ?? 640, thick = o.thick ?? 0.45, FIN = 0.004, { x0, x1, y0, y1 } = o;
  const tw = Math.ceil((x1 - x0) * L), th = Math.ceil((y1 - y0) * L);
  const tc = mk(tw, th), g = tc.getContext('2d', { willReadFrequently: true });
  FLAT_PAINT = {};
  g.setTransform(L, 0, 0, L, -x0 * L, -y0 * L); o.paint(g);
  const body = FLAT_PAINT.body, eye = FLAT_PAINT.eyes && FLAT_PAINT.eyes[0]; FLAT_PAINT = null;
  const alpha = g.getImageData(0, 0, tw, th).data;

  const NX = o.NX ?? 96, NY = Math.max(8, Math.round(NX * (y1 - y0) / (x1 - x0))), dx = (x1 - x0) / NX, dy = (y1 - y0) / NY;
  const R = 3, MW = NX * R + 1, MH = NY * R + 1, sx = dx / R, sy = dy / R;
  const bm = mk(MW, MH), bg = bm.getContext('2d', { willReadFrequently: true });
  if (body) { bg.setTransform(1 / sx, 0, 0, 1 / sy, 0.5 - x0 / sx, 0.5 - y0 / sy); bg.fill(body); }
  else bg.drawImage(tc, -0.5 * tw / (MW - 1), -0.5 * th / (MH - 1), tw + tw / (MW - 1), th + th / (MH - 1), 0, 0, MW, MH);
  const md = bg.getImageData(0, 0, MW, MH).data, IN = new Uint8Array(MW * MH);
  for (let i = 0; i < IN.length; i++) IN[i] = md[i * 4 + 3] > 127 ? 1 : 0;
  // vertical and horizontal runs through every inside sample
  const cA = new Int16Array(MW * MH), cB = new Int16Array(MW * MH), rA = new Int16Array(MW * MH), rB = new Int16Array(MW * MH);
  for (let c = 0; c < MW; c++) for (let r = 0; r < MH;) { if (!IN[r * MW + c]) { r++; continue; } let e = r; while (e + 1 < MH && IN[(e + 1) * MW + c]) e++; for (let q = r; q <= e; q++) { cA[q * MW + c] = r; cB[q * MW + c] = e; } r = e + 1; }
  for (let r = 0; r < MH; r++) for (let c = 0; c < MW;) { if (!IN[r * MW + c]) { c++; continue; } let e = c; while (e + 1 < MW && IN[r * MW + e + 1]) e++; for (let q = c; q <= e; q++) { rA[r * MW + q] = c; rB[r * MW + q] = e; } c = e + 1; }
  // [half-thickness, analytic dh/dx or NaN, analytic dh/dy or NaN] at mask sample (c, r)
  const H = (c, r) => {
    const s = r * MW + c; if (!IN[s]) return null;
    const hv = (cB[s] - cA[s] + 1) / 2, tv = (r - (cA[s] + cB[s]) / 2) / hv, hu = (rB[s] - rA[s] + 1) / 2, tu = (c - (rA[s] + rB[s]) / 2) / hu;
    const qv = Math.sqrt(Math.max(0, 1 - tv * tv)), qu = Math.sqrt(Math.max(0, 1 - tu * tu));
    return hv * sy * qv <= hu * sx * qu ? [thick * hv * sy * qv, NaN, -thick * tv / Math.max(0.08, qv)] : [thick * hu * sx * qu, -thick * tu / Math.max(0.08, qu), NaN];
  };
  const N1 = NY + 1, hz = new Float32Array((NX + 1) * N1), an = [], fin = new Float32Array((NX + 1) * N1);
  for (let i = 0; i <= NX; i++) for (let j = 0; j <= NY; j++) {
    const h = H(i * R, j * R), k = i * N1 + j;
    hz[k] = h ? Math.max(FIN, h[0]) : FIN; an[k] = h; fin[k] = h ? 0 : body ? 1 : 0;
  }
  const verts = [], idx = [];
  for (const side of [1, -1]) for (let i = 0; i <= NX; i++) for (let j = 0; j <= NY; j++) {
    const k = i * N1 + j, h = an[k];
    let gx = 0, gy = 0;
    if (h) {
      gx = isNaN(h[1]) ? (hz[Math.min(NX, i + 1) * N1 + j] - hz[Math.max(0, i - 1) * N1 + j]) / (2 * dx) : h[1];
      gy = isNaN(h[2]) ? (hz[i * N1 + Math.min(NY, j + 1)] - hz[i * N1 + Math.max(0, j - 1)]) / (2 * dy) : h[2];
    }
    const nl = Math.hypot(gx, gy, 1);
    verts.push(x0 + i * dx, y0 + j * dy, side * hz[k], -gx / nl, -gy / nl, side / nl, i / NX, j / NY, fin[k]);
  }
  // keep only cells with painted pixels; front sheet first, then back
  const cellUsed = (i, j) => {
    const px0 = Math.floor(i * dx * L) - 1, px1 = Math.ceil((i + 1) * dx * L) + 1, py0 = Math.floor(j * dy * L) - 1, py1 = Math.ceil((j + 1) * dy * L) + 1;
    for (let py = Math.max(0, py0); py < Math.min(th, py1); py++) for (let px = Math.max(0, px0); px < Math.min(tw, px1); px++) if (alpha[(py * tw + px) * 4 + 3] > 2) return true;
    return false;
  };
  const cells = [];
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) if (cellUsed(i, j)) cells.push(i * N1 + j);
  for (const off of [0, (NX + 1) * N1]) for (const a of cells) { const b = a + N1; idx.push(off + a, off + b, off + a + 1, off + a + 1, off + b, off + b + 1); }
  const hAt = (x, y) => hz[clamp(Math.round((x - x0) / dx), 0, NX) * N1 + clamp(Math.round((y - y0) / dy), 0, NY)];
  return { vao: fglVAO(verts, idx), tex: fglTexture(tc), texel: [1 / tw, 1 / th], half: cells.length * 6, mat: o.mat || {}, hAt, eye,
    hw: Math.max(-x0, x1), hh: Math.max(-y0, y1) };
}

// a flat painted sheet, e.g. a fin: pivot (ox, oy) as a fraction of its w × h box
function fglQuad(o) {
  const L = o.L ?? 640, c = mk(Math.ceil(o.w * L), Math.ceil(o.h * L)), g = c.getContext('2d');
  FLAT_PAINT = {}; g.setTransform(L, 0, 0, L, o.ox * c.width, o.oy * c.height); o.paint(g); FLAT_PAINT = null;
  const xa = -o.ox * o.w, xb = (1 - o.ox) * o.w, ya = -o.oy * o.h, yb = (1 - o.oy) * o.h;
  return { vao: fglVAO([xa, ya, 0, 0, 0, 1, 0, 0, 1, xb, ya, 0, 0, 0, 1, 1, 0, 1, xa, yb, 0, 0, 0, 1, 0, 1, 1, xb, yb, 0, 0, 0, 1, 1, 1, 1], [0, 1, 2, 2, 1, 3]),
    tex: fglTexture(c), texel: [1 / c.width, 1 / c.height], count: 6, mat: o.mat || {}, len: Math.hypot(o.w, o.h) };
}

// an ellipsoid centred at (cx, cy), textured by longitude/latitude
function fglEllipsoid(rx, ry, rz, o = {}) {
  const V = [], I = [], NU = 28, NV = 16, cx = o.cx || 0, cy = o.cy || 0, tex = o.tex || FGL.white, span = o.half ? 0.5 : 1;
  for (let j = 0; j <= NV; j++) {
    const th = (j / NV) * Math.PI * span;
    for (let i = 0; i <= NU; i++) {
      const ph = (i / NU) * TAU, ex = Math.sin(th) * Math.cos(ph), ey = -Math.cos(th), ez = Math.sin(th) * Math.sin(ph);
      const n = [ex / rx, ey / ry, ez / rz], l = Math.hypot(...n);
      V.push(cx + ex * rx, cy + ey * ry, ez * rz, n[0] / l, n[1] / l, n[2] / l, i / NU, j / NV, 0);
    }
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i; I.push(a, a + NU + 1, a + 1, a + 1, a + NU + 1, a + NU + 2); }
  return { vao: fglVAO(V, I), tex: tex.t, texel: tex.texel, count: I.length, mat: o.mat || {} };
}

// tubes along polylines in the xy plane: [{ pts: [[x, y, z]...], r: [radius...] }] -> [verts, indices]
function fglTubes(tubes, NR = 10) {
  const V = [], I = [];
  for (const tb of tubes) {
    const n = tb.pts.length, base = V.length / 9;
    for (let s = 0; s < n; s++) {
      const p = tb.pts[s], q = tb.pts[Math.min(n - 1, s + 1)], o = tb.pts[Math.max(0, s - 1)];
      let tx = q[0] - o[0], ty = q[1] - o[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      for (let r = 0; r <= NR; r++) {
        const ph = (r / NR) * TAU, c = Math.cos(ph), sn = Math.sin(ph), nx = -ty * c, ny = tx * c;
        V.push(p[0] + nx * tb.r[s], p[1] + ny * tb.r[s], (p[2] || 0) + sn * tb.r[s], nx, ny, sn, s / (n - 1), r / NR, 0);
      }
    }
    for (let s = 0; s < n - 1; s++) for (let r = 0; r < NR; r++) { const a = base + s * (NR + 1) + r, b = a + NR + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  return [V, I];
}
// geometry rebuilt every frame (octopus arms, diver limbs) goes through one shared buffer
function fglDynamic([V, I], o = {}) {
  const gl = FGL.gl, d = FGL.dyn, tex = o.tex || FGL.white;
  gl.bindVertexArray(d.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, d.vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(V), gl.DYNAMIC_DRAW);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(I), gl.DYNAMIC_DRAW);
  gl.bindVertexArray(null);
  return { vao: d.vao, tex: tex.t, texel: tex.texel, count: I.length, mat: o.mat || {} };
}

/* ---------- drawing a model inside its tile ---------- */
function fglPose(p = {}) {
  const gl = FGL.gl, u = FGL.fish.u, f = p.flap || [0, 0, 0];
  gl.uniform1f(u.uPitch, p.pitch || 0); gl.uniform1f(u.uYaw, p.yaw || 0); gl.uniform1f(u.uRoll, p.roll || 0); gl.uniform1f(u.uMirror, p.mirror || 1);
  gl.uniform2f(u.uGulp, p.gx || 1, p.gy || 1); gl.uniform1f(u.uPhase, p.phase || 0); gl.uniform1f(u.uAmp, p.amp || 0);
  gl.uniform1f(u.uAxis, p.axis || 0); gl.uniform1f(u.uFinAmp, p.finAmp || 0); gl.uniform3f(u.uFlap, f[0], f[1], f[2]);
}
// draw a mesh as the body (part = null) or as a rigid part { x, y, z, tilt, splay, roll } on a hinge
function fglDraw(m, part = null, nearFirst = true, mat = m.mat) {
  const gl = FGL.gl, u = FGL.fish.u, t = mat.tint || [1, 1, 1];
  if (part) {
    gl.uniform4f(u.uPart, part.x || 0, part.y || 0, part.z || 0, 1); gl.uniform3f(u.uPartRot, part.tilt || 0, part.splay || 0, part.roll || 0);
    gl.uniform3f(u.uPartS, part.sx || 1, part.sy || 1, part.sz || 1);
  } else gl.uniform4f(u.uPart, 0, 0, 0, 0);
  gl.uniform4f(u.uMat, mat.rough ?? 0.35, mat.finRough ?? 0.6, mat.scale ?? 0, mat.iri ?? 0); gl.uniform1f(u.uSSS, mat.sss ?? 0.5);
  gl.uniform3f(u.uTint, t[0], t[1], t[2]); gl.uniform2f(u.uTexel, m.texel[0], m.texel[1]);
  if (m.eye && !part) gl.uniform3f(u.uEye, m.eye[0], m.eye[1], m.eye[2]); else gl.uniform3f(u.uEye, 0, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, m.tex); gl.bindVertexArray(m.vao);
  if (mat.glass) {  // see-through: far faces first, then near ones, without hiding what lies behind
    gl.uniform1f(u.uGlass, mat.glass); gl.depthMask(false); gl.enable(gl.CULL_FACE);
    for (const f of [gl.FRONT, gl.BACK]) { gl.cullFace(f); gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_SHORT, 0); }
    gl.disable(gl.CULL_FACE); gl.depthMask(true); gl.uniform1f(u.uGlass, 0);
  } else if (m.half) {   // two-sided mesh: the sheet facing us claims depth first
    gl.drawElements(gl.TRIANGLES, m.half, gl.UNSIGNED_SHORT, nearFirst ? 0 : m.half * 2);
    gl.drawElements(gl.TRIANGLES, m.half, gl.UNSIGNED_SHORT, nearFirst ? m.half * 2 : 0);
  } else gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_SHORT, 0);
}

/* Render every visible 3D model into its own tile; the owner's draw() blits the tile later this frame.
   Entities expose glJobs() -> [{ obj, x, y, z, k (CSS px per model unit), hw, hh (half extents, model units), render() }]. */
function fglPrepare(list, t) {
  for (const o of FGL.tiled) o.glTile = null;
  FGL.tiled.length = 0;
  if (!FGL.on) return;
  const jobs = [];
  for (const e of list) {
    const js = e.glJobs && e.glJobs(t);
    if (js) for (const j of js) {
      if (!j || j.x + j.hw * j.k < 0 || j.x - j.hw * j.k > W || j.y + j.hh * j.k < 0 || j.y - j.hh * j.k > H) continue;
      const pw = 2 * j.hw * j.k * PX, ph = 2 * j.hh * j.k * PX;
      // very large visitors render at reduced resolution; far ones too, which softens them like depth of field
      j.s = Math.min(1, 2040 / pw, 2040 / ph) * lerp(1, 0.45, smooth((j.z - 0.45) / 0.4)) * [1, 0.85, 0.7, 0.55][PERF.steps || 0];
      j.tw = Math.ceil(pw * j.s) + 2; j.th = Math.ceil(ph * j.s) + 2; jobs.push(j);
    }
  }
  if (!jobs.length) return;
  // shelf-pack, tallest first; grow the canvas when needed
  jobs.sort((a, b) => b.th - a.th);
  const gl = FGL.gl, cv2 = FGL.canvas, CW = cv2.width;
  let x = 0, y = 0, rowH = 0;
  for (const j of jobs) { if (x + j.tw > CW) { x = 0; y += rowH + 2; rowH = 0; } j.tx = x; j.ty = y; x += j.tw + 2; rowH = Math.max(rowH, j.th); }
  const need = Math.min(4096, Math.ceil((y + rowH) / 256) * 256);
  if (need > cv2.height) cv2.height = need;
  const CH = cv2.height, u = FGL.fish.u;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, CW, CH); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const rays = (ENV.rayNow || []).slice(0, 15), RA = new Float32Array(60), RK = new Float32Array(15);
  rays.forEach((q, i) => { RA.set([q.x, q.ang, q.r.w, q.r.len], i * 4); RK[i] = q.aDay + q.aNight * 0.5; });
  for (const prog of [FGL.fishI, FGL.fish]) {
    const v = prog.u; gl.useProgram(prog.p);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, FGL.bg); gl.uniform1i(v.uBg, 1);
    gl.activeTexture(gl.TEXTURE0); gl.uniform1i(v.uTex, 0);
    gl.uniform1f(v.uTime, t); gl.uniform1f(v.uU, U); gl.uniform1f(v.uW, W); gl.uniform1f(v.uH, H);
    gl.uniform1f(v.uSunX, ENV.sunX); gl.uniform1f(v.uDay, TOD.day); gl.uniform1f(v.uBump, 0.5); gl.uniform1f(v.uGlass, 0);
    gl.uniform4fv(v['uRay[0]'], RA); gl.uniform1fv(v['uRayA[0]'], RK); gl.uniform1i(v.uRayN, rays.length);
  }
  // fish: one instanced batch per species
  const fits = jobs.filter((j) => j.ty + j.th <= CH);
  if (FGL.inst) {
    const bySp = new Map();
    for (const j of fits) if (j.inst) { if (!bySp.has(j.inst.sp)) bySp.set(j.inst.sp, []); bySp.get(j.inst.sp).push(j); }
    gl.viewport(0, 0, CW, CH);
    for (const [sp, list] of bySp) fglDrawSpecies(sp, list, CW, CH);
  }
  gl.useProgram(FGL.fish.p);
  for (const j of fits) {
    if (j.inst && FGL.inst) continue;
    const fog = depthFog(j.z);
    gl.viewport(j.tx, CH - j.ty - j.th, j.tw, j.th);
    gl.uniform2f(u.uHalf, j.tw / 2, j.th / 2); gl.uniform1f(u.uScale, j.k * PX * j.s); gl.uniform1f(u.uPX, PX * j.s);
    gl.uniform1f(u.uDepth, 1 / Math.max(j.tw, j.th)); gl.uniform2f(u.uFish, j.x, j.y);
    gl.uniform1f(u.uDist, j.z); gl.uniform1f(u.uCaus, 0.45 * TOD.day * (1 - fog));
    j.render();
  }
  for (const j of fits) { j.obj.glTile = [j.tx, j.ty, j.tw, j.th, j.s, j.x, j.y]; FGL.tiled.push(j.obj); }
  gl.bindVertexArray(null);
}

// all fish of one species in four instanced calls: far pectorals, near sheet, far sheet, near pectorals
function fglDrawSpecies(sp, list, CW, CH) {
  const gl = FGL.gl, P = FGL.fishI, u = P.u, m = sp.glMesh, mat = sp.gl, n = list.length, D = new Float32Array(n * 20);
  list.forEach((j, i) => {
    const q = j.inst, fog = depthFog(j.z);
    D.set([j.tx, j.ty, j.tw, j.th, j.x, j.y, j.k * PX * j.s, PX * j.s, q.pitch, q.yaw, q.roll, q.phase,
      q.amp, q.gulp, Math.cos(q.yaw) >= 0 ? 1 : -1, j.z, q.pecTilt, q.pecSplay, 0.45 * TOD.day * (1 - fog), 0], i * 20);
  });
  gl.useProgram(P.p);
  gl.bindBuffer(gl.ARRAY_BUFFER, FGL.instBuf); gl.bufferData(gl.ARRAY_BUFFER, D, gl.DYNAMIC_DRAW);
  gl.uniform2f(u.uCanvas, CW, CH); gl.uniform1f(u.uAxis, 0); gl.uniform1f(u.uFinAmp, 0.025); gl.uniform3f(u.uFlap, 0, 0, 0);
  gl.uniform3f(u.uPartS, 1, 1, 1); gl.uniform3f(u.uTint, 1, 1, 1);
  gl.uniform4f(u.uMat, mat.rough ?? 0.35, mat.finRough ?? 0.6, mat.scale ?? 0, mat.iri ?? 0); gl.uniform1f(u.uSSS, mat.sss ?? 0.5);
  const pecs = (side) => {
    if (!m.pec) return;
    gl.uniform1f(u.uPecSide, side); gl.uniform1f(u.uPecZ, m.pecZ); gl.uniform4f(u.uPart, sp.pecAt[0], sp.pecAt[1], 0, 1);
    gl.uniform3f(u.uEye, 0, 0, 0); gl.uniform2f(u.uTexel, m.pec.texel[0], m.pec.texel[1]);
    gl.bindTexture(gl.TEXTURE_2D, m.pec.tex); gl.bindVertexArray(fglInstVAO(m.pec)); gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, n);
  };
  pecs(-1);
  const b = m.body; gl.uniform4f(u.uPart, 0, 0, 0, 0); gl.uniform2f(u.uTexel, b.texel[0], b.texel[1]);
  if (b.eye) gl.uniform3f(u.uEye, b.eye[0], b.eye[1], b.eye[2]); else gl.uniform3f(u.uEye, 0, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, b.tex); gl.bindVertexArray(fglInstVAO(b));
  gl.drawElementsInstanced(gl.TRIANGLES, b.half, gl.UNSIGNED_SHORT, 0, n);
  gl.drawElementsInstanced(gl.TRIANGLES, b.half, gl.UNSIGNED_SHORT, b.half * 2, n);
  pecs(1);
}

function fglBlit(g, o) {
  const [tx, ty, tw, th, s, x, y] = o.glTile, w = tw / (PX * s), h = th / (PX * s);
  g.drawImage(FGL.canvas, tx, ty, tw, th, x - w / 2, y - h / 2, w, h);
}

/* ---------- fish ---------- */
function fglBuildSpecies(sp) {
  const mat = sp.gl, x0 = sp.tailAt[0] - sp.tailBox[0], x1 = sp.box[0] / 2, ym = Math.max(sp.box[1], sp.tailBox[1]) / 2;
  const body = fglMesh({ x0, x1, y0: -ym, y1: ym, thick: mat.thick, NX: sp.len < 5 ? 64 : sp.len < 9 ? 96 : 120, mat,
    paint: (g) => { g.save(); g.translate(sp.tailAt[0], sp.tailAt[1]); sp.paintTail(g); g.restore(); sp.paintBody(g); } });
  const m = sp.glMesh = { body, hw: body.hw, hh: body.hh };
  if (sp.paintPec) {
    m.pec = fglQuad({ paint: sp.paintPec, w: sp.pecBox[0], h: sp.pecBox[1], ox: 1, oy: 0.5, mat });
    m.pecZ = body.hAt(sp.pecAt[0], sp.pecAt[1]) + 0.006;
    m.hw = Math.max(m.hw, Math.abs(sp.pecAt[0]) + m.pec.len); m.hh = Math.max(m.hh, Math.abs(sp.pecAt[1]) + m.pec.len);
  }
}

Fish.prototype.glJobs = function (t) {
  const sp = this.sp, m = sp.glMesh;
  if (!m || this.inflate > 0.98) return null;
  const k = this.size * U * depthScale(this.z), gq = 1 + this.gulp * 0.12;
  const yaw = -Math.acos(clamp(this.face, -1, 1)) + 0.22 * Math.sin(this.age * 0.35 + this.seed) * Math.abs(this.face);
  const ta = sp.swim.tailAmp * clamp(0.55 + 0.5 * this.speed / (this.cruise() + 1), 0.4, 1.3);
  // bank into turns (the yaw rate), plus a slow idle roll
  const yr = this.glYaw === undefined ? 0 : clamp((yaw - this.glYaw) * 60, -4, 4); this.glYaw = yaw;
  this.glRoll = ease(this.glRoll || 0, clamp(yr * 0.12, -0.45, 0.45) + 0.06 * Math.sin(this.age * 0.8 + this.seed), 4, 1 / 60);
  const hw = m.hw * gq, hh = m.hh + hw * Math.abs(Math.sin(this.pitch)) + 0.1, ph = this.pecPh;
  const inst = { sp, pitch: this.pitch, yaw, roll: this.glRoll, phase: this.phase, amp: 0.22 * ta, gulp: this.gulp,
    pecTilt: -(sp.pecAng + 0.12 * Math.sin(ph)), pecSplay: 0.3 + 0.6 * (0.5 + 0.5 * Math.sin(ph)) };
  return [{ obj: this, x: this.x, y: this.y, z: this.z, k, hw, hh, inst, render: () => {
    fglPose({ pitch: this.pitch, yaw, roll: this.glRoll, gx: gq, gy: 1 - this.gulp * 0.06, phase: this.phase, amp: 0.22 * ta, finAmp: 0.025 });
    const near = Math.cos(yaw) >= 0 ? 1 : -1, ph = this.pecPh;
    const pec = (side) => m.pec && fglDraw(m.pec, { x: sp.pecAt[0], y: sp.pecAt[1], z: m.pecZ * side, tilt: -(sp.pecAng + 0.12 * Math.sin(ph)), splay: (0.3 + 0.6 * (0.5 + 0.5 * Math.sin(ph))) * side });
    pec(-near); fglDraw(m.body, null, near > 0); pec(near);
  } }];
};

/* ---------- seahorse ---------- */
Seahorse.prototype.glJobs = function () {
  const P = this.pose(); if (!P) return null;
  const m = fglCached('seahorse', () => {
    const mat = { thick: 0.6, rough: 0.5, sss: 0.4 };
    const body = fglMesh({ paint: paintSeahorse, x0: -0.38, x1: 0.42, y0: -1.1, y1: 0.08, thick: mat.thick, NX: 64, mat });
    const fin = fglQuad({ paint: paintSeahorseFin, w: 0.14, h: 0.14, ox: 1, oy: 0.5, mat });
    return { body, fin, finZ: body.hAt(-0.12, -0.52) + 0.006 };
  });
  const t = this.age, yaw = 0.3 * Math.sin(t * 0.45);
  return [{ obj: this, x: P.px, y: P.py, z: this.z, k: P.h, hw: 1.15, hh: 1.15, render: () => {
    fglPose({ pitch: P.rot, yaw });
    fglDraw(m.body, null, Math.cos(yaw) >= 0);
    fglDraw(m.fin, { x: -0.12, y: -0.52, z: m.finZ, splay: 0.2 + 0.9 * Math.abs(Math.sin(t * 37)) });
  } }];
};

/* Re-light the painted reef layers once per build. Returns { back, front } canvases, or null. */
function fglRelight(back, front) {
  const gl = FGL.gl; if (!gl) return null;
  const lw = back.width, lh = back.height, cv2 = FGL.canvas;
  const target = (w, h) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, FGL.hdr ? gl.RGBA16F : gl.RGBA8, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t, fb, w, h };
  };
  const drop = (r) => { gl.deleteTexture(r.t); gl.deleteFramebuffer(r.fb); };
  const bu = FGL.blur.u;
  const blur = (src, scale, stepPx) => {
    const w = Math.max(1, Math.round(lw / scale)), h = Math.max(1, Math.round(lh / scale)), a = target(w, h), b = target(w, h);
    gl.useProgram(FGL.blur.p); gl.uniform1i(bu.uSrc, 0); gl.activeTexture(gl.TEXTURE0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, a.fb); gl.viewport(0, 0, w, h); gl.bindTexture(gl.TEXTURE_2D, src);
    gl.uniform1f(bu.uLod, Math.log2(scale)); gl.uniform1f(bu.uFirst, 1); gl.uniform2f(bu.uStep, stepPx / w, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, b.fb); gl.bindTexture(gl.TEXTURE_2D, a.t);
    gl.uniform1f(bu.uLod, 0); gl.uniform1f(bu.uFirst, 0); gl.uniform2f(bu.uStep, 0, stepPx / h); gl.drawArrays(gl.TRIANGLES, 0, 3);
    drop(a); return b;
  };
  // open sand (not rock) as a material mask for the front layer
  const [sm, sg] = layerCanvas(0.5);
  sg.fillStyle = '#f00'; sg.beginPath(); sg.moveTo(-5, H + 5);
  for (let x = -4; x <= W + 4; x += 4) sg.lineTo(x, sandY(x));
  sg.lineTo(W + 5, H + 5); sg.fill();
  sg.fillStyle = '#0f0'; for (const r of REEF.rocks) sg.fill(r.path);
  const none = mk(1, 1);

  // canvas rows, top to bottom: back colour, front colour, back caustic mask, front caustic mask
  cv2.width = lw; cv2.height = lh * 4;
  gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.bindVertexArray(FGL.quad);
  const ru = FGL.relit.u, layers = [[back, none, 0.5, 0], [front, sm, 1, 1]];
  for (const [src, mask, relief, row] of layers) {
    const alb = fglTexture(src, true), sand = fglTexture(mask, true);
    const S = blur(alb, 1, 0.5 * PX), M = blur(alb, 2, 1.35 * PX), Lg = blur(alb, 8, 1.7 * PX);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(FGL.relit.p);
    [alb, S.t, M.t, Lg.t, sand].forEach((t, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); });
    ['uAlb', 'uS', 'uM', 'uL', 'uSand'].forEach((n, i) => gl.uniform1i(ru[n], i));
    gl.uniform2f(ru.uPx, 1 / lw, 1 / lh); gl.uniform4f(ru.uGeo, W, H, REEF.bandTop, U);
    gl.uniform1f(ru.uSunX, ENV.sunX); gl.uniform1f(ru.uRelief, relief); gl.uniform1f(ru.uPXr, PX);
    for (const [mode, r] of [[0, row], [1, row + 2]]) {
      gl.viewport(0, (3 - r) * lh, lw, lh); gl.uniform1f(ru.uMask, mode); gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    for (const r of [S, M, Lg]) drop(r);
    gl.deleteTexture(alb); gl.deleteTexture(sand); gl.activeTexture(gl.TEXTURE0);
  }
  gl.bindVertexArray(null);
  const out = {};
  for (const [k, sy] of [['back', 0], ['front', lh]]) {
    const c = mk(lw, lh), cg = c.getContext('2d');
    if (k === 'back' && 'filter' in cg) cg.filter = `blur(${0.8 * PX}px)`;   // the far reef slightly out of focus
    cg.drawImage(cv2, 0, sy, lw, lh, 0, 0, lw, lh); out[k] = c;
  }
  const mc = mk(lw / 2, lh / 2), mg = mc.getContext('2d');
  mg.drawImage(cv2, 0, lh * 2, lw, lh, 0, 0, mc.width, mc.height); mg.drawImage(cv2, 0, lh * 3, lw, lh, 0, 0, mc.width, mc.height);
  out.mask = mc;
  // the painted water, for models to fade into
  if (FGL.bg) gl.deleteTexture(FGL.bg);
  FGL.bg = fglTexture(ENV.bg);
  cv2.width = 2048; cv2.height = 512;
  return out;
}

function reefLayer(k) { return FGL.on && REEF.lit ? REEF.lit[k] : REEF[k]; }

function fglToggle(on = !FGL.want) { FGL.want = on; FGL.on = on && !!FGL.gl; return FGL.on; }
