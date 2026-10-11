import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { JobsKanbanCard } from './JobsKanbanCard';
import { renderWithRouter } from '../../../test/renderWithRouter';
import { createMockJob } from '../../../test/mockJobs';

describe('JobsKanbanCard', () => {
  it('renders the job summary and links to the job detail page', () => {
    const job = createMockJob({
      company: 'Northwind Systems',
      id: 'job-042',
      location: 'Hamburg',
      roleTitle: 'Platform Engineer',
    });

    renderWithRouter(<JobsKanbanCard job={job} />);

    expect(screen.getByText('Northwind Systems')).toBeInTheDocument();
    expect(screen.getByText('Platform Engineer')).toBeInTheDocument();
    expect(screen.getByText('Hamburg', { exact: false })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'View details for Northwind Systems' }),
    ).toHaveAttribute('href', '/jobs/job-042');
  });

  it('prints only the details that are set, and the last update', () => {
    const job = createMockJob({
      location: undefined,
      salaryMax: undefined,
      salaryMin: undefined,
      updatedAt: '2026-05-09T15:20:00.000Z',
    });
    const { unmount } = renderWithRouter(<JobsKanbanCard job={job} />);

    expect(screen.queryByText(/Not set/)).not.toBeInTheDocument();
    expect(screen.getByText(/^Updated /)).toBeInTheDocument();
    unmount();

    renderWithRouter(<JobsKanbanCard job={{ ...job, location: 'Berlin' }} />);
    expect(screen.getByText('Berlin')).toBeInTheDocument();
  });
});
