// Procedural desert dune sea: a bright, pale midday sky over rounded sand
// ridges, with a wind-ripple texture painted onto each layer's color (not
// its height) and a touch of horizon heat-shimmer. Noise/fbm/ridge/
// celestial-body helpers live in common.glsl, concatenated ahead of this
// source (see DesertBg.jsx). Space mode ("Martian Waste") shifts the sky to
// a thin rust atmosphere, reddens the sand, and brings in a ringed planet
// plus two small moons.

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uSpaceT; // 0 (normal) -> 1 (space mode), eased in JS

const int LAYERS = 5;
const float HORIZON = 0.42;

// Rounded dune crests rather than ridgeFbm's sharp mountain tent-fold.
float duneFbm(float x) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    float n = smoothstep(0.15, 0.85, valueNoise(x));
    sum += n * amp;
    x = x * 2.0 + 11.7;
    amp *= 0.5;
  }
  return sum;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 auv = vec2(uv.x * aspect, uv.y);

  vec3 zenith = vec3(0.42, 0.68, 0.92);
  vec3 mid = vec3(0.78, 0.85, 0.90);
  vec3 horizonCol = vec3(0.96, 0.80, 0.55);
  vec3 sunCol = vec3(1.0, 0.98, 0.88);
  vec3 farDune = horizonCol * 0.92;
  vec3 nearDune = vec3(0.58, 0.36, 0.17);

  // Space mode recolors toward a thin rust/mauve Martian atmosphere.
  vec3 spaceZenith = vec3(0.20, 0.08, 0.14);
  vec3 spaceMid = vec3(0.55, 0.28, 0.24);
  vec3 spaceHorizon = vec3(0.78, 0.42, 0.30);
  vec3 spaceNearDune = vec3(0.62, 0.22, 0.12);
  zenith = mix(zenith, spaceZenith, uSpaceT);
  mid = mix(mid, spaceMid, uSpaceT);
  horizonCol = mix(horizonCol, spaceHorizon, uSpaceT);
  farDune = mix(farDune, spaceHorizon * 0.85, uSpaceT);
  nearDune = mix(nearDune, spaceNearDune, uSpaceT);

  // Heat shimmer: a small noise-driven wobble of the horizon threshold,
  // strongest right at the skyline and fading upward.
  float shimmerBand = smoothstep(HORIZON + 0.12, HORIZON - 0.02, uv.y);
  float heat = (fbm2(vec2(auv.x * 4.0 + uTime * 1.1, uv.y * 30.0)) - 0.5) * 0.02 * shimmerBand;

  float sky = smoothstep(HORIZON - 0.05 + heat, 1.0, uv.y);
  vec3 col = mix(horizonCol, mid, pow(sky, 0.6));
  col = mix(col, zenith, pow(sky, 1.8));

  float starMask = smoothstep(0.35, 0.7, sky) * uSpaceT;
  col += vec3(0.95, 0.9, 1.0) * starField(auv, uSeed + 50.0, 0.005) * starMask;

  // Sun: fixed high in the sky (this is a blazing-midday scene, not a
  // day/night one) with only horizontal seed-driven variety.
  float sunX = 0.20 + fract(uSeed * 6.13) * 0.6;
  vec2 sunCenter = vec2(sunX * aspect, 0.86);
  vec2 sun = celestialBody(auv, sunCenter, 0.05, 0.4);
  col += sunCol * sun.x * (1.0 - uSpaceT * 0.4);
  col = mix(col, sunCol, sun.y);

  // Space mode: a ringed planet opposite the sun, plus two small moons.
  vec2 planetCenter = vec2((1.0 - sunX) * aspect, HORIZON + 0.32);
  vec2 planetUv = auv - planetCenter;
  float ringDist = length(vec2(planetUv.x, planetUv.y * 2.4));
  float planetRadius = 0.052;
  float ringMask =
    smoothstep(planetRadius * 1.55, planetRadius * 1.7, ringDist) *
    smoothstep(planetRadius * 2.5, planetRadius * 2.25, ringDist);
  vec2 planet = celestialBody(auv, planetCenter, planetRadius, 0.2);
  vec3 ringColor = vec3(0.68, 0.58, 0.52);
  vec3 planetColor = vec3(0.78, 0.58, 0.46);
  col = mix(col, ringColor, ringMask * uSpaceT * 0.55);
  col += planetColor * planet.x * uSpaceT;
  col = mix(col, planetColor, planet.y * uSpaceT);

  vec2 moonA = celestialBody(auv, vec2(0.14 * aspect, HORIZON + 0.44), 0.013, 0.3);
  vec2 moonB = celestialBody(auv, vec2(0.88 * aspect, HORIZON + 0.14), 0.010, 0.3);
  vec3 moonColor = vec3(0.86, 0.84, 0.80);
  col += moonColor * (moonA.x + moonB.x) * uSpaceT;
  col = mix(col, moonColor, max(moonA.y, moonB.y) * uSpaceT);

  // Dune layers, painted far to near.
  for (int i = 0; i < LAYERS; i++) {
    float t = float(i) / float(LAYERS - 1);

    float freq = mix(1.6, 0.6, t);
    float amp = mix(0.022, 0.10, t);
    float base = mix(HORIZON - 0.006, HORIZON - 0.16, t);
    float speed = mix(0.0015, 0.0110, t);

    float x = auv.x * freq + uTime * speed + uSeed * 9.0 + float(i) * 19.3;
    float h = base + duneFbm(x) * amp;

    if (uv.y < h) {
      vec3 ridge = mix(farDune, nearDune, t * t);
      // Wind-ripple texture painted onto color only, not height.
      float ripple = fbm2(vec2(auv.x * 42.0 + uSeed * 3.0, uv.y * 42.0 + float(i) * 5.0));
      ridge *= 0.90 + 0.18 * ripple;
      ridge *= 0.92 + 0.08 * smoothstep(base - amp, h, uv.y);
      col = ridge;
    }
  }

  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
