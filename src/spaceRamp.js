// Shared easing for the "space mode" transition every background theme
// component uses: each one calls this once per frame from its own draw()
// loop, feeding the result to its shader as uSpaceT. Smoothstep-ramps
// between 0/1 over RAMP_MS whenever the target flips, rather than popping
// instantly, matching the codebase's existing taste for continuous blends
// (the palette mix, the sun-cycle bob) — except under reduced motion, where
// it snaps straight to the target, matching how the rest of each scene
// already freezes rather than animates for that preference.
const RAMP_MS = 850;

export function createSpaceRamp(initialOn) {
  let current = initialOn ? 1 : 0;
  let from = current;
  let target = current;
  let changedAt = 0; // 0 means "already settled" — no ramp in progress
  let last = initialOn;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  return function update(targetOn) {
    if (targetOn !== last) {
      last = targetOn;
      target = targetOn ? 1 : 0;
      if (reduceMotion.matches) {
        current = target;
        changedAt = 0;
      } else {
        from = current;
        changedAt = performance.now();
      }
    }
    if (changedAt === 0) return current;
    const t = Math.min((performance.now() - changedAt) / RAMP_MS, 1);
    const eased = t * t * (3 - 2 * t);
    current = from + (target - from) * eased;
    if (t >= 1) changedAt = 0; // settled; stop recomputing a finished ramp
    return current;
  };
}
