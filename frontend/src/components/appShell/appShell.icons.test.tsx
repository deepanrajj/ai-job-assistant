import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import {
  ApplicationsIcon,
  AppLogoIcon,
  CalendarIcon,
  DashboardIcon,
  DiscoverIcon,
  JobsIcon,
  ProfileIcon,
} from './appShell.icons';

describe('appShell icons', () => {
  it('renders decorative SVG icons', () => {
    const { container, rerender } = render(<AppLogoIcon />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

    rerender(<DashboardIcon />);
    expect(container.querySelector('svg')).toHaveAttribute('focusable', 'false');

    rerender(<JobsIcon />);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 24 24');

    rerender(<DiscoverIcon />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

    rerender(<ApplicationsIcon />);
    expect(container.querySelector('svg')).toHaveAttribute('focusable', 'false');

    rerender(<CalendarIcon />);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 24 24');

    rerender(<ProfileIcon />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
