// Persists a single procedural-generation seed across reloads, so a theme's
// specific arrangement (palette, ridge/dune/wave/aurora shapes, sun/planet
// placement, etc.) stays the same between visits — reloading only moves
// what's genuinely time-based (the sun's day/night cycle, ambient drift).
// "Clear Cache" already wipes all of localStorage and reloads, which
// naturally rerolls this too, so it doesn't need its own reset path.
const STORAGE_KEY = 'lr-scene-seed';

let cachedSeed: number | null = null;

export function getSceneSeed(): number {
  if (cachedSeed !== null) return cachedSeed;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored === null ? NaN : Number(stored);
    if (Number.isFinite(parsed)) {
      cachedSeed = parsed;
      return cachedSeed;
    }
  } catch {
    // Storage disabled/unavailable — fall through to a fresh, unpersisted seed.
  }

  cachedSeed = Math.random() * 100;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(cachedSeed));
  } catch {
    // Best-effort; a disabled/full localStorage just means it won't persist.
  }
  return cachedSeed;
}
