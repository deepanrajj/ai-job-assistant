import { describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { DashboardInsights } from './DashboardInsights';
import { AppError } from '../../../errors';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createMockJob } from '../../../test/mockJobs';
import { createMockTimelineEventResponse } from '../../../test/mockTimeline';
import { APP_ERROR_CODES, type TJobStatus } from '../../../types';

/**
 * A moment `days` local calendar days before now, at the same time of day.
 * The component reads the real clock, so fixtures are placed relative to it.
 */
const daysAgo = (days: number): string => {
  const date = new Date();

  date.setDate(date.getDate() - days);

  return date.toISOString();
};

let eventCounter = 0;

const statusEvent = (jobId: string, nextStatus: TJobStatus, createdAt: string) => {
  eventCounter += 1;

  return createMockTimelineEventResponse({
    createdAt,
    id: `event-${eventCounter}`,
    jobId,
    nextStatus,
  });
};

const jobs = [
  createMockJob({ company: 'Celonis', id: 'celonis', status: 'APPLIED' }),
  createMockJob({ company: 'Personio', id: 'personio', status: 'INTERVIEW' }),
  createMockJob({ company: 'Saved as applied', id: 'unknown', status: 'APPLIED' }),
];

const events = [
  statusEvent('celonis', 'APPLIED', new Date().toISOString()),
  statusEvent('personio', 'APPLIED', daysAgo(40)),
  statusEvent('personio', 'INTERVIEW', daysAgo(30)),
];

const getCard = (label: string): HTMLElement =>
  screen.getByRole('heading', { name: label }).parentElement as HTMLElement;

const renderInsights = (overrides: Partial<ComponentProps<typeof DashboardInsights>> = {}) =>
  renderWithProviders(
    <DashboardInsights
      error={null}
      events={events}
      isLoading={false}
      jobs={jobs}
      onRetry={() => {}}
      {...overrides}
    />,
  );

describe('DashboardInsights', () => {
  it('shows applications this week with its date range and the unknown dates left out', () => {
    renderInsights();

    const card = getCard('Applications this week');

    expect(within(card).getByText('1')).toBeInTheDocument();
    expect(
      within(card).getByText(/ - .*Not counted, no recorded application date: 1/),
    ).toBeInTheDocument();
  });

  it('shows the interview rate with both counts', () => {
    renderInsights();

    const card = getCard('Interview rate');

    expect(within(card).getByText('50%')).toBeInTheDocument();
    expect(
      within(card).getByText('1 of 2 recorded applications reached an interview'),
    ).toBeInTheDocument();
  });

  it('shows a small but non-zero interview rate as under 1%, never 0%', () => {
    const cohort = Array.from({ length: 201 }, (_, index) =>
      createMockJob({ company: `Company ${index}`, id: `job-${index}`, status: 'APPLIED' }),
    );
    renderInsights({
      events: [
        ...cohort.map((job) => statusEvent(job.id, 'APPLIED', daysAgo(10))),
        statusEvent('job-0', 'INTERVIEW', daysAgo(5)),
      ],
      jobs: cohort,
    });

    const card = getCard('Interview rate');

    expect(within(card).getByText('<1%')).toBeInTheDocument();
    expect(
      within(card).getByText('1 of 201 recorded applications reached an interview'),
    ).toBeInTheDocument();
  });

  it('says there is not enough data, not 0%, when no application has a recorded date', () => {
    renderInsights({ events: [] });

    const card = getCard('Interview rate');

    expect(within(card).getByText('Not enough data')).toBeInTheDocument();
    expect(within(card).queryByText('0%')).not.toBeInTheDocument();
  });

  it('lists applications still waiting, with their age, and counts unknown dates apart', () => {
    renderInsights({
      events: [...events, statusEvent('unknown-history-free', 'APPLIED', daysAgo(1))],
      jobs: [
        ...jobs,
        createMockJob({ company: 'Miro', id: 'unknown-history-free', status: 'APPLIED' }),
      ],
    });

    const card = getCard('Waiting for a reply');
    const rows = within(
      within(card).getByRole('list', { name: 'Oldest applications' }),
    ).getAllByRole('listitem');

    expect(rows.map((row) => row.textContent)).toEqual(['Miro1 day', 'Celonis0 days']);
    expect(within(card).getByText(/In Applied without a recorded date: 1/)).toBeInTheDocument();
  });

  it('explains why the response rate is unavailable instead of showing a number', () => {
    renderInsights();

    const card = getCard('Response rate');

    expect(within(card).getByText('Unavailable')).toBeInTheDocument();
    expect(within(card).getByText(/A rejection or withdrawal alone/)).toBeInTheDocument();
  });

  it('shows a loading state and no numbers while history loads', () => {
    renderInsights({ events: null, isLoading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Loading insights');
    expect(screen.queryByRole('heading', { name: 'Interview rate' })).not.toBeInTheDocument();
  });

  it('shows no numbers, and offers a retry, when history failed to load', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderInsights({
      error: new AppError('Failed', APP_ERROR_CODES.TIMELINE_REQUEST_FAILED),
      events: null,
      onRetry,
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Insights could not be loaded');
    expect(screen.queryByRole('heading', { name: 'Interview rate' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('labels the section for assistive technology', () => {
    renderInsights();

    expect(screen.getByRole('region', { name: 'Job search insights' })).toBeInTheDocument();
  });

  it('ages applications by another day just after local midnight, without new data', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });

    try {
      vi.setSystemTime(new Date(2026, 9, 4, 23, 59, 30));
      renderInsights({
        events: [statusEvent('celonis', 'APPLIED', new Date(2026, 9, 4, 9, 0).toISOString())],
      });

      const card = getCard('Waiting for a reply');

      expect(within(card).getByText('0 days')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(31 * 1000);
      });

      expect(within(card).getByText('1 day')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
