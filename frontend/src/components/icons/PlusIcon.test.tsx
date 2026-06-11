import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { PlusIcon } from './PlusIcon';

describe('PlusIcon', () => {
  it('renders a decorative plus SVG', () => {
    const { container } = render(<PlusIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
