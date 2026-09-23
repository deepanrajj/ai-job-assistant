import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { TableIcon } from './TableIcon';

describe('TableIcon', () => {
  it('renders a decorative table SVG', () => {
    const { container } = render(<TableIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
