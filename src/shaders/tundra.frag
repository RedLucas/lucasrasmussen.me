// Procedural polar night: a starfield and drifting, domain-warped aurora
// ribbons over a deep navy/teal/violet sky, with an icy ridge-band horizon
// silhouette reusing the same technique as the sunset/desert foregrounds.
// Noise/fbm/ridge/celestial-body/starField helpers live in common.glsl,
// concatenated ahead of this source (see TundraBg.jsx). Space mode
// ("Deep Sky") intensifies the aurora with a third electric-magenta hue,
// thickens the starfield, and brings a large cratered moon low on the
// horizon.

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uSpaceT; // 0 (normal) -> 1 (space mode), eased in JS

const int LAYERS = 5;
const float HORIZON = 0.34;

// Domain-warped fbm: warping the sample point with a second fbm field is
// what turns plain noise into flowing, curtain-like ribbons.
float auroraField(vec2 p, float t) {
  vec2 warp = vec2(fbm2(p * 0.6 + t * 0.015), fbm2(p * 0.6 + vec2(31.0, 7.0) - t * 0.012));
  return fbm2(p * 1.3 + warp * 1.6 + vec2(t * 0.035, 0.0));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 auv = vec2(uv.x * aspect, uv.y);

  vec3 zenith = vec3(0.02, 0.03, 0.10);
  vec3 mid = vec3(0.06, 0.10, 0.22);
  vec3 horizonCol = vec3(0.18, 0.28, 0.40);
  vec3 farIce = vec3(0.55, 0.68, 0.78);
  vec3 nearIce = vec3(0.10, 0.16, 0.24);

  float sky = smoothstep(HORIZON - 0.04, 1.0, uv.y);
  vec3 col = mix(horizonCol, mid, pow(sky, 0.6));
  col = mix(col, zenith, pow(sky, 1.6));

  // Stars, denser and more color-varied once in space mode.
  float density = mix(0.010, 0.028, uSpaceT);
  float star = starField(auv, uSeed, density);
  vec3 starTint = mix(vec3(0.9, 0.93, 1.0), vec3(0.9 + 0.2 * hash21(floor(auv * 200.0)), 0.85, 1.0), uSpaceT);
  col += starTint * star * smoothstep(HORIZON + 0.05, HORIZON + 0.4, uv.y);

  // Aurora ribbons drifting across the upper sky.
  float aurora = auroraField(vec2(auv.x * 1.1 + uSeed * 3.0, uv.y * 2.2), uTime);
  float band = smoothstep(HORIZON + 0.28, HORIZON + 0.55, uv.y) * smoothstep(1.0, 0.6, uv.y);
  float auroraMask = smoothstep(0.4, 0.78, aurora) * band;
  vec3 auroraGreen = vec3(0.30, 0.95, 0.55);
  vec3 auroraViolet = vec3(0.40, 0.35, 0.92);
  vec3 auroraMagenta = vec3(0.95, 0.25, 0.75);
  vec3 auroraColor = mix(auroraViolet, auroraGreen, smoothstep(HORIZON + 0.3, HORIZON + 0.55, uv.y));
  auroraColor = mix(auroraColor, auroraMagenta, uSpaceT * 0.5);
  col += auroraColor * auroraMask * mix(0.55, 0.95, uSpaceT);

  // Space mode: a large, low, cratered moon. There's no visible sun in this
  // night scene, so it's lit from a fixed low-angle direction (as if from a
  // sun just below the horizon) rather than toward an on-screen body — a
  // crisp lit-sphere edge instead of celestialBody's soft self-luminous glow.
  vec2 moonCenter = vec2(0.72 * aspect, HORIZON + 0.10);
  float moonRadius = 0.075;
  vec2 moonLightDir = normalize(vec2(-0.5, 0.35));
  float moonMask = hardDiscMask(auv, moonCenter, moonRadius, uResolution);
  float moonShade = litSphereShade(auv, moonCenter, moonRadius, moonLightDir, 0.12);
  float craters = fbm2((auv - moonCenter) * 40.0 + uSeed * 5.0);
  vec3 moonColor = mix(vec3(0.82, 0.80, 0.78), vec3(0.62, 0.60, 0.58), smoothstep(0.35, 0.7, craters));
  col = mix(col, moonColor * moonShade, moonMask * uSpaceT);

  // Icy ridge silhouette, painted far to near.
  for (int i = 0; i < LAYERS; i++) {
    float t = float(i) / float(LAYERS - 1);

    float freq = mix(2.0, 0.8, t);
    float amp = mix(0.018, 0.09, t);
    float base = mix(HORIZON - 0.008, HORIZON - 0.14, t);
    float speed = mix(0.0020, 0.0140, t);

    float x = auv.x * freq + uTime * speed + uSeed * 11.0 + float(i) * 23.1;
    float h = base + ridgeFbm(x) * amp;

    if (uv.y < h) {
      vec3 ridge = mix(farIce, nearIce, t * t);
      ridge *= 0.88 + 0.12 * smoothstep(base - amp, h, uv.y);
      col = ridge;
    }
  }

  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
