// Procedural open ocean: the same layered far-to-near band technique as the
// sunset/desert/tundra foregrounds, but the ridge height field is replaced
// with a periodic sine+noise wave field, plus a foam highlight at each
// crest and a noise-broken sun-glitter streak on the water. Noise/fbm/
// celestial-body/starField helpers live in common.glsl, concatenated ahead
// of this source (see OceanBg.jsx). Space mode ("Alien Tide") shifts the sky
// to a pale green/violet atmosphere with visible stars, adds a second moon
// (with its own glitter streak), and recolors the foam to glowing cyan.

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uSpaceT; // 0 (normal) -> 1 (space mode), eased in JS

const int LAYERS = 6;
const float HORIZON = 0.52;

// Periodic sine+noise field — waves are regular and repeating, unlike the
// random-walk ridgeFbm used for mountains/dunes/ice.
float waveField(float x) {
  float sum = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 5; i++) {
    sum += sin(x * freq + float(i) * 2.1) * amp;
    freq *= 1.9;
    amp *= 0.55;
  }
  return sum;
}

// A noise-broken specular streak beneath a light source, standing in for
// sunlight/moonlight glinting off chopped water.
float glitter(vec2 auv, float lightX, float horizonY) {
  float band = smoothstep(0.09, 0.0, abs(auv.x - lightX));
  float below = smoothstep(horizonY + 0.02, horizonY - 0.35, auv.y);
  float sparkle = fbm2(vec2(auv.x * 30.0, auv.y * 40.0 - uTime * 1.5));
  sparkle = smoothstep(0.55, 0.85, sparkle);
  return band * below * sparkle;
}

// A small fish: an elongated body plus a wagging tail fin, looping across
// the surface in its own lane. `idx` (0, 1, 2...) offsets lane/phase/speed
// so a handful read as a loose school rather than identical clones.
float fishMask(vec2 auv, float aspect, float idx) {
  float speed = 0.045 + idx * 0.012;
  float travel = fract(uTime * speed + uSeed * (3.0 + idx * 4.0) + idx * 0.27);
  float xRange = aspect + 0.3;
  float x = travel * xRange - 0.15;
  float laneY = HORIZON - 0.05 - idx * 0.02 + sin(uTime * 0.6 + idx) * 0.006;
  float bodyLen = 0.026;
  vec2 head = vec2(x, laneY);
  vec2 mid = head - vec2(bodyLen * 0.5, 0.0);
  float wag = sin(uTime * 7.0 + idx * 2.1) * 0.5;
  vec2 tailDir = normalize(vec2(-1.0, wag));
  vec2 tail = mid + tailDir * bodyLen * 0.6;
  float body = capsuleMask(auv, head, mid, 0.007);
  float tailFin = capsuleMask(auv, mid, tail, 0.004);
  return max(body, tailFin);
}

// A whale surfacing and swimming across, slow body drift plus an
// independently swishing tail fluke.
float whaleMask(vec2 auv, float aspect) {
  float speed = 0.018;
  float travel = fract(uTime * speed + uSeed * 11.0);
  float xRange = aspect + 0.4;
  float x = travel * xRange - 0.2;
  float y = HORIZON - 0.09 + sin(uTime * 0.25 + uSeed) * 0.01;
  vec2 head = vec2(x, y);
  vec2 mid = head - vec2(0.09, 0.0);
  vec2 tailBase = mid - vec2(0.05, 0.0);
  float swish = sin(uTime * 1.4 + uSeed * 3.0) * 0.4;
  vec2 flukeDir = normalize(vec2(-1.0, swish));
  vec2 flukeTip = tailBase + flukeDir * 0.05;
  float body = capsuleMask(auv, head, mid, 0.028);
  float taper = capsuleMask(auv, mid, tailBase, 0.014);
  float fluke = capsuleMask(auv, tailBase, flukeTip, 0.010);
  return max(max(body, taper), fluke);
}

