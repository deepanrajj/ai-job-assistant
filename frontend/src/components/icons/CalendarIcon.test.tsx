import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { CalendarIcon } from './CalendarIcon';

describe('CalendarIcon', () => {
  it('renders a decorative calendar SVG with the given size', () => {
    const { container } = render(<CalendarIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
