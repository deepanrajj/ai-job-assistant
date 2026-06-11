import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';

import { renderWithProviders } from '../../test/renderWithProviders';
import { createMockJobs } from '../../test/mockJobs';
import { DashboardPage } from './DashboardPage';

const getMetricValue = (label: string): Element => {
  const valueElement = screen.getByText(label).nextElementSibling;

  if (!valueElement) throw new Error(`Metric value not found for ${label}`);

  return valueElement;
};

describe('DashboardPage', () => {
  it('renders summary metrics from the provided jobs', () => {
    renderWithProviders(<DashboardPage jobs={createMockJobs()} />);

    expect(getMetricValue('Total jobs')).toHaveTextContent('3');
    expect(getMetricValue('Active pipeline')).toHaveTextContent('3');
    expect(getMetricValue('Interviews')).toHaveTextContent('1');
    expect(getMetricValue('Offers')).toHaveTextContent('1');
  });

  it('renders status meters and recent activity in updated date order', () => {
    renderWithProviders(<DashboardPage jobs={createMockJobs()} />);

    expect(screen.getByRole('meter', { name: 'Interview' })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByRole('meter', { name: 'Applied' })).toHaveAttribute('aria-valuenow', '1');

    const recentActivitySection = screen
      .getByRole('heading', {
        name: 'Recent activity',
      })
      .closest('section');

    if (!recentActivitySection) throw new Error('Recent activity section not found');

    const recentJobs = within(recentActivitySection).getAllByRole('listitem');

    expect(recentJobs[0]).toHaveTextContent('Celonis');
    expect(recentJobs[1]).toHaveTextContent('Miro');
    expect(recentJobs[2]).toHaveTextContent('Personio');
  });
});
