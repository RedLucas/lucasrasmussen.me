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

// Terrain height at world x, matching the near (foreground) dune layer's
// own parameters from the layer loop below — so a walking creature's feet
// land exactly on the ridge silhouette rather than floating or sinking.
float terrainHeightAt(float x) {
  float freq = 0.6;
  float amp = 0.10;
  float base = HORIZON - 0.16;
  float speed = 0.0110;
  float xf = x * freq + uTime * speed + uSeed * 9.0 + float(LAYERS - 1) * 19.3;
  return base + duneFbm(xf) * amp;
}

// A camel walking the near dune ridge: hip/shoulder/neck/head plus two legs
// alternating in antiphase for a walk cycle, feet planted on the terrain.
float camelMask(vec2 auv, float aspect) {
  float speed = 0.02;
  float travel = fract(uTime * speed + uSeed * 5.0);
  float xRange = aspect + 0.3;
  float x = travel * xRange - 0.15;
  float groundY = terrainHeightAt(x);

  vec2 hip = vec2(x, groundY + 0.028);
  vec2 shoulder = vec2(x - 0.026, groundY + 0.034);
  vec2 neckTop = vec2(x - 0.040, groundY + 0.052);
  vec2 head = vec2(x - 0.048, groundY + 0.048);

  float body = capsuleMask(auv, hip, shoulder, 0.014);
  float hump = capsuleMask(auv, shoulder, shoulder + vec2(-0.006, 0.010), 0.012);
  float neck = capsuleMask(auv, shoulder, neckTop, 0.007);
  float headM = capsuleMask(auv, neckTop, head, 0.006);

  float legPhase = uTime * 3.0;
  float legSwingBack = sin(legPhase) * 0.02;
  float legSwingFront = -sin(legPhase) * 0.02;
  vec2 legBackTop = hip - vec2(0.004, 0.006);
  vec2 legBackBot = vec2(legBackTop.x + legSwingBack, groundY);
  vec2 legFrontTop = shoulder - vec2(-0.004, 0.010);
  vec2 legFrontBot = vec2(legFrontTop.x + legSwingFront, groundY);
  float legBack = capsuleMask(auv, legBackTop, legBackBot, 0.005);
  float legFront = capsuleMask(auv, legFrontTop, legFrontBot, 0.005);

  return max(max(body, hump), max(neck, max(headM, max(legBack, legFront))));
}

