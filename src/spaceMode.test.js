import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpaceMode } from './spaceMode.js';

describe('useSpaceMode', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to off when nothing is stored', () => {
    const { result } = renderHook(() => useSpaceMode());
    expect(result.current.spaceMode).toBe(false);
  });

  it('reads a previously stored "on" state', () => {
    window.localStorage.setItem('lr-space-mode', '1');
    const { result } = renderHook(() => useSpaceMode());
    expect(result.current.spaceMode).toBe(true);
  });

  it('treats any non-"1" stored value as off', () => {
    window.localStorage.setItem('lr-space-mode', '0');
    const { result } = renderHook(() => useSpaceMode());
    expect(result.current.spaceMode).toBe(false);
  });

  it('toggles and persists the new value across on/off', () => {
    const { result } = renderHook(() => useSpaceMode());

    act(() => result.current.toggleSpaceMode());
    expect(result.current.spaceMode).toBe(true);
    expect(window.localStorage.getItem('lr-space-mode')).toBe('1');

    act(() => result.current.toggleSpaceMode());
    expect(result.current.spaceMode).toBe(false);
    expect(window.localStorage.getItem('lr-space-mode')).toBe('0');
  });

  it('falls back to off when localStorage throws on read', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    const { result } = renderHook(() => useSpaceMode());
    expect(result.current.spaceMode).toBe(false);
    vi.restoreAllMocks();
  });

  it('still toggles in-memory when localStorage throws on write', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage full');
    });
    const { result } = renderHook(() => useSpaceMode());
    act(() => result.current.toggleSpaceMode());
    expect(result.current.spaceMode).toBe(true);
    vi.restoreAllMocks();
  });
});
