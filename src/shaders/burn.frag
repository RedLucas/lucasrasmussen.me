// Burns away a captured snapshot of the resume, seeded differently every
// close so the pattern is never the same twice. Four zones per pixel:
// untouched (sample the texture as-is), a thin active ember edge, charred
// ash fading to fully transparent just behind it — revealing whatever is
// actually behind the modal (the landscape), not another flat layer, since
// the live resume and the modal's own background are both hidden for the
// duration of the burn (see BurnTransition.jsx/App.jsx) — and a trail of
// wispy smoke that lingers a little past each pixel's own char fade before
// dissipating, independent of the (already-zero) char alpha underneath it.
// The fire radiates outward from a random point on the page (uOrigin)
// rather than sweeping edge to edge, and the paper warps/darkens slightly
// just ahead of the front to read as curling away rather than dissolving flat.
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uProgress; // 0 (untouched) -> past 1 (fully gone)
uniform float uSeed;
uniform vec2 uOrigin; // ignition point, plain 0..1 uv space

// --- noise (ported from landscape.frag) ---------------------------------

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm2(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += noise2(p) * amp;
    p = p * 2.0 + 17.0;
    amp *= 0.5;
  }
  return sum;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 auv = vec2(uv.x * aspect, uv.y);
  vec2 origin = vec2(uOrigin.x * aspect, uOrigin.y);

  // Radial distance from the random ignition point, normalized against the
  // full diagonal so progress reaches every corner regardless of where the
  // origin happens to land — this is what gives the burn an expanding front
  // from a single point rather than a sweep from one edge to another.
  float diag = length(vec2(aspect, 1.0));
  float front = length(auv - origin) / diag;

  // A coarse layer roughens the front's shape; a finer layer breaks up its
  // edge so it reads as an organic char line, not a smooth ring.
  float coarse = fbm2(auv * 2.2 + uSeed * 13.0) - 0.5;
  float fine = fbm2(auv * 9.0 + uSeed * 41.0 + 100.0) - 0.5;
  float roughness = coarse * 0.35 + fine * 0.12;

  // Positive: not yet burned. Negative: already gone.
  float dist = (front + roughness) - uProgress;
  float edgeWidth = 0.075;

  // Curl: just ahead of the front, warp the sampled texture coordinate
  // toward the ignition point and darken slightly, so the paper reads as
  // lifting/rolling away from the fire rather than dissolving flat in
  // place. curlT ramps 0 (untouched, far from the front) -> 1 (already
  // past it), spread out over a much wider band than the ember edge itself
  // so the lift is visible just before ignition, not only at the instant of.
  float curlT = 1.0 - smoothstep(-edgeWidth * 2.0, edgeWidth * 5.0, dist);
  vec2 towardOrigin = auv - origin;
  float towardLen = length(towardOrigin);
  vec2 curlDir = towardLen > 0.0001 ? towardOrigin / towardLen : vec2(0.0, 1.0);
  vec2 curlPerp = vec2(-curlDir.y, curlDir.x);
  float wobble = (fbm2(auv * 6.0 + uSeed * 19.0) - 0.5) * 0.6;
  vec2 curlOffset = (-curlDir + curlPerp * wobble) * curlT * 0.045;
  vec2 sampleUv = clamp(uv + vec2(curlOffset.x / aspect, curlOffset.y), 0.0, 1.0);

  vec4 src = texture2D(uTexture, sampleUv);
  src.rgb *= 1.0 - curlT * 0.35;

  if (dist > edgeWidth) {
    gl_FragColor = src;
    return;
  }

  if (dist > 0.0) {
    // Active ember edge: blend toward a hot core, plus a genuine additive
    // bloom right at the peak so the hottest point actually reads as
    // blown-out bright rather than just a flat saturated color. uProgress
    // itself advances every frame, so sampling noise against it gives a
    // real flicker rather than a static gradient.
    float edgeT = 1.0 - dist / edgeWidth;
    float flicker = fbm2(auv * 30.0 + uProgress * 40.0 + uSeed * 7.0);
    vec3 emberCore = vec3(1.0, 0.75, 0.15);
    vec3 emberOuter = vec3(0.95, 0.12, 0.02);
    vec3 ember = mix(emberOuter, emberCore, clamp(flicker * 1.5, 0.0, 1.0));
    vec3 blended = mix(src.rgb, ember, edgeT);
    blended += ember * pow(edgeT, 1.5) * 0.55;
    gl_FragColor = vec4(blended, src.a);
    return;
  }

  // Just behind the edge: char to near-black ash, then fade to fully
  // transparent so it reads as crumbling away rather than a hard cutout.
  float charWidth = 0.10;
  float charT = clamp(-dist / charWidth, 0.0, 1.0);
  vec3 charColor = mix(vec3(0.05, 0.03, 0.02), vec3(0.0), charT);
  float charAlpha = src.a * (1.0 - smoothstep(0.0, 1.0, charT));

  // Smoke: a thick wispy trail that rises just behind the char front and
  // lingers well after the paper there is already fully gone, independent
  // of charAlpha (which has already faded to 0 by this point). `age` is how
  // far past the front this pixel sits — a stand-in for "how long ago this
  // patch burned", since a stateless per-pixel shader has no real burn
  // history to read. The envelope rises fast, then decays slowly enough
  // that every burn visibly leaves smoke behind rather than a quick wisp;
  // BurnTransition's completion cutoff (finishAt) is sized to give the last
  // patch to burn time to fully dissipate before it fires.
  float age = -dist;
  float envelope = smoothstep(0.0, 0.04, age) * exp(-age * 3.3);
  vec2 driftUv = auv * 5.0 + vec2(0.6, -1.0) * (age + uProgress * 0.6) + uSeed * 23.0;
  float wisp = fbm2(driftUv);
  wisp = smoothstep(0.35, 0.75, wisp);
  float smokeAlpha = envelope * wisp * 0.5;
  vec3 smokeColor = vec3(0.5, 0.49, 0.47);

  vec3 finalColor = mix(charColor, smokeColor, smokeAlpha);
  float finalAlpha = max(charAlpha, smokeAlpha);
  gl_FragColor = vec4(finalColor, finalAlpha);
}
