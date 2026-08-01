import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSpaceRamp } from './spaceRamp.js';

describe('createSpaceRamp', () => {
  let now;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    now = 100; // nonzero baseline so `changedAt` never coincides with the
    // function's own "no ramp in progress" sentinel value of 0.
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('starts settled at the initial value with no target change', () => {
    expect(createSpaceRamp(true)(true)).toBe(1);
    expect(createSpaceRamp(false)(false)).toBe(0);
  });

  it('eases from 0 to 1 over RAMP_MS when turned on, then settles', () => {
    const ramp = createSpaceRamp(false);
    expect(ramp(false)).toBe(0);

    ramp(true); // begins the ramp at now=100
    now = 100 + 425; // halfway through the 850ms ramp
    const mid = ramp(true);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);

    now = 100 + 850;
    expect(ramp(true)).toBe(1);

    now = 100 + 2000;
    expect(ramp(true)).toBe(1); // stays settled, no further recomputation needed
  });

  it('eases back down when turned off again mid-ramp', () => {
    const ramp = createSpaceRamp(false);
    ramp(true);
    now += 850;
    expect(ramp(true)).toBe(1);

    ramp(false);
    now += 425;
    const mid = ramp(false);
    expect(mid).toBeLessThan(1);
    expect(mid).toBeGreaterThan(0);

    now += 850;
    expect(ramp(false)).toBe(0);
  });

  it('snaps instantly under prefers-reduced-motion instead of easing', () => {
    window.matchMedia = () => ({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    const ramp = createSpaceRamp(false);
    expect(ramp(true)).toBe(1);
    // No further easing needed on the next call — already settled.
    now += 1;
    expect(ramp(true)).toBe(1);
  });
});
