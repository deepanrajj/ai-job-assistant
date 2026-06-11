import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { HeaderBriefcaseIcon } from './header.icons';

describe('HeaderBriefcaseIcon', () => {
  it('renders a decorative briefcase SVG', () => {
    const { container } = render(<HeaderBriefcaseIcon className="custom-icon" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveClass('custom-icon');
  });
});
