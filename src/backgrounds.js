import { useCallback, useState } from 'react';
import LandscapeBg from './components/LandscapeBg.jsx';

// The wallpaper is a swappable "theme" rather than a single hardcoded
// component, so adding another procedural scene later is just another entry
// here — nothing in App.jsx or the taskbar action needs to change.
export const BACKGROUND_THEMES = [{ id: 'sunset', label: 'Sunset Ridge', Component: LandscapeBg }];

const STORAGE_KEY = 'lr-background-theme';

function readStoredThemeId() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return BACKGROUND_THEMES.some((theme) => theme.id === stored)
      ? stored
      : BACKGROUND_THEMES[0].id;
  } catch {
    // Storage disabled/unavailable — just fall back, nothing to persist.
    return BACKGROUND_THEMES[0].id;
  }
}

export function useBackgroundTheme() {
  const [themeId, setThemeId] = useState(readStoredThemeId);

  const cycleTheme = useCallback(() => {
    setThemeId((current) => {
      const index = BACKGROUND_THEMES.findIndex((theme) => theme.id === current);
      const next = BACKGROUND_THEMES[(index + 1) % BACKGROUND_THEMES.length];
      try {
        window.localStorage.setItem(STORAGE_KEY, next.id);
      } catch {
        // Best-effort; a disabled/full localStorage just means the choice
        // doesn't survive a reload.
      }
      return next.id;
    });
  }, []);

  const theme =
    BACKGROUND_THEMES.find((candidate) => candidate.id === themeId) ?? BACKGROUND_THEMES[0];
  return { theme, cycleTheme };
}
