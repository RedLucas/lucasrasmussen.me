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

// Reflective spheres (moons, planets) need a different tool than
// celestialBody's soft self-luminous glow: a fake sphere normal derived from
// flat disc geometry (treating the disc as a hemisphere seen face-on), shaded
// against the actual direction to a light source so there's a real
// day/night terminator, plus a crisp hard edge rather than a wide glowy
// falloff. `ambient` (0..1) sets the unlit-side floor so the dark side
// stays dimly visible instead of going pure black.
float litSphereShade(vec2 uv, vec2 center, float radius, vec2 lightDir2D, float ambient) {
  vec2 pNorm = (uv - center) / radius;
  float z = sqrt(max(0.0, 1.0 - dot(pNorm, pNorm)));
  vec3 normal = normalize(vec3(pNorm, z));
  vec3 lightDir = normalize(vec3(lightDir2D, 0.4));
  float lighting = clamp(dot(normal, lightDir), 0.0, 1.0);
  return mix(ambient, 1.0, pow(lighting, 0.8));
}

// A tight, solid edge — composed from two normal-order smoothsteps (rather
// than one reversed-order one, which GLSL leaves spec-ambiguous) so the
// transition is well-defined on every platform. Sized in actual screen
// pixels (via `resolution`, every theme's own uResolution uniform) rather
// than a fixed percentage of the body's own radius: a percentage-of-radius
// band is several pixels wide on a small moon and reads as a soft blur, but
// a fixed ~1.5px band anti-aliases the same everywhere regardless of how
// small the body is or how dense the display.
float hardDiscMask(vec2 uv, vec2 center, float radius, vec2 resolution) {
  float dist = length(uv - center);
  float pixel = 1.5 / resolution.y;
  return 1.0 - smoothstep(radius - pixel, radius + pixel, dist);
}
