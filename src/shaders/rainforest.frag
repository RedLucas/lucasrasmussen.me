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

// A macaw flying between canopy gaps: fast colorful wing flap. Returns
// (body, leftWing, rightWing) masks separately so each part can take its
// own color in main() instead of one flat silhouette color.
vec3 macawMask(vec2 auv, float aspect) {
  float speed = 0.05;
  float travel = fract(uTime * speed + uSeed * 4.0);
  float xRange = aspect + 0.3;
  float x = travel * xRange - 0.15;
  float y = 0.55 + sin(uTime * 0.5 + uSeed * 2.0) * 0.08;
  vec2 shoulder = vec2(x, y);
  vec2 tail = shoulder - vec2(0.024, 0.0);
  float body = capsuleMask(auv, shoulder, tail, 0.007);

  float flap = sin(uTime * 5.0 + uSeed) * 0.6;
  vec2 dirL = normalize(vec2(-0.9, 0.3 + flap));
  vec2 dirR = normalize(vec2(0.9, 0.3 + flap));
  vec2 wingL = shoulder + dirL * 0.022;
  vec2 wingR = shoulder + dirR * 0.022;
  float wl = capsuleMask(auv, shoulder, wingL, 0.006);
  float wr = capsuleMask(auv, shoulder, wingR, 0.006);
  return vec3(body, wl, wr);
}

// Space mode: a bioluminescent alien moth drifting slowly through the
// glowing grove, wings flapping gently with a pulsing self-glow.
float mothMask(vec2 auv, float aspect, out vec2 center) {
  float speed = 0.015;
  float travel = fract(uTime * speed + uSeed * 6.0 + 0.3);
  float xRange = aspect + 0.3;
  float x = travel * xRange - 0.15;
  float y = 0.5 + sin(uTime * 0.25 + uSeed * 3.0) * 0.1;
  center = vec2(x, y);
  float flap = sin(uTime * 3.0 + uSeed) * 0.4;
  vec2 dirL = normalize(vec2(-0.7, 0.4 + flap));
  vec2 dirR = normalize(vec2(0.7, 0.4 + flap));
  float wl = capsuleMask(auv, center, center + dirL * 0.018, 0.008);
  float wr = capsuleMask(auv, center, center + dirR * 0.018, 0.008);
  float body = capsuleMask(auv, center, center - vec2(0.0, 0.012), 0.004);
  return max(body, max(wl, wr));
}

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

  // Creatures: a colorful macaw flying between the canopy gaps in normal
  // mode, cross-fading to a bioluminescent alien moth (with a pulsing
  // self-glow) in space mode.
  vec3 macaw = macawMask(auv, aspect);
  float macawFade = 1.0 - uSpaceT;
  col = mix(col, vec3(0.85, 0.10, 0.08), macaw.x * macawFade);
  col = mix(col, vec3(0.10, 0.35, 0.85), macaw.y * macawFade);
  col = mix(col, vec3(0.95, 0.75, 0.10), macaw.z * macawFade);

  vec2 mothCenter;
  float mothM = mothMask(auv, aspect, mothCenter);
  vec3 mothColor = vec3(0.60, 0.95, 0.85);
  float mothPulse = 0.5 + 0.5 * sin(uTime * 1.5 + uSeed);
  float mothGlow = exp(-length(auv - mothCenter) * 60.0) * 0.4 * mothPulse;
  col += mothColor * mothGlow * uSpaceT;
  col = mix(col, mothColor, mothM * uSpaceT);

  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
