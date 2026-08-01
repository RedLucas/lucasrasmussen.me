// Shared procedural-background primitives: hashing/noise/fbm helpers plus a
// couple of small "sky object" helpers (stars, a generic glowing disc for
// suns/moons/planets) reused across every background theme. Plain GLSL
// functions, no preprocessor or real module system — each theme component
// concatenates this file's ?raw-imported source as a text prefix onto its
// own frag source before compiling (see e.g. DesertBg.jsx). Declares
// `precision highp float;` once since it's always prepended first.
precision highp float;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash11(i), hash11(i + 1.0), u);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// The 1 - |2n - 1| fold is what turns rolling hills into sharp ridge lines —
// used by any theme whose foreground is a height-field silhouette (sunset's
// mountains, desert's dunes, ocean's waves, tundra's ice horizon).
float ridgeFbm(float x) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    float n = valueNoise(x);
    n = 1.0 - abs(n * 2.0 - 1.0);
    sum += n * amp;
    x = x * 2.0 + 11.7;
    amp *= 0.5;
  }
  return sum;
}

float fbm2(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += noise2(p) * amp;
    p = p * 2.0 + 17.0;
    amp *= 0.5;
  }
  return sum;
}

// Sparse point stars: a cell is a star only if its hash clears a
// density-driven threshold, so density stays low without a separate
// probability pass. `seed` shifts the cell lattice so different
// themes/loads don't line up on the same points.
float starField(vec2 uv, float seed, float density) {
  vec2 cell = uv * 220.0 + seed * 41.0;
  vec2 id = floor(cell);
  vec2 f = fract(cell) - 0.5;
  float h = hash21(id);
  if (h < 1.0 - density) return 0.0;
  float twinkle = 0.6 + 0.4 * hash21(id + 3.7);
  return smoothstep(0.5, 0.0, length(f)) * twinkle;
}

// A soft-glow disc: `x` is an additive glow intensity (unbounded, meant to
// be multiplied by a color and added), `y` is a 0..1 hard-core mask (meant
// to be used as a mix() factor toward the body's own color) — the same
// two-part composition the original sunset sun used inline, generalized so
// every theme's suns/moons/planets read consistently.
vec2 celestialBody(vec2 uv, vec2 center, float radius, float glowStrength) {
  float d = length(uv - center);
  float glow = exp(-d * (0.5 / radius)) * glowStrength;
  float core = smoothstep(radius * 1.155, radius * 0.888, d);
  return vec2(glow, core);
}
