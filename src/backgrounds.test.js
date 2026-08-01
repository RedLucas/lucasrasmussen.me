import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BACKGROUND_THEMES, useBackgroundTheme } from './backgrounds.js';

describe('BACKGROUND_THEMES', () => {
  it('lists all five themes with unique ids', () => {
    expect(BACKGROUND_THEMES).toHaveLength(5);
    const ids = BACKGROUND_THEMES.map((theme) => theme.id);
    expect(new Set(ids).size).toBe(5);
    expect(ids).toEqual(['sunset', 'desert', 'tundra', 'rainforest', 'ocean']);
  });

  it('gives every theme a label and a component', () => {
    for (const theme of BACKGROUND_THEMES) {
      expect(typeof theme.label).toBe('string');
      expect(theme.label.length).toBeGreaterThan(0);
      expect(typeof theme.Component).toBe('function');
    }
  });
});

describe('useBackgroundTheme', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to the first theme when nothing is stored', () => {
    const { result } = renderHook(() => useBackgroundTheme());
    expect(result.current.themeId).toBe(BACKGROUND_THEMES[0].id);
    expect(result.current.theme).toBe(BACKGROUND_THEMES[0]);
  });

  it('reads a previously stored valid theme id', () => {
    window.localStorage.setItem('lr-background-theme', 'ocean');
    const { result } = renderHook(() => useBackgroundTheme());
    expect(result.current.themeId).toBe('ocean');
  });

  it('falls back to the first theme for an unknown stored id', () => {
    window.localStorage.setItem('lr-background-theme', 'nonexistent');
    const { result } = renderHook(() => useBackgroundTheme());
    expect(result.current.themeId).toBe(BACKGROUND_THEMES[0].id);
  });

  it('selects a theme and persists the choice', () => {
    const { result } = renderHook(() => useBackgroundTheme());
    act(() => result.current.selectTheme('tundra'));
    expect(result.current.themeId).toBe('tundra');
    expect(result.current.theme.id).toBe('tundra');
    expect(window.localStorage.getItem('lr-background-theme')).toBe('tundra');
  });

  it('ignores a select call for an unknown theme id', () => {
    const { result } = renderHook(() => useBackgroundTheme());
    act(() => result.current.selectTheme('not-a-real-theme'));
    expect(result.current.themeId).toBe(BACKGROUND_THEMES[0].id);
  });
});
