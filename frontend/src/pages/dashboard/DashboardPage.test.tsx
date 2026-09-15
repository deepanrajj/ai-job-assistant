import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { DashboardPage } from './DashboardPage';
import { AppError } from '../../errors';
import { renderWithProviders } from '../../test/renderWithProviders';
import { createMockJobs } from '../../test/mockJobs';
import { APP_ERROR_CODES } from '../../types';

const loadError = () => new AppError('Failed to load jobs', APP_ERROR_CODES.JOB_REQUEST_FAILED);

const getMetricValue = (label: string): Element => {
  const valueElement = screen.getByText(label).nextElementSibling;

  if (!valueElement) throw new Error(`Metric value not found for ${label}`);

  return valueElement;
};

const renderDashboardPage = (overrides: Partial<ComponentProps<typeof DashboardPage>> = {}) =>
  renderWithProviders(
    <DashboardPage
      error={null}
      isLoading={false}
      jobs={createMockJobs()}
      onRetry={() => {}}
      {...overrides}
    />,
  );

describe('DashboardPage', () => {
  it('renders summary metrics from the provided jobs', () => {
    renderDashboardPage();

    expect(getMetricValue('Total jobs')).toHaveTextContent('3');
    expect(getMetricValue('Active pipeline')).toHaveTextContent('3');
    expect(getMetricValue('Interviews')).toHaveTextContent('1');
    expect(getMetricValue('Offers')).toHaveTextContent('1');
  });

  it('renders status meters and recent activity in updated date order', () => {
    renderDashboardPage();

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

  it('renders the loading state while jobs are being fetched', () => {
    renderDashboardPage({
      isLoading: true,
      jobs: [],
    });

    expect(screen.getByRole('status')).toHaveTextContent('Loading dashboard');
    expect(screen.queryByText('Total jobs')).not.toBeInTheDocument();
  });

  it('renders the error state with a working retry when the request fails', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderDashboardPage({
      error: loadError(),
      jobs: [],
      onRetry,
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Dashboard could not be loaded');
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load jobs');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  /**
   * The state a first-run user against an empty database lands on. It was
   * unreachable while the local store seeded demo jobs, so nothing until now
   * proved the dashboard reads sensibly at zero.
   */
  it('renders zeroed metrics and first-run activity copy when no jobs exist', () => {
    renderDashboardPage({
      jobs: [],
    });

    expect(getMetricValue('Total jobs')).toHaveTextContent('0');
    expect(getMetricValue('Active pipeline')).toHaveTextContent('0');
    expect(screen.getByRole('meter', { name: 'Interview' })).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  /**
   * `useJobsList` cannot currently produce both at once: `useAsyncMutation`
   * clears `error` in the same update that sets `loading`, so a retry never
   * carries the previous failure forward. This pins the page's own ordering
   * rather than the hook's behaviour, so a future caller that does report
   * both shows the in-flight request instead of a stale alert. The props are
   * set by hand because the hook cannot reach this state.
   */
  it('shows the loading state ahead of an error when a caller reports both', () => {
    renderDashboardPage({
      error: loadError(),
      isLoading: true,
      jobs: [],
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
