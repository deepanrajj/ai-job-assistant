import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { ArrowLeftIcon } from './ArrowLeftIcon';

describe('ArrowLeftIcon', () => {
  it('renders a decorative arrow-left SVG', () => {
    const { container } = render(<ArrowLeftIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
