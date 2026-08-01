import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StartActions from './StartActions';

const themes = [
  { id: 'sunset', label: 'Sunset Ridge', Component: () => null },
  { id: 'ocean', label: 'Open Ocean', Component: () => null },
];

describe('StartActions', () => {
  const reloadMock = vi.fn();

  beforeEach(() => {
    window.localStorage.setItem('untouched', 'value');
    reloadMock.mockClear();
    // jsdom's `location.reload` isn't configurable, so it can't be spied on
    // directly (vi.spyOn throws "Cannot redefine property") — stub the
    // whole global instead, which vi.stubGlobal handles regardless.
    vi.stubGlobal('location', { ...window.location, reload: reloadMock });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('clears localStorage and reloads when "Clear Cache" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <StartActions
        themes={themes}
        activeThemeId="sunset"
        onSelectTheme={() => {}}
        spaceMode={false}
        onToggleSpaceMode={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Clear Cache' }));
    expect(window.localStorage.getItem('untouched')).toBeNull();
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('reflects space mode state via aria-pressed and toggles it on click', async () => {
    const user = userEvent.setup();
    const onToggleSpaceMode = vi.fn();
    render(
      <StartActions
        themes={themes}
        activeThemeId="sunset"
        onSelectTheme={() => {}}
        spaceMode={false}
        onToggleSpaceMode={onToggleSpaceMode}
      />,
    );
    const spaceButton = screen.getByRole('button', { name: 'Space Mode' });
    expect(spaceButton).toHaveAttribute('aria-pressed', 'false');
    await user.click(spaceButton);
    expect(onToggleSpaceMode).toHaveBeenCalledTimes(1);
  });

  it('renders the background menu trigger with the active theme wired through', () => {
    render(
      <StartActions
        themes={themes}
        activeThemeId="ocean"
        onSelectTheme={() => {}}
        spaceMode={true}
        onToggleSpaceMode={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Change background' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Space Mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
