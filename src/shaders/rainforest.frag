// Procedural rainforest canopy: looking up through layered masses of
// foliage rather than a height-silhouette landscape — each layer is a
// thresholded 2D fbm "blob" field composited far-to-near, so gaps between
// masses read as bright sky/light shafts rather than a horizon line.
// Noise/fbm/celestial-body/starField helpers live in common.glsl,
// concatenated ahead of this source (see RainforestBg.jsx). Space mode
// ("Bioluminescent Grove") recolors the canopy to glowing cyan/violet,
// gives the mist a self-glow, adds upward-drifting spore motes, and reveals
// a striped alien gas giant through the canopy gaps.

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uSpaceT; // 0 (normal) -> 1 (space mode), eased in JS

const int LAYERS = 5;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 auv = vec2(uv.x * aspect, uv.y);

  vec3 skyGap = vec3(0.75, 0.90, 0.55);
  vec3 mistColor = vec3(0.55, 0.72, 0.62);
  vec3 farGreen = vec3(0.10, 0.36, 0.20);
  vec3 nearGreen = vec3(0.02, 0.15, 0.08);

  vec3 spaceGap = vec3(0.35, 0.85, 0.85);
  vec3 spaceFar = vec3(0.06, 0.38, 0.48);
  vec3 spaceNear = vec3(0.16, 0.05, 0.32);
  skyGap = mix(skyGap, spaceGap, uSpaceT);
  farGreen = mix(farGreen, spaceFar, uSpaceT);
  nearGreen = mix(nearGreen, spaceNear, uSpaceT);

  vec3 col = skyGap;
  float coverage = 0.0;

  for (int i = 0; i < LAYERS; i++) {
    float t = float(i) / float(LAYERS - 1);
    vec2 p =
      auv * mix(1.8, 4.5, t) +
      vec2(uTime * mix(0.006, 0.03, t) + uSeed * 9.0, uSeed * 13.0 + float(i) * 17.0);
    float blob = fbm2(p);
    float threshold = mix(0.62, 0.40, t);
    float mask = smoothstep(threshold - 0.12, threshold + 0.12, blob);
    vec3 layerColor = mix(farGreen, nearGreen, t);
    col = mix(col, layerColor, mask);
    coverage = max(coverage, mask);
  }

  float openness = 1.0 - coverage;

  // Scrolling mist, brightest in a mid band, self-glowing in space mode.
  float mist = fbm2(vec2(auv.x * 2.0 + uTime * 0.02, auv.y * 3.0 - uTime * 0.01));
  float mistMask = smoothstep(0.0, 0.35, uv.y) * smoothstep(0.55, 0.15, uv.y) * (0.3 + 0.3 * mist);
  vec3 mistTint = mix(mistColor, vec3(0.40, 0.85, 0.85), uSpaceT);
  col = mix(col, mistTint, mistMask * 0.5);
  col += mistTint * mistMask * uSpaceT * 0.4;

  // Light shafts break through wherever the canopy is more open.
  float shaftNoise = fbm2(vec2(auv.x * 6.0 + uSeed * 4.0, uv.y * 1.0));
  float shaftMask = smoothstep(0.55, 0.75, shaftNoise) * openness;
  col += skyGap * shaftMask * 0.3;

  // Space mode: a striped alien gas giant, visible only through the gaps.
  vec2 planetCenter = vec2(0.68 * aspect, 0.72);
  vec2 planet = celestialBody(auv, planetCenter, 0.09, 0.15);
  float stripes = 0.5 + 0.5 * sin((auv.y - planetCenter.y) * 80.0 + uSeed);
  vec3 planetColor = mix(vec3(0.60, 0.50, 0.72), vec3(0.78, 0.65, 0.85), stripes);
  float planetVis = uSpaceT * openness;
  col += planetColor * planet.x * planetVis;
  col = mix(col, planetColor, planet.y * planetVis);

  // Space mode: upward-drifting bioluminescent spore motes.
  float motes = starField(auv * 3.0 + vec2(0.0, -uTime * 0.05), uSeed + 70.0, 0.02);
  col += vec3(0.55, 1.0, 0.90) * motes * uSpaceT;

  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
