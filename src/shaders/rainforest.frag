// Procedural rainforest canopy, seen from the side: layered tree-canopy
// silhouettes reusing the same ridgeFbm height-field technique as every
// other theme's foreground (sunset's mountains, desert's dunes, tundra's
// ice horizon), just tuned for the lumpy rounded-crown look of a canopy
// rather than jagged peaks — under a lush green sky.
// Noise/fbm/ridge/celestial-body/starField helpers live in common.glsl,
// concatenated ahead of this source (see RainforestBg.tsx). Space mode
// ("Bioluminescent Grove") recolors the canopy to glowing cyan/violet, adds
// upward-drifting spore motes, and reveals a striped alien gas giant above
// the treeline.

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uSpaceT; // 0 (normal) -> 1 (space mode), eased in JS

const int LAYERS = 6;
const float HORIZON = 0.62;

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

  // Space mode: upward-drifting bioluminescent spore motes.
  float motes = starField(auv * 3.0 + vec2(0.0, -uTime * 0.05), uSeed + 70.0, 0.02);
  col += vec3(0.55, 1.0, 0.90) * motes * uSpaceT;

  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
