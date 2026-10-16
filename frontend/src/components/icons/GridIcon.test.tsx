import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { GridIcon } from './GridIcon';

describe('GridIcon', () => {
  it('renders a decorative grid SVG', () => {
    const { container } = render(<GridIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
