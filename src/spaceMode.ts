import { useCallback, useState } from 'react';

// Independent of theme choice (see backgrounds.js) — space mode applies to
// whichever theme happens to be active, so it's tracked and persisted
// separately rather than folded into the theme registry.
const STORAGE_KEY = 'lr-space-mode';

function readStoredSpaceMode(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // Storage disabled/unavailable — just fall back, nothing to persist.
    return false;
  }
}

export interface UseSpaceModeResult {
  spaceMode: boolean;
  toggleSpaceMode: () => void;
}

export function useSpaceMode(): UseSpaceModeResult {
  const [spaceMode, setSpaceMode] = useState(readStoredSpaceMode);

  const toggleSpaceMode = useCallback(() => {
    setSpaceMode((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // Best-effort; a disabled/full localStorage just means the choice
        // doesn't survive a reload.
      }
      return next;
    });
  }, []);

  return { spaceMode, toggleSpaceMode };
}
