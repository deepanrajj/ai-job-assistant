import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { DocumentIcon } from './DocumentIcon';

describe('DocumentIcon', () => {
  it('renders a decorative document SVG', () => {
    const { container } = render(<DocumentIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