// Space mode: a bioluminescent alien jellyfish/squid drifting across, with
// trailing tentacles that each undulate independently — a short unrolled
// chain per tentacle, each joint's angle offset by a sine wave staggered by
// both its position down the chain and which tentacle it belongs to.
float squidMask(vec2 auv, float aspect) {
  float speed = 0.02;
  float travel = fract(uTime * speed + uSeed * 17.0);
  float xRange = aspect + 0.3;
  float x = travel * xRange - 0.15;
  float y = HORIZON - 0.12 + sin(uTime * 0.3 + uSeed * 2.0) * 0.02;
  vec2 bellCenter = vec2(x, y);
  float bellRadius = 0.03;
  float bell = 1.0 - smoothstep(bellRadius * 0.9, bellRadius * 1.1, length(auv - bellCenter));

  float tentacles = 0.0;
  for (int t = 0; t < 4; t++) {
    float ft = float(t);
    vec2 p0 = bellCenter + vec2((ft - 1.5) * 0.012, -bellRadius * 0.6);
    for (int s = 0; s < 3; s++) {
      float fs = float(s);
      float angle = -1.4 + sin(uTime * 2.2 - fs * 1.1 - ft * 0.7 + uSeed) * 0.5;
      vec2 dir = vec2(sin(angle), -cos(angle));
      vec2 p1 = p0 + dir * 0.018;
      tentacles = max(tentacles, capsuleMask(auv, p0, p1, 0.004));
      p0 = p1;
    }
  }
  return max(bell, tentacles);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 auv = vec2(uv.x * aspect, uv.y);

  vec3 zenith = vec3(0.04, 0.10, 0.30);
  vec3 mid = vec3(0.14, 0.34, 0.52);
  vec3 horizonCol = vec3(0.55, 0.68, 0.68);
  vec3 sunCol = vec3(1.0, 0.97, 0.85);
  vec3 farWater = vec3(0.10, 0.32, 0.42);
  vec3 nearWater = vec3(0.02, 0.10, 0.20);
  vec3 foamColor = vec3(0.85, 0.95, 0.95);

  vec3 spaceZenith = vec3(0.06, 0.05, 0.18);
  vec3 spaceMid = vec3(0.20, 0.30, 0.30);
  vec3 spaceHorizon = vec3(0.55, 0.70, 0.55);
  vec3 spaceFoam = vec3(0.35, 0.95, 0.90);
  zenith = mix(zenith, spaceZenith, uSpaceT);
  mid = mix(mid, spaceMid, uSpaceT);
  horizonCol = mix(horizonCol, spaceHorizon, uSpaceT);
  foamColor = mix(foamColor, spaceFoam, uSpaceT);

  float sky = smoothstep(HORIZON - 0.04, 1.0, uv.y);
  vec3 col = mix(horizonCol, mid, pow(sky, 0.6));
  col = mix(col, zenith, pow(sky, 1.7));

  float starMask = smoothstep(0.3, 0.7, sky) * uSpaceT;
  col += vec3(0.9, 0.95, 1.0) * starField(auv, uSeed + 80.0, 0.010) * starMask;

  float sunX = 0.24 + fract(uSeed * 5.47) * 0.55;
  vec2 sunCenter = vec2(sunX * aspect, HORIZON + 0.20);
  vec2 sun = celestialBody(auv, sunCenter, 0.045, 0.5);
  col += sunCol * sun.x;
  col = mix(col, sunCol, sun.y);
  col += sunCol * glitter(auv, sunCenter.x, HORIZON) * 0.8;

  // Space mode: a second moon, each light casting its own glitter streak. A
  // crisp lit-sphere edge (shaded toward the actual sun in this scene) rather
  // than celestialBody's soft self-luminous glow, since the moon is reflected
  // light, not its own light source.
  float moonX = fract(sunX + 0.4) * aspect;
  vec2 moonCenter = vec2(moonX, HORIZON + 0.30);
  float moonRadius = 0.028;
  float moonMask = hardDiscMask(auv, moonCenter, moonRadius);
  float moonShade = litSphereShade(auv, moonCenter, moonRadius, normalize(sunCenter - moonCenter), 0.08);
  vec3 moonColor = vec3(0.80, 0.85, 0.90);
  col = mix(col, moonColor * moonShade, moonMask * uSpaceT);
  col += moonColor * glitter(auv, moonCenter.x, HORIZON) * 0.6 * uSpaceT;

  // Wave layers, painted far to near, each with a foam crest highlight.
  for (int i = 0; i < LAYERS; i++) {
    float t = float(i) / float(LAYERS - 1);

    float freq = mix(2.6, 1.1, t);
    float amp = mix(0.012, 0.055, t);
    float base = mix(HORIZON - 0.006, HORIZON - 0.16, t);
    float speed = mix(0.5, 1.6, t);

    float x = auv.x * freq + uTime * speed * 0.4 + uSeed * 8.0 + float(i) * 15.7;
    float h = base + waveField(x) * amp;

    if (uv.y < h) {
      vec3 water = mix(farWater, nearWater, t * t);
      float foamT = smoothstep(h - amp * 0.18, h, uv.y);
      water = mix(water, foamColor, foamT * (0.5 + 0.5 * t));
      col = water;
    }
  }

  // Creatures: a small fish school and a surfacing whale in normal mode,
  // cross-fading to a bioluminescent alien squid in space mode — the same
  // "swap, don't stack" treatment as every other space-mode element.
  vec3 fishColor = vec3(0.05, 0.09, 0.14);
  for (int i = 0; i < 3; i++) {
    float m = fishMask(auv, aspect, float(i));
    col = mix(col, fishColor, m * (1.0 - uSpaceT));
  }
  vec3 whaleColor = vec3(0.04, 0.07, 0.10);
  float whaleM = whaleMask(auv, aspect);
  col = mix(col, whaleColor, whaleM * (1.0 - uSpaceT));

  vec3 squidColor = vec3(0.45, 0.95, 0.90);
  float squidM = squidMask(auv, aspect);
  col += squidColor * squidM * uSpaceT * 0.5;
  col = mix(col, squidColor, squidM * uSpaceT);

  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
