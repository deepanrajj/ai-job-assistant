import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';

import { JobsSummaryCards } from './JobsSummaryCards';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createMockJob } from '../../../test/mockJobs';

describe('JobsSummaryCards', () => {
  it('counts every saved job, and the main statuses, in one named group', () => {
    renderWithProviders(
      <JobsSummaryCards
        jobs={[
          createMockJob({ id: 'a', status: 'APPLIED' }),
          createMockJob({ id: 'b', status: 'APPLIED' }),
          createMockJob({ id: 'c', status: 'OFFER' }),
          createMockJob({ id: 'd', status: 'WISHLIST' }),
        ]}
      />,
    );

    const summary = screen.getByRole('group', { name: 'Jobs by status' });
    const countFor = (label: string) =>
      within(summary).getByText(label).closest('div')?.querySelector('dd')?.textContent;

    expect(countFor('Total jobs')).toBe('4');
    expect(countFor('Applied')).toBe('2');
    expect(countFor('Interview')).toBe('0');
    expect(countFor('Offer')).toBe('1');
    expect(countFor('Rejected')).toBe('0');
    expect(within(summary).queryByText('Wishlist')).not.toBeInTheDocument();
  });
});
