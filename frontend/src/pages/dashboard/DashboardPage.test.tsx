import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { DashboardPage } from './DashboardPage';
import { AppError } from '../../errors';
import { renderWithRouter } from '../../test/renderWithRouter';
import { MOCK_JOB_IDS, createMockJobs } from '../../test/mockJobs';
import { createMockTimelineEventResponse } from '../../test/mockTimeline';
import { APP_ERROR_CODES } from '../../types';

const loadError = () => new AppError('Failed to load jobs', APP_ERROR_CODES.JOB_REQUEST_FAILED);

/**
 * Next reminders as `useNextReminders` reports a settled, empty load.
 */
const noNextReminders: ComponentProps<typeof DashboardPage>['nextReminders'] = {
  error: null,
  isLoading: false,
  reload: () => {},
  reminders: [],
};

/**
 * Status history as `useStatusHistory` reports a settled, empty load.
 */
const emptyStatusHistory: ComponentProps<typeof DashboardPage>['statusHistory'] = {
  error: null,
  events: [],
  isLoading: false,
  reload: () => {},
};

const renderDashboardPage = (overrides: Partial<ComponentProps<typeof DashboardPage>> = {}) =>
  renderWithRouter(
    <DashboardPage
      error={null}
      isLoading={false}
      jobs={createMockJobs()}
      nextReminders={noNextReminders}
      onRetry={() => {}}
      statusHistory={emptyStatusHistory}
      {...overrides}
    />,
  );

describe('DashboardPage', () => {
  it('renders the job totals and per-status counts in the pipeline card', () => {
    renderDashboardPage();

    expect(screen.getByRole('heading', { name: 'Pipeline' })).toBeInTheDocument();
    expect(screen.getByText('3 saved · 3 active')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Interview' })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByRole('meter', { name: 'Offer' })).toHaveAttribute('aria-valuenow', '1');
  });

  it('puts the insights first, then the pipeline and reminders, then recent activity', () => {
    renderDashboardPage();

    const headings = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent);

    expect(headings).toEqual([
      'Job search insights',
      'Pipeline',
      'Next reminders',
      'Recent activity',
    ]);
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

    // The first row is the table header.
    const recentJobs = within(recentActivitySection).getAllByRole('row').slice(1);

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

    expect(screen.getByText('0 saved · 0 active')).toBeInTheDocument();
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

  it('renders the next reminders alongside the job counts', () => {
    renderDashboardPage({
      nextReminders: {
        ...noNextReminders,
        reminders: [
          {
            dueDate: '2999-01-01',
            id: 'reminder-1',
            isComplete: false,
            jobId: MOCK_JOB_IDS.celonis,
            source: 'REMINDER',
            title: 'Follow up with recruiter',
            type: 'FOLLOW_UP',
          },
        ],
      },
    });

    expect(screen.getByRole('heading', { name: 'Next reminders' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Open Celonis for reminder Follow up with recruiter' }),
    ).toBeInTheDocument();
  });

  it('keeps the job counts on screen when only the reminders fail to load', () => {
    renderDashboardPage({
      nextReminders: {
        ...noNextReminders,
        error: new AppError(
          'Failed to load upcoming reminders',
          APP_ERROR_CODES.REMINDER_REQUEST_FAILED,
        ),
      },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Reminders could not be loaded');
    expect(screen.getByText('3 saved · 3 active')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument();
  });

  it('leaves the reminders card out, and moves recent activity beside the pipeline, when no reminders are passed', () => {
    renderDashboardPage({ nextReminders: undefined });

    expect(screen.queryByRole('heading', { name: 'Next reminders' })).not.toBeInTheDocument();

    const pipeline = screen.getByRole('heading', { name: 'Pipeline' }).closest('section');
    const recent = screen.getByRole('heading', { name: 'Recent activity' }).closest('section');

    // Same grid row: recent activity sits in its own measuring wrapper.
    expect(pipeline?.parentElement).toContainElement(recent ?? null);
  });

  it('renders the insights from the status history alongside the job counts', () => {
    renderDashboardPage();

    expect(screen.getByRole('heading', { name: 'Job search insights' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Response rate' })).toBeInTheDocument();
  });

  it('keeps the job counts when only the status history fails to load', () => {
    renderDashboardPage({
      statusHistory: {
        ...emptyStatusHistory,
        error: new AppError(
          'Failed to load status history',
          APP_ERROR_CODES.TIMELINE_REQUEST_FAILED,
        ),
        events: null,
      },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Insights could not be loaded');
    expect(screen.getByText('3 saved · 3 active')).toBeInTheDocument();
  });

  it('dates recent applications from settled status history only', () => {
    const appliedEvent = createMockTimelineEventResponse({
      createdAt: '2026-05-02T09:00:00.000Z',
      jobId: MOCK_JOB_IDS.celonis,
      nextStatus: 'APPLIED',
      previousStatus: 'WISHLIST',
    });
    const { unmount } = renderDashboardPage({
      statusHistory: { ...emptyStatusHistory, events: [appliedEvent] },
    });
    const celonisRow = (): HTMLElement =>
      screen.getByRole('link', { name: 'Celonis' }).closest('tr') as HTMLElement;

    expect(within(celonisRow()).getByText('May 2')).toBeInTheDocument();
    unmount();

    renderDashboardPage({
      statusHistory: { ...emptyStatusHistory, events: [appliedEvent], isLoading: true },
    });
    expect(within(celonisRow()).getByText('Not available')).toBeInTheDocument();
  });
});
