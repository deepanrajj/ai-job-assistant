import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Badge } from './Badge';

describe('Badge', () => {
  it('renders a compact label with passed attributes', () => {
    render(<Badge aria-label="Application status">Interview</Badge>);

    expect(screen.getByLabelText('Application status')).toHaveTextContent('Interview');
  });
});
