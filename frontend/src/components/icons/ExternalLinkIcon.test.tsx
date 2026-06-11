import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { ExternalLinkIcon } from './ExternalLinkIcon';

describe('ExternalLinkIcon', () => {
  it('renders a decorative external link SVG', () => {
    const { container } = render(<ExternalLinkIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
