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

// Terrain height at world x, matching the near (foreground) ice layer's own
// parameters from the layer loop below — so a walking creature's feet land
// exactly on the ridge silhouette.
float terrainHeightAt(float x) {
  float freq = 0.8;
  float amp = 0.09;
  float base = HORIZON - 0.14;
  float speed = 0.014;
  float xf = x * freq + uTime * speed + uSeed * 11.0 + float(LAYERS - 1) * 23.1;
  return base + ridgeFbm(xf) * amp;
}

// A polar bear walking the ice horizon: body/head plus two legs alternating
// in antiphase for a walk cycle, feet planted on the terrain.
float bearMask(vec2 auv, float aspect) {
  float speed = 0.018;
  float travel = fract(uTime * speed + uSeed * 4.0);
  float xRange = aspect + 0.3;
  float x = travel * xRange - 0.15;
  float groundY = terrainHeightAt(x);

  vec2 hip = vec2(x, groundY + 0.022);
  vec2 shoulder = vec2(x - 0.034, groundY + 0.024);
  vec2 head = vec2(x - 0.048, groundY + 0.030);

  float body = capsuleMask(auv, hip, shoulder, 0.015);
  float headM = capsuleMask(auv, shoulder, head, 0.010);

  float legPhase = uTime * 2.6;
  float legSwingBack = sin(legPhase) * 0.018;
  float legSwingFront = -sin(legPhase) * 0.018;
  vec2 legBackTop = hip - vec2(0.002, 0.004);
  vec2 legBackBot = vec2(legBackTop.x + legSwingBack, groundY);
  vec2 legFrontTop = shoulder - vec2(-0.002, 0.006);
  vec2 legFrontBot = vec2(legFrontTop.x + legSwingFront, groundY);
  float legBack = capsuleMask(auv, legBackTop, legBackBot, 0.006);
  float legFront = capsuleMask(auv, legFrontTop, legFrontBot, 0.006);

  return max(body, max(headM, max(legBack, legFront)));
}

// Space mode: an alien "sky manta" gliding through the aurora band — a
// body plus two long wings that undulate rather than flap, wingtips
// returned so the caller can add a soft glow.
float mantaMask(vec2 auv, float aspect, out vec2 wingTipL, out vec2 wingTipR) {
  float speed = 0.02;
  float travel = fract(uTime * speed + uSeed * 8.0);
  float xRange = aspect + 0.4;
  float x = travel * xRange - 0.2;
  float y = HORIZON + 0.35 + sin(uTime * 0.2 + uSeed * 2.0) * 0.05;
  vec2 center = vec2(x, y);
  float undulate = sin(uTime * 1.2 + uSeed) * 0.15;
  vec2 dirL = normalize(vec2(-1.0, undulate));
  vec2 dirR = normalize(vec2(1.0, -undulate));
  wingTipL = center + dirL * 0.05;
  wingTipR = center + dirR * 0.05;
  float body = capsuleMask(auv, center, center - vec2(0.02, 0.0), 0.012);
  float wl = capsuleMask(auv, center, wingTipL, 0.008);
  float wr = capsuleMask(auv, center, wingTipR, 0.008);
  return max(body, max(wl, wr));
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

  // Creatures: a polar bear walking the ice horizon in normal mode,
  // cross-fading to an alien sky manta gliding through the aurora in space
  // mode.
  float bearM = bearMask(auv, aspect);
  vec3 bearColor = vec3(0.72, 0.74, 0.76);
  col = mix(col, bearColor, bearM * (1.0 - uSpaceT));

  vec2 mantaWingL;
  vec2 mantaWingR;
  float mantaM = mantaMask(auv, aspect, mantaWingL, mantaWingR);
  vec3 mantaColor = vec3(0.55, 0.65, 1.0);
  float mantaGlowL = exp(-length(auv - mantaWingL) * 120.0) * 0.35;
  float mantaGlowR = exp(-length(auv - mantaWingR) * 120.0) * 0.35;
  col += mantaColor * (mantaGlowL + mantaGlowR) * uSpaceT;
  col = mix(col, mantaColor, mantaM * uSpaceT);

  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
