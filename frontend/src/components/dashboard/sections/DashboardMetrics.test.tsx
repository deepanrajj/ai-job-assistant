import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { DashboardMetrics } from './DashboardMetrics';

describe('DashboardMetrics', () => {
  it('renders dashboard metric labels and values', () => {
    renderWithProviders(
      <DashboardMetrics
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

    expect(screen.getByText('Total jobs')).toBeInTheDocument();
    expect(screen.getByText('Active pipeline')).toBeInTheDocument();
    expect(screen.getByText('Interviews')).toBeInTheDocument();
    expect(screen.getByText('Offers')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
