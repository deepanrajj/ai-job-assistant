import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';

import { DashboardRecentActivity } from './DashboardRecentActivity';
import { renderWithRouter } from '../../../test/renderWithRouter';
import { MOCK_JOB_IDS, createMockJobs } from '../../../test/mockJobs';

/**
 * Simulates a viewport below every breakpoint, i.e. a phone, and returns
 * a restore function. Swapped rather than spied on: restoring a spy on the
 * setup file's mock would wipe it for the rest of the file.
 */
const mockPhoneViewport = () => {
  const originalMatchMedia = window.matchMedia;

  window.matchMedia = vi.fn(
    (query: string) =>
      ({
        addEventListener: vi.fn(),
        matches: false,
        media: query,
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );

  return () => {
    window.matchMedia = originalMatchMedia;
  };
};

describe('DashboardRecentActivity', () => {
  it('renders a table of recent jobs with links, applied dates, status, and update dates', () => {
    renderWithRouter(
      <DashboardRecentActivity
        appliedDates={new Map([[MOCK_JOB_IDS.celonis, new Date(2026, 4, 2)]])}
        jobs={createMockJobs()}
      />,
    );

    const table = screen.getByRole('table', { name: 'Recent activity' });
    const celonisRow = within(table)
      .getByRole('link', { name: 'Celonis' })
      .closest('tr') as HTMLElement;

    expect(within(celonisRow).getByRole('link', { name: 'Celonis' })).toHaveAttribute(
      'href',
      `/jobs/${MOCK_JOB_IDS.celonis}`,
    );
    expect(within(celonisRow).getByText('Senior Frontend Engineer')).toBeInTheDocument();
    expect(within(celonisRow).getByText('May 2')).toBeInTheDocument();
    expect(within(celonisRow).getByText('May 9')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/jobs');
  });

  it('names a missing application date instead of guessing one', () => {
    const { unmount } = renderWithRouter(
      <DashboardRecentActivity appliedDates={new Map()} jobs={createMockJobs()} />,
    );

    expect(screen.getAllByText('Not recorded')).toHaveLength(createMockJobs().length);
    unmount();

    // No history yet, or it failed: the date is unknown, not absent.
    renderWithRouter(<DashboardRecentActivity appliedDates={null} jobs={createMockJobs()} />);
    expect(screen.getAllByText('Not available')).toHaveLength(createMockJobs().length);
    expect(screen.queryByText('Not recorded')).not.toBeInTheDocument();
  });

  it('renders each job as a linked card on phones', () => {
    const restoreViewport = mockPhoneViewport();

    try {
      renderWithRouter(<DashboardRecentActivity appliedDates={null} jobs={createMockJobs()} />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();

      const celonis = screen.getByRole('link', { name: /Celonis/ });

      expect(celonis).toHaveAttribute('href', `/jobs/${MOCK_JOB_IDS.celonis}`);
      expect(within(celonis).getByText('Updated May 9')).toBeInTheDocument();
    } finally {
      restoreViewport();
    }
  });

  /**
   * Unreachable until task 025: the local store seeded demo jobs, so the
   * list was never empty in the app. Against an empty database this is the
   * first thing a new user sees, and without the branch it is a titled card
   * with nothing inside it.
   */
  it('renders first-run copy instead of an empty list when there are no jobs', () => {
    renderWithRouter(<DashboardRecentActivity appliedDates={null} jobs={[]} />);

    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument();
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(screen.getByText('Saved jobs appear here as soon as you add one.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
