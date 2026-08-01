import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Grid from './Grid.jsx';

describe('Grid', () => {
  it('renders nothing while disabled', () => {
    const { container } = render(<Grid />);
    expect(container).toBeEmptyDOMElement();
  });
});
