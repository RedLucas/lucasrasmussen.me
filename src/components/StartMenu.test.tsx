import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StartMenu from './StartMenu';

const themes = [{ id: 'sunset', label: 'Sunset Ridge' }];

describe('StartMenu', () => {
  it('renders the start button and forwards its expanded label', () => {
    render(
      <StartMenu
        expanded={false}
        onToggle={() => {}}
        themes={themes}
        activeThemeId="sunset"
        onSelectTheme={() => {}}
        spaceMode={false}
        onToggleSpaceMode={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Open Résumé' })).toBeInTheDocument();
  });

  it('forwards onToggle from the start button', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <StartMenu
        expanded={false}
        onToggle={onToggle}
        themes={themes}
        activeThemeId="sunset"
        onSelectTheme={() => {}}
        spaceMode={false}
        onToggleSpaceMode={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Open Résumé' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('forwards space mode state and toggle through to StartActions', async () => {
    const user = userEvent.setup();
    const onToggleSpaceMode = vi.fn();
    render(
      <StartMenu
        expanded={false}
        onToggle={() => {}}
        themes={themes}
        activeThemeId="sunset"
        onSelectTheme={() => {}}
        spaceMode={true}
        onToggleSpaceMode={onToggleSpaceMode}
      />,
    );
    const spaceButton = screen.getByRole('button', { name: 'Space Mode' });
    expect(spaceButton).toHaveAttribute('aria-pressed', 'true');
    await user.click(spaceButton);
    expect(onToggleSpaceMode).toHaveBeenCalledTimes(1);
  });
});
