import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title, description, icon, and action content', () => {
    render(
      <EmptyState
        action={<button type="button">Add job</button>}
        description="Try another search."
        icon={<span aria-hidden="true">!</span>}
        title="No jobs found"
      />,
    );

    expect(screen.getByText('No jobs found')).toBeInTheDocument();
    expect(screen.getByText('Try another search.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add job' })).toBeInTheDocument();
  });
});
