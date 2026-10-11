import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';

import { DashboardRecentActivity } from './DashboardRecentActivity';
import { renderWithRouter } from '../../../test/renderWithRouter';
import { MOCK_JOB_IDS, createMockJob, createMockJobs } from '../../../test/mockJobs';
import type { TJob } from '../../../types';
import type { IApplicationHistory } from '../dashboardInsights.types';

/**
 * Builds an application history with the given applied dates by job.
 */
const historyWith = (
  appliedDates: [TJob, Date][] = [],
  withdrawnFromWishlist: string[] = [],
): IApplicationHistory => ({
  applications: new Map(appliedDates.map(([job, appliedAt]) => [job.id, { appliedAt, job }])),
  withdrawnFromWishlist: new Set(withdrawnFromWishlist),
});

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
  const originalResizeObserver = globalThis.ResizeObserver;

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('renders a table of recent jobs with links, applied dates, status, and update dates', () => {
    const jobs = createMockJobs();
    const celonis = jobs.find((job) => job.id === MOCK_JOB_IDS.celonis) as TJob;

    renderWithRouter(
      <DashboardRecentActivity
        applicationHistory={historyWith([[celonis, new Date(2026, 4, 2)]])}
        jobs={jobs}
      />,
    );

    const table = screen.getByRole('table');
    const celonisRow = within(table)
      .getByRole('link', { name: 'Celonis' })
      .closest('tr') as HTMLElement;

    expect(within(celonisRow).getByRole('link', { name: 'Celonis' })).toHaveAttribute(
      'href',
      `/jobs/${MOCK_JOB_IDS.celonis}`,
    );
    expect(within(celonisRow).getByText('Senior Frontend Engineer')).toBeInTheDocument();
    expect(within(celonisRow).getByText(/^May 2/)).toBeInTheDocument();
    expect(within(celonisRow).getByText(/^May 9/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/jobs');
  });

  it('names a missing application date instead of guessing one', () => {
    const { unmount } = renderWithRouter(
      <DashboardRecentActivity applicationHistory={historyWith()} jobs={createMockJobs()} />,
    );

    expect(screen.getAllByText('Not recorded')).toHaveLength(createMockJobs().length);
    unmount();

    // No history yet, or it failed: the date is unknown, not absent.
    renderWithRouter(<DashboardRecentActivity applicationHistory={null} jobs={createMockJobs()} />);
    expect(screen.getAllByText('Not available')).toHaveLength(createMockJobs().length);
    expect(screen.queryByText('Not recorded')).not.toBeInTheDocument();
  });

  it('says a wishlist job, or one withdrawn straight from it, was never applied for', () => {
    renderWithRouter(
      <DashboardRecentActivity
        applicationHistory={historyWith([], ['dropped'])}
        jobs={[
          createMockJob({ company: 'Saved', id: 'saved', status: 'WISHLIST' }),
          createMockJob({ company: 'Dropped', id: 'dropped', status: 'WITHDRAWN' }),
          createMockJob({ company: 'Undated', id: 'undated', status: 'APPLIED' }),
        ]}
      />,
    );

    const rowFor = (company: string): HTMLElement =>
      screen.getByRole('link', { name: company }).closest('tr') as HTMLElement;

    expect(within(rowFor('Saved')).getByText('Not applied')).toBeInTheDocument();
    expect(within(rowFor('Dropped')).getByText('Not applied')).toBeInTheDocument();
    expect(within(rowFor('Undated')).getByText('Not recorded')).toBeInTheDocument();
  });

  it('switches to cards when its own width is too narrow for the table', () => {
    let report: ((width: number) => void) | undefined;

    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        report = (width) =>
          callback(
            [{ contentRect: { width } } as ResizeObserverEntry],
            this as unknown as ResizeObserver,
          );
      }

      disconnect() {}

      observe() {}

      unobserve() {}
    } as unknown as typeof ResizeObserver;

    renderWithRouter(<DashboardRecentActivity applicationHistory={null} jobs={createMockJobs()} />);

    // Unmeasured, a large viewport picks the table.
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Half a row on a wide screen: too narrow for five columns.
    act(() => report?.(500));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Celonis/ })).toBeInTheDocument();

    act(() => report?.(900));
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders each job as a linked card on phones, with its applied date when recorded', () => {
    const restoreViewport = mockPhoneViewport();
    const jobs = createMockJobs();
    const celonis = jobs.find((job) => job.id === MOCK_JOB_IDS.celonis) as TJob;

    try {
      renderWithRouter(
        <DashboardRecentActivity
          applicationHistory={historyWith([[celonis, new Date(2026, 4, 2)]])}
          jobs={jobs}
        />,
      );

      expect(screen.queryByRole('table')).not.toBeInTheDocument();

      const celonisLink = screen.getByRole('link', { name: /Celonis/ });

      expect(celonisLink).toHaveAttribute('href', `/jobs/${MOCK_JOB_IDS.celonis}`);
      expect(within(celonisLink).getByText(/^Applied May 2.* · Updated May 9/)).toBeInTheDocument();
      // The same reasons as the table, for jobs without a recorded date.
      expect(
        within(screen.getByRole('link', { name: /Personio/ })).getByText(
          /^Applied: Not recorded · Updated/,
        ),
      ).toBeInTheDocument();
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
    renderWithRouter(<DashboardRecentActivity applicationHistory={null} jobs={[]} />);

    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument();
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(screen.getByText('Saved jobs appear here as soon as you add one.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
