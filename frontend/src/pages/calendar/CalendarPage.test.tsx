import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { CalendarPage } from './CalendarPage';
import { AppError } from '../../errors';
import { renderWithRouter } from '../../test/renderWithRouter';
import { MOCK_JOB_IDS, createMockJobs } from '../../test/mockJobs';
import { APP_ERROR_CODES } from '../../types';
import type { TCalendarItem } from '../../features/calendar/calendar.types';

const interviewPrep: TCalendarItem = {
  date: '2026-10-05',
  documentType: null,
  id: 'reminder-1',
  isComplete: false,
  jobId: MOCK_JOB_IDS.celonis,
  reminderType: 'INTERVIEW_PREP',
  source: 'REMINDER',
  title: 'Prepare system design',
};

const items: TCalendarItem[] = [
  interviewPrep,
  {
    date: '2026-10-05',
    documentType: null,
    id: 'task-1',
    isComplete: true,
    jobId: MOCK_JOB_IDS.personio,
    reminderType: null,
    source: 'TASK',
    title: 'Tailor CV bullets',
  },
  {
    date: '2026-10-12',
    documentType: 'COVER_LETTER',
    id: 'document-1',
    isComplete: false,
    jobId: MOCK_JOB_IDS.celonis,
    reminderType: null,
    source: 'DOCUMENT',
    title: 'Cover letter v2',
  },
];

const renderPage = (overrides: Partial<ComponentProps<typeof CalendarPage>> = {}) =>
  renderWithRouter(
    <CalendarPage
      error={null}
      isLoading={false}
      items={items}
      jobs={createMockJobs()}
      month={{ month: 9, year: 2026 }}
      onNextMonth={() => {}}
      onPreviousMonth={() => {}}
      onRetry={() => {}}
      onThisMonth={() => {}}
      today="2026-10-05"
      {...overrides}
    />,
  );

const getDateGroups = (): HTMLElement[] =>
  within(screen.getByRole('list', { name: 'Dated items in October 2026' }))
    .getAllByRole('listitem')
    .filter((element) => element.querySelector('h3'));

describe('CalendarPage', () => {
  it('titles the card with the month', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'October 2026' })).toBeInTheDocument();
  });

  it('groups items by date, in date order, and marks today', () => {
    renderPage();

    const groups = getDateGroups();

    expect(groups.map((group) => within(group).getByRole('heading').textContent)).toEqual([
      'Mon, Oct 5, 2026 · Today',
      'Mon, Oct 12, 2026',
    ]);
    expect(within(groups[0] as HTMLElement).getAllByRole('link')).toHaveLength(2);
  });

  it('links each item to its job, naming the kind and the company', () => {
    renderPage();

    expect(
      screen.getByRole('link', { name: 'Interview prep: Prepare system design, Celonis' }),
    ).toHaveAttribute('href', `/jobs/${MOCK_JOB_IDS.celonis}`);
    expect(screen.getByRole('link', { name: 'Task: Tailor CV bullets, Personio' })).toHaveAttribute(
      'href',
      `/jobs/${MOCK_JOB_IDS.personio}`,
    );
    expect(
      screen.getByRole('link', { name: 'Submitted · Cover letter: Cover letter v2, Celonis' }),
    ).toBeInTheDocument();
  });

  it('shows a completed item struck through and marked done', () => {
    renderPage();

    const link = screen.getByRole('link', { name: 'Task: Tailor CV bullets, Personio' });

    expect(within(link).getByText('Tailor CV bullets')).toHaveClass('line-through');
    expect(link).toHaveTextContent('Task · Done');
  });

  it('keeps the month grid out of the accessibility tree, so items are not announced twice', () => {
    const { container } = renderPage();

    const grid = container.querySelector('div[aria-hidden="true"]');

    expect(grid).not.toBeNull();
    expect(within(grid as HTMLElement).getAllByText('Prepare system design')).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: /Prepare system design/ })).toHaveLength(1);
  });

  it('shows "+n more" in a grid day with more items than fit', () => {
    const crowded = Array.from(
      { length: 5 },
      (_, index): TCalendarItem => ({
        ...interviewPrep,
        id: `reminder-${index}`,
        title: `Item ${index}`,
      }),
    );
    const { container } = renderPage({ items: crowded });

    const grid = container.querySelector('div[aria-hidden="true"]') as HTMLElement;

    expect(within(grid).getByText('+2 more')).toBeInTheDocument();
    expect(within(grid).queryByText('Item 3')).not.toBeInTheDocument();
  });

  it('leaves grid days of the neighbouring months empty, since their items are not loaded', () => {
    const { container } = renderPage({
      items: [interviewPrep, { ...interviewPrep, date: '2026-11-01', id: 'next-month' }],
    });

    const grid = container.querySelector('div[aria-hidden="true"]') as HTMLElement;

    expect(within(grid).getAllByText('Prepare system design')).toHaveLength(1);
  });

  it('names a job that is not in the loaded list as unknown', () => {
    renderPage({ items: [{ ...interviewPrep, jobId: 'deleted-job' }] });

    expect(
      screen.getByRole('link', { name: 'Interview prep: Prepare system design, Unknown job' }),
    ).toBeInTheDocument();
  });

  it('shows an empty state for a month without items', () => {
    renderPage({ items: [] });

    expect(screen.getByText('Nothing dated in October 2026')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /Dated items/ })).not.toBeInTheDocument();
  });

  it('moves between months', async () => {
    const user = userEvent.setup();
    const onNextMonth = vi.fn();
    const onPreviousMonth = vi.fn();
    const onThisMonth = vi.fn();
    renderPage({ onNextMonth, onPreviousMonth, onThisMonth });

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await user.click(screen.getByRole('button', { name: 'Today' }));

    expect(onNextMonth).toHaveBeenCalledOnce();
    expect(onPreviousMonth).toHaveBeenCalledOnce();
    expect(onThisMonth).toHaveBeenCalledOnce();
  });

  it('shows a loading state', () => {
    renderPage({ isLoading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Loading calendar');
  });

  it('shows an error with a working retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderPage({ error: new AppError('Failed', APP_ERROR_CODES.CALENDAR_REQUEST_FAILED), onRetry });

    expect(screen.getByRole('alert')).toHaveTextContent('The calendar could not be loaded');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
