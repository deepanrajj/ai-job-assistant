import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';

import { JobsKanbanBoard } from './JobsKanbanBoard';
import { renderWithRouter } from '../../../test/renderWithRouter';
import { createMockJob } from '../../../test/mockJobs';
import type { TJob } from '../../../types';

describe('JobsKanbanBoard', () => {
  it('groups jobs by status into their own column', () => {
    const jobs = [
      createMockJob({ company: 'Celonis', id: 'job-interview', status: 'INTERVIEW' }),
      createMockJob({ company: 'Personio', id: 'job-applied', status: 'APPLIED' }),
      createMockJob({ company: 'Miro', id: 'job-offer', status: 'OFFER' }),
    ];

    renderWithRouter(<JobsKanbanBoard jobs={jobs} />);

    const interviewColumn = screen.getByRole('region', { name: 'Interview' });
    const appliedColumn = screen.getByRole('region', { name: 'Applied' });
    const offerColumn = screen.getByRole('region', { name: 'Offer' });

    expect(within(interviewColumn).getByText('Celonis')).toBeInTheDocument();
    expect(within(interviewColumn).queryByText('Personio')).not.toBeInTheDocument();
    expect(within(appliedColumn).getByText('Personio')).toBeInTheDocument();
    expect(within(offerColumn).getByText('Miro')).toBeInTheDocument();
  });

  it('renders every status column, including ones with no jobs', () => {
    const jobs = [createMockJob({ status: 'APPLIED' })];

    renderWithRouter(<JobsKanbanBoard jobs={jobs} />);

    ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'].forEach((status) => {
      expect(screen.getByRole('region', { name: status })).toBeInTheDocument();
    });
  });

  it('shows an empty-column message for statuses with no jobs', () => {
    renderWithRouter(<JobsKanbanBoard jobs={[]} />);

    const wishlistColumn = screen.getByRole('region', { name: 'Wishlist' });

    expect(within(wishlistColumn).getByText('No jobs in this status')).toBeInTheDocument();
    expect(within(wishlistColumn).getByText('0 opportunities')).toBeInTheDocument();
  });

  it('does not crash on a status outside the known six, and omits that job', () => {
    const jobs = [
      createMockJob({ company: 'Known Co', id: 'job-known', status: 'APPLIED' }),
      createMockJob({
        company: 'Unknown Co',
        id: 'job-unknown',
        status: 'ARCHIVED' as TJob['status'],
      }),
    ];

    expect(() => renderWithRouter(<JobsKanbanBoard jobs={jobs} />)).not.toThrow();
    expect(screen.getByText('Known Co')).toBeInTheDocument();
    expect(screen.queryByText('Unknown Co')).not.toBeInTheDocument();
  });

  it('links a card to the correct job detail page', () => {
    const jobs = [createMockJob({ company: 'Acme GmbH', id: 'job-777', status: 'WISHLIST' })];

    renderWithRouter(<JobsKanbanBoard jobs={jobs} />);

    expect(screen.getByRole('link', { name: 'View details for Acme GmbH' })).toHaveAttribute(
      'href',
      '/jobs/job-777',
    );
  });
});
