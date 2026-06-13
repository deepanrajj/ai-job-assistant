import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { DashboardStatusOverview } from './DashboardStatusOverview';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('DashboardStatusOverview', () => {
  it('renders status counts as accessible meters', () => {
    renderWithProviders(
      <DashboardStatusOverview
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

    expect(screen.getByRole('heading', { name: 'Status overview' })).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Applied' })).toHaveAttribute('aria-valuenow', '2');
    expect(screen.getByRole('meter', { name: 'Offer' })).toHaveAttribute('aria-valuemax', '5');
  });
});
