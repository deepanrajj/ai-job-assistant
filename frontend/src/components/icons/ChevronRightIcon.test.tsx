import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { ChevronRightIcon } from './ChevronRightIcon';

describe('ChevronRightIcon', () => {
  it('renders a decorative chevron-right SVG', () => {
    const { container } = render(<ChevronRightIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
