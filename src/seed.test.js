import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('getSceneSeed', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('generates and persists a fresh seed when none is stored', async () => {
    const { getSceneSeed } = await import('./seed.js');
    const seed = getSceneSeed();
    expect(typeof seed).toBe('number');
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(100);
    expect(window.localStorage.getItem('lr-scene-seed')).toBe(String(seed));
  });

  it('reuses a previously stored seed instead of generating a new one', async () => {
    window.localStorage.setItem('lr-scene-seed', '42.5');
    const { getSceneSeed } = await import('./seed.js');
    expect(getSceneSeed()).toBe(42.5);
  });

  it('ignores a non-numeric stored value and generates a fresh seed', async () => {
    window.localStorage.setItem('lr-scene-seed', 'not-a-number');
    const { getSceneSeed } = await import('./seed.js');
    const seed = getSceneSeed();
    expect(Number.isFinite(seed)).toBe(true);
  });

  it('memoizes within a session even if localStorage changes afterward', async () => {
    const { getSceneSeed } = await import('./seed.js');
    const first = getSceneSeed();
    window.localStorage.setItem('lr-scene-seed', '999');
    expect(getSceneSeed()).toBe(first);
  });

  it('falls back to an unpersisted seed when reading localStorage throws', async () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    const { getSceneSeed } = await import('./seed.js');
    const seed = getSceneSeed();
    expect(typeof seed).toBe('number');
  });

  it('still returns a seed when writing to localStorage throws', async () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage full');
    });
    const { getSceneSeed } = await import('./seed.js');
    const seed = getSceneSeed();
    expect(typeof seed).toBe('number');
  });
});
