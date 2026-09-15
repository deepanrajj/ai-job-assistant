import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { DashboardRecentActivity } from './DashboardRecentActivity';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createMockJobs } from '../../../test/mockJobs';

describe('DashboardRecentActivity', () => {
  it('renders recent jobs with localized update dates', () => {
    renderWithProviders(<DashboardRecentActivity jobs={createMockJobs()} />);

    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument();
    expect(screen.getByText('Celonis')).toBeInTheDocument();
    expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
    expect(screen.getByText('Updated May 9')).toBeInTheDocument();
  });

  /**
   * Unreachable until task 025: the local store seeded demo jobs, so the
   * list was never empty in the app. Against an empty database this is the
   * first thing a new user sees, and without the branch it is a titled card
   * with nothing inside it.
   */
  it('renders first-run copy instead of an empty list when there are no jobs', () => {
    renderWithProviders(<DashboardRecentActivity jobs={[]} />);

    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument();
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(screen.getByText('Saved jobs appear here as soon as you add one.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
