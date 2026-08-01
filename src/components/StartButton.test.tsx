import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StartButton from './StartButton';

describe('StartButton', () => {
  it('labels itself "Open Résumé" when collapsed', () => {
    render(<StartButton expanded={false} onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: 'Open Résumé' })).toBeInTheDocument();
  });

  it('labels itself "Close Résumé" when expanded', () => {
    render(<StartButton expanded onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: 'Close Résumé' })).toBeInTheDocument();
  });

  it('calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<StartButton expanded={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
