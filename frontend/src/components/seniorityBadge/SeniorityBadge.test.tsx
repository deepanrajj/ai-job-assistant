import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SeniorityBadge } from './SeniorityBadge';

describe('SeniorityBadge', () => {
  it('renders the seniority level returned by analysis', () => {
    render(<SeniorityBadge seniority="Senior" />);

    expect(screen.getByText('Senior')).toBeInTheDocument();
  });
});
