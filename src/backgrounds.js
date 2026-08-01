import { useCallback, useState } from 'react';
import LandscapeBg from './components/LandscapeBg.jsx';
import DesertBg from './components/DesertBg.jsx';
import TundraBg from './components/TundraBg.jsx';
import RainforestBg from './components/RainforestBg.jsx';
import OceanBg from './components/OceanBg.jsx';

// The wallpaper is a swappable "theme" rather than a single hardcoded
// component, so adding another procedural scene later is just another entry
// here — nothing in App.jsx or the taskbar menu needs to change.
export const BACKGROUND_THEMES = [
  { id: 'sunset', label: 'Sunset Ridge', Component: LandscapeBg },
  { id: 'desert', label: 'Dune Sea', Component: DesertBg },
  { id: 'tundra', label: 'Polar Aurora', Component: TundraBg },
  { id: 'rainforest', label: 'Rainforest Canopy', Component: RainforestBg },
  { id: 'ocean', label: 'Open Ocean', Component: OceanBg },
];

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

  // Direct-pick rather than cycling, now that the taskbar UI is a dropdown
  // listing every theme by name. Ignores unknown ids defensively — the menu
  // itself only ever passes ids from BACKGROUND_THEMES, so this only matters
  // if that ever changes.
  const selectTheme = useCallback((id) => {
    if (!BACKGROUND_THEMES.some((theme) => theme.id === id)) return;
    setThemeId(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Best-effort; a disabled/full localStorage just means the choice
      // doesn't survive a reload.
    }
  }, []);

  const theme =
    BACKGROUND_THEMES.find((candidate) => candidate.id === themeId) ?? BACKGROUND_THEMES[0];
  return { theme, themeId, selectTheme };
}
