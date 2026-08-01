// Procedural sunset landscape: layered ridge silhouettes under a graded sky.
// Everything is generated from uSeed, so every page load is a different scene.
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
// Fraction of the current UTC day elapsed (0..1), so the sun's height is the
// same for every visitor at a given moment rather than randomized per load.
uniform float uDayFraction;

const int LAYERS = 6;
const float HORIZON = 0.46;

// --- noise -------------------------------------------------------------

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

// The 1 - |2n - 1| fold is what turns rolling hills into sharp ridge lines.
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

// --- palette -----------------------------------------------------------

struct Palette {
  vec3 zenith;
  vec3 mid;
  vec3 horizon;
  vec3 sun;
  vec3 near;
};

Palette paletteAt(int idx) {
  if (idx == 0) {
    // Ember: closest to the site's own orange gradient.
    return Palette(
      vec3(0.20, 0.05, 0.13), vec3(0.78, 0.22, 0.11), vec3(1.00, 0.62, 0.24),
      vec3(1.00, 0.88, 0.55), vec3(0.09, 0.03, 0.05)
    );
  } else if (idx == 1) {
    // Dusk: cooler up top, still warm on the horizon.
    return Palette(
      vec3(0.09, 0.05, 0.22), vec3(0.44, 0.17, 0.41), vec3(1.00, 0.51, 0.40),
      vec3(1.00, 0.80, 0.70), vec3(0.05, 0.03, 0.09)
    );
  }
  // Rose: softest of the three.
  return Palette(
    vec3(0.16, 0.09, 0.26), vec3(0.73, 0.29, 0.37), vec3(1.00, 0.72, 0.50),
    vec3(1.00, 0.92, 0.75), vec3(0.08, 0.04, 0.09)
  );
}

Palette mixPalette(Palette a, Palette b, float t) {
  return Palette(
    mix(a.zenith, b.zenith, t),
    mix(a.mid, b.mid, t),
    mix(a.horizon, b.horizon, t),
    mix(a.sun, b.sun, t),
    mix(a.near, b.near, t)
  );
}

// --- scene -------------------------------------------------------------

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;

  // Blend two neighbouring palettes so the variety is continuous rather
  // than three fixed looks.
  float pick = fract(uSeed * 0.618) * 3.0;
  int i0 = int(floor(pick));
  int i1 = int(mod(floor(pick) + 1.0, 3.0));
  Palette pal = mixPalette(paletteAt(i0), paletteAt(i1), fract(pick));

  // Sky: horizon -> mid -> zenith, with the bands compressed near the
  // horizon the way a real sunset stacks up.
  float sky = smoothstep(HORIZON - 0.05, 1.0, uv.y);
  vec3 col = mix(pal.horizon, pal.mid, pow(sky, 0.55));
  col = mix(col, pal.zenith, pow(sky, 1.9));

  // Sun, parked just above the horizon. Horizontal placement is still
  // per-load variety from the seed, but height follows a smooth day cycle —
  // peaking at UTC noon, lowest at UTC midnight — so it's the same for every
  // visitor watching at the same moment rather than random per page load.
  float sunX = 0.22 + fract(uSeed * 7.31) * 0.56;
  float dayHeight = 0.5 - 0.5 * cos(uDayFraction * 6.28318530718);
  float sunY = HORIZON + 0.015 + dayHeight * 0.07;
  vec2 sunUv = vec2((uv.x - sunX) * aspect, uv.y - sunY);
  float sunDist = length(sunUv);
  col += pal.sun * exp(-sunDist * 11.0) * 0.55;
  col = mix(col, pal.sun, smoothstep(0.052, 0.040, sunDist));

  // High cloud banding, drifting slower than anything on the ground.
  float cloud = fbm2(vec2(uv.x * aspect * 1.6 + uTime * 0.006 + uSeed * 5.0, uv.y * 3.4));
  cloud *= smoothstep(HORIZON - 0.02, HORIZON + 0.34, uv.y);
  col = mix(col, pal.mid * 1.25 + pal.sun * 0.10, cloud * 0.30);

  // Ridge layers, painted far to near so the near ones overwrite.
  for (int i = 0; i < LAYERS; i++) {
    float t = float(i) / float(LAYERS - 1);

    float freq = mix(2.4, 0.9, t);
    float amp = mix(0.030, 0.150, t);
    float base = mix(HORIZON - 0.010, HORIZON - 0.230, t);
    float speed = mix(0.0035, 0.0280, t);

    float x = uv.x * aspect * freq + uTime * speed + uSeed * 13.0 + float(i) * 27.3;
    float h = base + ridgeFbm(x) * amp;

    if (uv.y < h) {
      // Distant ridges sit in haze near the sky colour; close ones go dark.
      vec3 ridge = mix(pal.horizon * 0.82, pal.near, t * t);
      // A touch of vertical falloff keeps the silhouettes from reading flat.
      ridge *= 0.90 + 0.10 * smoothstep(base - amp, h, uv.y);
      col = ridge;
    }
  }

  // Ordered-ish dither: 8-bit output bands badly across a gradient this wide.
  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
