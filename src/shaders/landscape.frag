// Procedural sunset landscape: layered ridge silhouettes under a graded sky.
// Everything is generated from uSeed, so every page load is a different
// scene. Noise/fbm/ridge/celestial-body helpers live in common.glsl, which
// LandscapeBg.jsx concatenates ahead of this source before compiling.

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
// Phase (0..1) of a stylized, fast day/night cycle driven by real wall-clock
// time (see LandscapeBg.jsx), so the sun's height is the same for every
// visitor at a given moment rather than randomized per load, and its drift
// is slow enough to read as ambient rather than an obvious animation.
uniform float uSunPhase;
// 0 (normal) -> 1 (space mode): eased in JS, see LandscapeBg.jsx.
uniform float uSpaceT;

const int LAYERS = 6;
const float HORIZON = 0.46;

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

  // Space mode ("Binary Ember"): a faint magenta cast at the zenith and a
  // scatter of stars wherever the sky is dark enough to show them.
  col = mix(col, col + vec3(0.10, -0.02, 0.12) * sky, uSpaceT);
  float starMask = smoothstep(0.35, 0.75, sky) * uSpaceT;
  col += vec3(0.9, 0.92, 1.0) * starField(uv * vec2(aspect, 1.0), uSeed, 0.006) * starMask;

  // Sun, parked just above the horizon. Horizontal placement is still
  // per-load variety from the seed, but height follows a smooth, fast-forward
  // day cycle (see uSunPhase) so it's the same for every visitor watching at
  // the same moment, and visibly drifts rather than sitting frozen all load.
  float sunX = 0.22 + fract(uSeed * 7.31) * 0.56;
  float cycleHeight = 0.5 - 0.5 * cos(uSunPhase * 6.28318530718);
  float sunY = HORIZON + 0.015 + cycleHeight * 0.07;
  vec2 sunCenter = vec2(sunX * aspect, sunY);
  vec2 sunUv = vec2(uv.x * aspect, uv.y);
  vec2 sun = celestialBody(sunUv, sunCenter, 0.046, 0.55);
  col += pal.sun * sun.x;
  col = mix(col, pal.sun, sun.y);

  // Space mode: a second, smaller, redder companion sun fades in nearby.
  vec2 companionCenter = sunCenter + vec2(0.10 * aspect, 0.05);
  vec2 companion = celestialBody(sunUv, companionCenter, 0.026, 0.5);
  vec3 companionColor = vec3(0.95, 0.18, 0.12);
  col += companionColor * companion.x * uSpaceT;
  col = mix(col, companionColor, companion.y * uSpaceT);

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
