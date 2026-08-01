// Burns away a captured snapshot of the resume, seeded differently every
// close so the pattern is never the same twice. Three zones per pixel:
// untouched (sample the texture as-is), a thin active ember edge, and
// charred ash fading to fully transparent just behind it — revealing
// whatever is actually behind the modal (the landscape), not another flat
// layer, since the live resume and the modal's own background are both
// hidden for the duration of the burn (see BurnTransition.jsx/App.jsx).
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uProgress; // 0 (untouched) -> past 1 (fully gone)
uniform float uSeed;
uniform vec2 uDirection; // unit vector, the sweep's overall direction

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
  vec2 center = vec2(0.5 * aspect, 0.5);

  // Where this pixel sits along the sweep direction, normalized so the
  // whole diagonal spans roughly 0..1 — this is what gives the burn an
  // overall front rather than uniform popcorn dissolve.
  float diag = length(vec2(aspect, 1.0));
  float front = dot(auv - center, uDirection) / diag + 0.5;

  // A coarse layer roughens the front's shape; a finer layer breaks up its
  // edge so it reads as an organic char line, not a smooth arc.
  float coarse = fbm2(auv * 2.2 + uSeed * 13.0) - 0.5;
  float fine = fbm2(auv * 9.0 + uSeed * 41.0 + 100.0) - 0.5;
  float roughness = coarse * 0.35 + fine * 0.12;

  // Positive: not yet burned. Negative: already gone.
  float dist = (front + roughness) - uProgress;

  vec4 src = texture2D(uTexture, uv);
  float edgeWidth = 0.05;

  if (dist > edgeWidth) {
    gl_FragColor = src;
    return;
  }

  if (dist > 0.0) {
    // Active ember edge: blend toward a hot core. uProgress itself
    // advances every frame, so sampling noise against it gives a genuine
    // flicker rather than a static gradient.
    float edgeT = 1.0 - dist / edgeWidth;
    float flicker = fbm2(auv * 30.0 + uProgress * 40.0 + uSeed * 7.0);
    vec3 emberCore = vec3(1.0, 0.92, 0.55);
    vec3 emberOuter = vec3(0.85, 0.22, 0.05);
    vec3 ember = mix(emberOuter, emberCore, clamp(flicker * 1.4, 0.0, 1.0));
    gl_FragColor = vec4(mix(src.rgb, ember, edgeT), src.a);
    return;
  }

  // Just behind the edge: char to near-black ash, then fade to fully
  // transparent so it reads as crumbling away rather than a hard cutout.
  float charWidth = 0.10;
  float charT = clamp(-dist / charWidth, 0.0, 1.0);
  vec3 charColor = mix(vec3(0.05, 0.03, 0.02), vec3(0.0), charT);
  float alpha = src.a * (1.0 - smoothstep(0.0, 1.0, charT));
  gl_FragColor = vec4(charColor, alpha);
}
