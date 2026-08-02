// Burns away a captured snapshot of the resume, seeded differently every
// close so the pattern is never the same twice. Four zones per pixel:
// untouched (sample the texture as-is), a thin active ember edge, charred
// ash fading to fully transparent just behind it — revealing whatever is
// actually behind the modal (the landscape), not another flat layer, since
// the live resume and the modal's own background are both hidden for the
// duration of the burn (see BurnTransition.jsx/App.jsx) — and a trail of
// wispy smoke that stays fully present once it appears, rather than
// dissipating on its own; the whole scene only fades away in one final
// dissolve right before the burn completes (see uFinishAt below).
// The fire radiates outward from a random point on the page (uOrigin)
// rather than sweeping edge to edge, and the paper warps/darkens slightly
// just ahead of the front to read as curling away rather than dissolving flat.
//
// This canvas now covers the whole viewport rather than just the résumé's
// own box (see BurnTransition.tsx) so smoke can drift beyond the paper's
// edges instead of being clipped by the modal's overflow:hidden. uRect is
// where that paper actually lives within this larger canvas (0..1, in the
// same bottom-up space as gl_FragCoord) — the fire/char/paper logic below
// only ever runs inside it, exactly as when the canvas was rect-sized, and
// everything outside it is smoke (or nothing) drifting across open space.
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec4 uRect; // paper's on-screen box within this canvas: x0,y0,x1,y1
uniform float uProgress; // 0 (untouched) -> past 1 (fully gone)
uniform float uSeed;
uniform vec2 uOrigin; // ignition point, plain 0..1 uv space within uRect
uniform float uFinishAt; // matches BurnTransition.jsx's completion cutoff

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

// Smoke: a thick wispy trail that rises just behind the char front and
// stays fully present — no per-pixel decay — so every burn visibly leaves
// smoke hanging in the air instead of watching it dissipate mid-animation.
// `front`/`dist` are the same radial burn-front values as the paper itself
// uses, just evaluated arbitrarily far outside uRect too (auv is a plain
// affine extension of the paper's own coordinate space — see main()) so the
// smoke can keep drifting past the paper's edges rather than stopping dead
// at them. `reachMask` is what keeps that from turning into full-screen fog:
// past a couple of paper-diagonals from the ignition point, smoke is masked
// out entirely regardless of how long the burn has been running.
vec4 smokeAt(vec2 auv, float dist, float front) {
  float age = -dist;
  float envelope = smoothstep(0.0, 0.04, age);
  vec2 driftUv = auv * 5.0 + vec2(0.6, -1.0) * (age + uProgress * 0.6) + uSeed * 23.0;
  float wisp = fbm2(driftUv);
  wisp = smoothstep(0.35, 0.75, wisp);
  float smokeAlpha = envelope * wisp * 0.55;

  float smokeReach = 1.8;
  float reachMask = 1.0 - smoothstep(smokeReach * 0.6, smokeReach, front);
  smokeAlpha *= reachMask;

  // Only smoke gets an explicit end fade, and only right at the very end —
  // char is left alone, since it already burns down to fully transparent on
  // its own as the front sweeps past. Fading the whole scene together,
  // including paper that had already fully burnt away, read as the picture
  // itself dissolving rather than the fire still working — smoke is the
  // only thing here that doesn't clear on its own.
  float smokeFade = smoothstep(uFinishAt * 0.85, uFinishAt, uProgress);
  smokeAlpha *= 1.0 - smokeFade;

  return vec4(0.5, 0.49, 0.47, smokeAlpha);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  // Remap into the paper's own 0..1 space (matching exactly what `uv` was
  // before this canvas grew to cover the whole viewport) — this extends
  // linearly outside uRect rather than clamping, so distances computed from
  // it stay physically continuous right across the paper's edges.
  vec2 rectMin = uRect.xy;
  vec2 rectMax = uRect.zw;
  vec2 texUv = (uv - rectMin) / (rectMax - rectMin);
  bool insideRect = texUv.x >= 0.0 && texUv.x <= 1.0 && texUv.y >= 0.0 && texUv.y <= 1.0;

  float rectAspect =
    ((rectMax.x - rectMin.x) * uResolution.x) / ((rectMax.y - rectMin.y) * uResolution.y);
  vec2 auv = vec2(texUv.x * rectAspect, texUv.y);
  vec2 origin = vec2(uOrigin.x * rectAspect, uOrigin.y);

  // Radial distance from the random ignition point, normalized against the
  // paper's own diagonal so progress reaches every corner of it regardless
  // of where the origin happens to land — this is what gives the burn an
  // expanding front from a single point rather than a sweep from one edge
  // to another.
  float diag = length(vec2(rectAspect, 1.0));
  float front = length(auv - origin) / diag;

  // A coarse layer roughens the front's shape; a finer layer breaks up its
  // edge so it reads as an organic char line, not a smooth ring.
  float coarse = fbm2(auv * 2.2 + uSeed * 13.0) - 0.5;
  float fine = fbm2(auv * 9.0 + uSeed * 41.0 + 100.0) - 0.5;
  float roughness = coarse * 0.35 + fine * 0.12;

  // Positive: not yet burned. Negative: already gone.
  float dist = (front + roughness) - uProgress;
  float edgeWidth = 0.075;

  if (!insideRect) {
    // Nothing to burn out here — just smoke that's already drifted this
    // far, or empty space it hasn't reached yet.
    if (dist > 0.0) {
      gl_FragColor = vec4(0.0);
      return;
    }
    gl_FragColor = smokeAt(auv, dist, front);
    return;
  }

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
  vec2 sampleUv = clamp(texUv + vec2(curlOffset.x / rectAspect, curlOffset.y), 0.0, 1.0);

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

  // Proper (non-premultiplied) "smoke over char" compositing rather than a
  // plain mix() weighted only by smoke.a — that would keep pulling the
  // result toward charColor even once charAlpha has faded to ~0, leaving a
  // visible dark seam right at the paper's edge where this blends against
  // the outside-rect branch's pure smoke (see smokeAt/main above), which
  // has no char layer to tint it.
  vec4 smoke = smokeAt(auv, dist, front);
  float finalAlpha = smoke.a + charAlpha * (1.0 - smoke.a);
  vec3 finalColor = finalAlpha > 0.0001
    ? (smoke.rgb * smoke.a + charColor * charAlpha * (1.0 - smoke.a)) / finalAlpha
    : vec3(0.0);

  gl_FragColor = vec4(finalColor, finalAlpha);
}
