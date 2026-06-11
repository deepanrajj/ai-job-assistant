import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { LanguageIcon } from './LanguageIcon';

describe('LanguageIcon', () => {
  it('renders a decorative language SVG', () => {
    const { container } = render(<LanguageIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
