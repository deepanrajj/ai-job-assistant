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
});