// Space mode: a sandworm undulating along the dune horizon — a short
// unrolled, tapering chain, each joint's angle offset by a sine wave down
// the chain so it slithers rather than moving as a rigid line.
float sandwormMask(vec2 auv, float aspect) {
  float speed = 0.03;
  float travel = fract(uTime * speed + uSeed * 13.0);
  float xRange = aspect + 0.4;
  float xStart = travel * xRange - 0.2;
  float yBase = terrainHeightAt(xStart) + 0.01;

  vec2 p0 = vec2(xStart, yBase);
  float mask = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float angle = sin(uTime * 2.0 - fi * 1.0 + uSeed) * 0.35;
    vec2 dir = vec2(cos(angle), sin(angle) * 0.6 + 0.15);
    vec2 p1 = p0 + dir * 0.022;
    float r = mix(0.012, 0.006, fi / 4.0);
    mask = max(mask, capsuleMask(auv, p0, p1, r));
    p0 = p1;
  }
  return mask;
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
  vec2 sunDir = normalize(sunCenter - planetCenter);

  // Ring band: composed as the difference of two normal-order smoothsteps
  // (rise at the inner edge minus rise at the outer edge) rather than a
  // product of one normal- and one reversed-order smoothstep — reversed
  // argument order is spec-ambiguous, and was previously producing both
  // ring edges on the same side instead of a clean band.
  float ringDist = length(vec2(planetUv.x, planetUv.y * 2.4));
  float planetRadius = 0.052;
  float ringMask = smoothstep(planetRadius * 1.55, planetRadius * 1.7, ringDist) -
                    smoothstep(planetRadius * 2.25, planetRadius * 2.5, ringDist);

  // The planet isn't self-luminous like a sun/moon, so it's lit rather than
  // flat-colored: a shared lit-sphere helper gives it a real day/night
  // terminator (shaded toward the actual sun direction) with a crisp solid
  // edge, not celestialBody's soft self-luminous glow.
  float distToPlanet = length(planetUv);
  float planetMask = hardDiscMask(auv, planetCenter, planetRadius);
  float shade = litSphereShade(auv, planetCenter, planetRadius, sunDir, 0.10);
  vec3 planetBase = vec3(0.78, 0.58, 0.46);
  vec3 planetColor = planetBase * shade;

  // Same sun direction, applied in-plane to the ring — the side nearer the
  // sun reads brighter, the far side dimmer.
  float ringLight = clamp(dot(normalize(planetUv), sunDir) * 0.5 + 0.5, 0.0, 1.0);
  vec3 ringColor = vec3(0.68, 0.58, 0.52) * mix(0.35, 1.0, ringLight);

  col = mix(col, ringColor, ringMask * uSpaceT * 0.55);
  col = mix(col, planetColor, planetMask * uSpaceT);

  // Moons: same lit-sphere + hard-edge treatment as the planet, each shaded
  // toward its own direction to the sun rather than glowing on their own.
  vec2 moonACenter = vec2(0.14 * aspect, HORIZON + 0.44);
  vec2 moonBCenter = vec2(0.88 * aspect, HORIZON + 0.14);
  float moonARadius = 0.016;
  float moonBRadius = 0.013;
  float moonAMask = hardDiscMask(auv, moonACenter, moonARadius);
  float moonBMask = hardDiscMask(auv, moonBCenter, moonBRadius);
  float moonAShade = litSphereShade(auv, moonACenter, moonARadius, normalize(sunCenter - moonACenter), 0.06);
  float moonBShade = litSphereShade(auv, moonBCenter, moonBRadius, normalize(sunCenter - moonBCenter), 0.06);
  vec3 moonColor = vec3(0.86, 0.84, 0.80);
  col = mix(col, moonColor * moonAShade, moonAMask * uSpaceT);
  col = mix(col, moonColor * moonBShade, moonBMask * uSpaceT);

  // Dune layers, painted far to near. Each is shaded by its own slope
  // relative to the sun (a real sculpted light/shadow gradient across every
  // mound) rather than flat color plus noise unrelated to the actual shape —
  // the wind-ripple texture is now just a subtle grain on top of that, not
  // the primary source of variation.
  for (int i = 0; i < LAYERS; i++) {
    float t = float(i) / float(LAYERS - 1);

    float freq = mix(1.6, 0.6, t);
    float amp = mix(0.022, 0.10, t);
    float base = mix(HORIZON - 0.006, HORIZON - 0.16, t);
    float speed = mix(0.0015, 0.0110, t);
    float phase = uTime * speed + uSeed * 9.0 + float(i) * 19.3;

    float x = auv.x * freq + phase;
    float h = base + duneFbm(x) * amp;

    if (uv.y < h) {
      // Central-difference slope of this layer's own height field, in
      // screen space, so each dune face reads as tilting toward or away
      // from the sun rather than being a uniformly flat color.
      float dx = 0.001;
      float hL = base + duneFbm(x - dx * freq) * amp;
      float hR = base + duneFbm(x + dx * freq) * amp;
      float slope = (hR - hL) / (2.0 * dx);
      vec2 normal = normalize(vec2(-slope, 1.0));
      vec2 lightDir = normalize(vec2(sunX * aspect - auv.x, 0.9));
      float lighting = clamp(dot(normal, lightDir), 0.0, 1.0);
      float slopeShade = mix(0.82, 1.12, pow(lighting, 1.2));

      // Depth gradient: the crest catches full sun, but the dune's own bulk
      // curves away from it and falls into its own shadow just below —
      // without this, each layer reads as one flat fill down to the next
      // ridge line rather than a rounded mound with actual volume.
      float depthT = clamp((h - uv.y) / (amp * 1.4), 0.0, 1.0);
      float depthShade = mix(1.08, 0.58, pow(depthT, 0.6));

      vec3 ridge = mix(farDune, nearDune, t * t) * slopeShade * depthShade;
      float ripple = fbm2(vec2(auv.x * 42.0 + uSeed * 3.0, uv.y * 42.0 + float(i) * 5.0));
      ridge *= 0.95 + 0.08 * ripple;
      col = ridge;
    }
  }

  // Creatures: a camel walking the near ridge in normal mode, cross-fading
  // to a sandworm undulating along the horizon in space mode.
  float camelM = camelMask(auv, aspect);
  vec3 camelColor = vec3(0.30, 0.19, 0.11);
  col = mix(col, camelColor, camelM * (1.0 - uSpaceT));

  float wormM = sandwormMask(auv, aspect);
  vec3 wormColor = vec3(0.55, 0.20, 0.12);
  col = mix(col, wormColor, wormM * uSpaceT);

  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
