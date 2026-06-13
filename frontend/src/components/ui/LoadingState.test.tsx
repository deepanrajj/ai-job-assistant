import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('renders an accessible loading status', () => {
    render(<LoadingState description="Fetching the latest data." label="Loading jobs" />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading jobs')).toBeInTheDocument();
    expect(screen.getByText('Fetching the latest data.')).toBeInTheDocument();
  });
});
