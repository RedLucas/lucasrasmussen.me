// Procedural rainforest canopy, seen from the side: layered tree-canopy
// silhouettes reusing the same ridgeFbm height-field technique as every
// other theme's foreground (sunset's mountains, desert's dunes, tundra's
// ice horizon), just tuned for the lumpy rounded-crown look of a canopy
// rather than jagged peaks — under a lush, sun-dappled green sky, with a
// river running along the ground in front of the nearest trees.
// Noise/fbm/ridge/celestial-body/starField helpers live in common.glsl,
// concatenated ahead of this source (see RainforestBg.tsx). Space mode
// ("Bioluminescent Grove") recolors the canopy to glowing cyan/violet,
// turns the river bioluminescent, adds upward-drifting spore motes, and
// reveals a striped alien gas giant above the treeline.

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uSpaceT; // 0 (normal) -> 1 (space mode), eased in JS

const int LAYERS = 6;
const float HORIZON = 0.62;
const float RIVER_HEIGHT = 0.10;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 auv = vec2(uv.x * aspect, uv.y);

  vec3 zenith = vec3(0.55, 0.82, 0.45);
  vec3 mid = vec3(0.75, 0.90, 0.55);
  vec3 horizonCol = vec3(0.92, 0.95, 0.68);
  vec3 farGreen = vec3(0.16, 0.42, 0.20);
  vec3 nearGreen = vec3(0.03, 0.14, 0.07);

  vec3 spaceZenith = vec3(0.10, 0.06, 0.28);
  vec3 spaceMid = vec3(0.16, 0.10, 0.38);
  vec3 spaceHorizon = vec3(0.30, 0.55, 0.60);
  vec3 spaceFar = vec3(0.06, 0.38, 0.48);
  vec3 spaceNear = vec3(0.16, 0.05, 0.32);
  zenith = mix(zenith, spaceZenith, uSpaceT);
  mid = mix(mid, spaceMid, uSpaceT);
  horizonCol = mix(horizonCol, spaceHorizon, uSpaceT);
  farGreen = mix(farGreen, spaceFar, uSpaceT);
  nearGreen = mix(nearGreen, spaceNear, uSpaceT);

  float sky = smoothstep(HORIZON - 0.05, 1.0, uv.y);
  vec3 col = mix(horizonCol, mid, pow(sky, 0.6));
  col = mix(col, zenith, pow(sky, 1.7));

  // Space mode stars, only where the sky is dark enough to show them.
  float starMask = smoothstep(0.3, 0.7, sky) * uSpaceT;
  col += vec3(0.85, 0.9, 1.0) * starField(auv, uSeed, 0.012) * starMask;

  // Sunbeams filtering down through canopy gaps, brightest just above the
  // treeline.
  float beam = fbm2(vec2(auv.x * 3.0 + uSeed * 6.0, uv.y * 1.2 - uTime * 0.01));
  // Normal-order smoothstep calls only (see common.glsl's own note on why a
  // reversed-argument call is spec-ambiguous): rise from the treeline, then
  // a separate falloff subtracted back out rather than one reversed call.
  float beamBand =
    smoothstep(HORIZON - 0.3, HORIZON, uv.y) * (1.0 - smoothstep(HORIZON + 0.06, HORIZON + 0.33, uv.y));
  float beamMask = smoothstep(0.5, 0.8, beam) * beamBand;
  vec3 beamColor = mix(vec3(1.0, 0.98, 0.75), vec3(0.55, 0.9, 0.95), uSpaceT);
  col += beamColor * beamMask * mix(0.35, 0.6, uSpaceT);

  // Space mode: a striped alien gas giant, hanging above the treeline.
  vec2 planetCenter = vec2(0.70 * aspect, 0.85);
  vec2 planet = celestialBody(auv, planetCenter, 0.10, 0.16);
  float stripes = 0.5 + 0.5 * sin((auv.y - planetCenter.y) * 70.0 + uSeed);
  vec3 planetColor = mix(vec3(0.60, 0.50, 0.72), vec3(0.78, 0.65, 0.85), stripes);
  col += planetColor * planet.x * uSpaceT;
  col = mix(col, planetColor, planet.y * uSpaceT);

  // Layered canopy silhouette, painted far to near.
  for (int i = 0; i < LAYERS; i++) {
    float t = float(i) / float(LAYERS - 1);

    float freq = mix(5.0, 2.2, t);
    float amp = mix(0.035, 0.11, t);
    float base = mix(HORIZON - 0.02, HORIZON - 0.34, t);
    float speed = mix(0.003, 0.02, t);

    float x = auv.x * freq + uTime * speed + uSeed * 15.0 + float(i) * 19.3;
    // Two octaves at very different scales — a gentle overall undulation
    // plus a much smaller, higher-frequency bumpiness on top — is what
    // reads as clustered round tree crowns rather than one smooth ridge
    // line (which is exactly what a single ridgeFbm call looks like, as
    // used for every other theme's actual mountains).
    float crowns = ridgeFbm(x * 5.2 + 41.7);
    float h = base + ridgeFbm(x) * amp * 0.45 + crowns * amp * 0.75;

    if (uv.y < h) {
      vec3 canopy = mix(farGreen, nearGreen, t * t);
      canopy *= 0.88 + 0.12 * smoothstep(base - amp, h, uv.y);
      col = canopy;
    }
  }

  // A river along the ground, in front of even the nearest canopy layer —
  // a flat band with animated glint streaks standing in for sunlight on
  // moving water.
  float riverBase = RIVER_HEIGHT + 0.015 * ridgeFbm(auv.x * 1.5 + uSeed * 21.0);
  if (uv.y < riverBase) {
    vec3 riverColor = mix(vec3(0.10, 0.30, 0.36), vec3(0.05, 0.45, 0.55), uSpaceT);
    float glint = fbm2(vec2(auv.x * 8.0 - uTime * 0.25, uv.y * 20.0 + uSeed * 9.0));
    float glintMask = smoothstep(0.55, 0.75, glint);
    vec3 glintColor = mix(vec3(0.85, 0.95, 0.85), vec3(0.5, 1.0, 0.9), uSpaceT);
    col = mix(riverColor, glintColor, glintMask * 0.5);
  }

  // Space mode: upward-drifting bioluminescent spore motes.
  float motes = starField(auv * 3.0 + vec2(0.0, -uTime * 0.05), uSeed + 70.0, 0.02);
  col += vec3(0.55, 1.0, 0.90) * motes * uSpaceT;

  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
