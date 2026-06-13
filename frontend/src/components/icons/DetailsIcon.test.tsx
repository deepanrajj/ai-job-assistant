import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { DetailsIcon } from './DetailsIcon';

describe('DetailsIcon', () => {
  it('renders a decorative details SVG', () => {
    const { container } = render(<DetailsIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
