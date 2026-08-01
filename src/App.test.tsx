import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';
import resume from './data/resume.json';

// WebGL is unavailable under jsdom, so every background theme and the burn
// transition already fail open by this codebase's own design (see
// LandscapeBg.tsx/BurnTransition.jsx) — closing the résumé completes near-
// instantly here instead of animating, which these tests rely on.
function renderApp() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts with the résumé closed', () => {
    renderApp();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Résumé' })).toBeInTheDocument();
  });

  it('opens the résumé on start-button click and shows its content', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Open Résumé' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: resume.basics.name })).toBeInTheDocument();
    // The same start button now toggles closed instead — its label flips
    // rather than a separate close trigger appearing in the taskbar.
    expect(screen.getByRole('button', { name: 'Close Résumé' })).toBeInTheDocument();
  });

  it('closes the résumé via the close button', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Open Résumé' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close résumé' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes the résumé on Escape', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Open Résumé' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes the résumé on a backdrop click outside the modal and taskbar', async () => {
    const user = userEvent.setup();
    const { container } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Open Résumé' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const backdrop = container.firstElementChild;
    if (!backdrop) throw new Error('expected the app root element to be rendered');
    await user.click(backdrop);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('does not close the résumé when clicking inside the modal', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Open Résumé' }));
    await user.click(screen.getByRole('heading', { level: 1, name: resume.basics.name }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('returns focus to the start button once the résumé finishes closing', async () => {
    const user = userEvent.setup();
    renderApp();
    const startButton = screen.getByRole('button', { name: 'Open Résumé' });
    await user.click(startButton);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(startButton).toHaveFocus());
  });

  it('persists the selected background theme and reflects it in the menu', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Change background' }));
    await user.click(screen.getByRole('menuitemradio', { name: /Open Ocean/ }));

    expect(window.localStorage.getItem('lr-background-theme')).toBe('ocean');
  });

  it('toggles space mode and reflects the pressed state', async () => {
    const user = userEvent.setup();
    renderApp();
    const spaceButton = screen.getByRole('button', { name: 'Space Mode' });
    expect(spaceButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(spaceButton);
    expect(spaceButton).toHaveAttribute('aria-pressed', 'true');
    expect(window.localStorage.getItem('lr-space-mode')).toBe('1');
  });
});
