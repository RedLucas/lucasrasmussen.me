import { useCallback, useState, type ComponentType } from 'react';
import LandscapeBg from './components/LandscapeBg';
import DesertBg from './components/DesertBg';
import TundraBg from './components/TundraBg';
import RainforestBg from './components/RainforestBg';
import OceanBg from './components/OceanBg';

export interface BackgroundThemeComponentProps {
  spaceMode: boolean;
}

export interface BackgroundTheme {
  id: string;
  label: string;
  Component: ComponentType<BackgroundThemeComponentProps>;
}

// The wallpaper is a swappable "theme" rather than a single hardcoded
// component, so adding another procedural scene later is just another entry
// here — nothing in App.tsx or the taskbar menu needs to change.
export const BACKGROUND_THEMES: BackgroundTheme[] = [
  { id: 'sunset', label: 'Sunset Ridge', Component: LandscapeBg },
  { id: 'desert', label: 'Dune Sea', Component: DesertBg },
  { id: 'tundra', label: 'Polar Aurora', Component: TundraBg },
  { id: 'rainforest', label: 'Rainforest Canopy', Component: RainforestBg },
  { id: 'ocean', label: 'Open Ocean', Component: OceanBg },
];

// A plain module-scope `const` narrowed by this guard doesn't stay narrowed
// inside other functions declared below (TS's control-flow analysis is per
// function, not global), so this is a function returning the guaranteed-
// non-undefined first theme rather than a top-level constant.
function firstTheme(): BackgroundTheme {
  const first = BACKGROUND_THEMES[0];
  if (!first) throw new Error('BACKGROUND_THEMES must not be empty');
  return first;
}

const STORAGE_KEY = 'lr-background-theme';

function readStoredThemeId(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return BACKGROUND_THEMES.some((theme) => theme.id === stored) && stored !== null
      ? stored
      : firstTheme().id;
  } catch {
    // Storage disabled/unavailable — just fall back, nothing to persist.
    return firstTheme().id;
  }
}

export interface UseBackgroundThemeResult {
  theme: BackgroundTheme;
  themeId: string;
  selectTheme: (id: string) => void;
}

export function useBackgroundTheme(): UseBackgroundThemeResult {
  const [themeId, setThemeId] = useState(readStoredThemeId);

  // Direct-pick rather than cycling, now that the taskbar UI is a dropdown
  // listing every theme by name. Ignores unknown ids defensively — the menu
  // itself only ever passes ids from BACKGROUND_THEMES, so this only matters
  // if that ever changes.
  const selectTheme = useCallback((id: string) => {
    if (!BACKGROUND_THEMES.some((theme) => theme.id === id)) return;
    setThemeId(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Best-effort; a disabled/full localStorage just means the choice
      // doesn't survive a reload.
    }
  }, []);

  const theme = BACKGROUND_THEMES.find((candidate) => candidate.id === themeId) ?? firstTheme();
  return { theme, themeId, selectTheme };
}
