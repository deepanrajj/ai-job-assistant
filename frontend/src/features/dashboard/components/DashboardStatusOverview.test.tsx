import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { DashboardStatusOverview } from './DashboardStatusOverview';
import { renderWithRouter } from '../../../test/renderWithRouter';

describe('DashboardStatusOverview', () => {
  it('renders job totals, status counts as accessible meters, and a link to all jobs', () => {
    renderWithRouter(
      <DashboardStatusOverview
        activeJobCount={4}
        statusCounts={{
          APPLIED: 2,
          INTERVIEW: 1,
          OFFER: 1,
          REJECTED: 0,
          WISHLIST: 1,
          WITHDRAWN: 0,
        }}
        totalJobCount={5}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Pipeline' })).toBeInTheDocument();
    expect(screen.getByText('5 saved · 4 active')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/jobs');
    expect(screen.getByRole('meter', { name: 'Applied' })).toHaveAttribute('aria-valuenow', '2');
    expect(screen.getByRole('meter', { name: 'Offer' })).toHaveAttribute('aria-valuemax', '5');
  });
});
