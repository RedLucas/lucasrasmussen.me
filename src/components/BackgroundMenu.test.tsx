import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackgroundMenu from './BackgroundMenu';

const themes = [
  { id: 'sunset', label: 'Sunset Ridge' },
  { id: 'desert', label: 'Dune Sea' },
  { id: 'ocean', label: 'Open Ocean' },
];

function renderMenu(activeId = 'sunset', onSelect = vi.fn()) {
  render(<BackgroundMenu themes={themes} activeId={activeId} onSelect={onSelect} />);
  return { onSelect };
}

describe('BackgroundMenu', () => {
  it('is closed by default and opens on trigger click', async () => {
    const user = userEvent.setup();
    renderMenu();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Change background' }));
    expect(screen.getByRole('menu', { name: 'Background themes' })).toBeInTheDocument();
  });

  it('marks the active theme as checked with the others unchecked', async () => {
    const user = userEvent.setup();
    renderMenu('desert');
    await user.click(screen.getByRole('button', { name: 'Change background' }));

    const menu = screen.getByRole('menu');
    const items = within(menu).getAllByRole('menuitemradio');
    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual([
      'false',
      'true',
      'false',
    ]);
  });

  it('selects a theme and closes, returning focus to the trigger', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderMenu('sunset');
    const trigger = screen.getByRole('button', { name: 'Change background' });
    await user.click(trigger);

    await user.click(screen.getByRole('menuitemradio', { name: /Open Ocean/ }));

    expect(onSelect).toHaveBeenCalledWith('ocean');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'Change background' });
    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('moves focus between items with ArrowDown/ArrowUp, wrapping at the ends', async () => {
    const user = userEvent.setup();
    renderMenu('sunset');
    await user.click(screen.getByRole('button', { name: 'Change background' }));

    const items = screen.getAllByRole('menuitemradio');
    expect(items[0]).toHaveFocus(); // opening focuses the active item

    await user.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(items[0]).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(items[items.length - 1]).toHaveFocus(); // wraps to the last item
  });

  it('jumps to the first/last item with Home/End', async () => {
    const user = userEvent.setup();
    renderMenu('sunset');
    await user.click(screen.getByRole('button', { name: 'Change background' }));

    const items = screen.getAllByRole('menuitemradio');
    await user.keyboard('{End}');
    expect(items[items.length - 1]).toHaveFocus();

    await user.keyboard('{Home}');
    expect(items[0]).toHaveFocus();
  });

  it('closes on outside pointerdown', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">outside</button>
        <BackgroundMenu themes={themes} activeId="sunset" onSelect={() => {}} />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Change background' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not close on blur when relatedTarget is null (mobile Safari tap quirk)', async () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'Change background' });
    await userEvent.setup().click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    const wrapper = trigger.closest('div');
    if (!wrapper) throw new Error('expected the menu wrapper to be rendered');
    // Simulate the real-world case this component's handleBlur guards
    // against: a blur event with no relatedTarget at all.
    fireEvent.blur(wrapper, { relatedTarget: null });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes on blur when focus moves to a real element outside the menu', async () => {
    render(
      <div>
        <BackgroundMenu themes={themes} activeId="sunset" onSelect={() => {}} />
        <button type="button">outside</button>
      </div>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Change background' }));
    const wrapper = screen.getByRole('menu').closest('div');
    if (!wrapper) throw new Error('expected the menu wrapper to be rendered');
    const outside = screen.getByRole('button', { name: 'outside' });

    // Tabbing through every item first would land back inside the menu, so
    // this asserts the actual contract directly: a blur whose relatedTarget
    // is a real element outside the wrapper closes the menu.
    fireEvent.blur(wrapper, { relatedTarget: outside });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
