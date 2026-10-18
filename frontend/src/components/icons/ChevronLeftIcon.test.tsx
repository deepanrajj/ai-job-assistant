import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { ChevronLeftIcon } from './ChevronLeftIcon';

describe('ChevronLeftIcon', () => {
  it('renders a decorative chevron-left SVG', () => {
    const { container } = render(<ChevronLeftIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
