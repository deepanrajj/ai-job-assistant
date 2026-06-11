import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { SearchIcon } from './SearchIcon';

describe('SearchIcon', () => {
  it('renders a decorative search SVG', () => {
    const { container } = render(<SearchIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
