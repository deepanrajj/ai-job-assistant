import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { TrashIcon } from './TrashIcon';

describe('TrashIcon', () => {
  it('renders a decorative trash SVG', () => {
    const { container } = render(<TrashIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
