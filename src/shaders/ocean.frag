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
  float moonMask = hardDiscMask(auv, moonCenter, moonRadius, uResolution);
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

  col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
