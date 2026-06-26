import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { EditIcon } from './EditIcon';

describe('EditIcon', () => {
  it('renders a decorative edit SVG', () => {
    const { container } = render(<EditIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
