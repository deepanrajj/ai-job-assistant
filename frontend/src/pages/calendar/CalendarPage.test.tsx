import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ComponentProps, type FC } from 'react';

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

const pageElement = (overrides: Partial<ComponentProps<typeof CalendarPage>> = {}) => (
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
  />
);

const renderPage = (overrides: Partial<ComponentProps<typeof CalendarPage>> = {}) =>
  renderWithRouter(pageElement(overrides));

/**
 * Owns the month, as the route does, so a test can page to the next one.
 */
const MonthPager: FC = () => {
  const [month, setMonth] = useState({ month: 9, year: 2026 });

  return pageElement({
    items: month.month === 9 ? items : [],
    month,
    onNextMonth: () => setMonth({ month: 10, year: 2026 }),
    onPreviousMonth: () => setMonth({ month: 9, year: 2026 }),
    onThisMonth: () => setMonth({ month: 9, year: 2026 }),
  });
};

/**
 * Starts loading on "Next month", as the route does while the next
 * month's items are requested.
 */
const LoadingPager: FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  return pageElement({ isLoading, onNextMonth: () => setIsLoading(true) });
};

const getDayPanel = (): HTMLElement => screen.getByRole('region', { name: /^[A-Z][a-z]+day, / });

const getGrid = (container: HTMLElement): HTMLElement =>
  container.querySelector('div.grid-cols-7.rounded-xl') as HTMLElement;

describe('CalendarPage', () => {
  it('titles the month card with the month', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'October 2026' })).toBeInTheDocument();
  });

  it('opens on today and lists only its items in the day panel', () => {
    renderPage();

    const panel = getDayPanel();

    expect(within(panel).getByRole('heading', { name: 'Monday, October 5' })).toBeInTheDocument();
    expect(panel).toHaveTextContent('Today · 2 items');
    expect(within(within(getDayPanel()).getByRole('list')).getAllByRole('link')).toHaveLength(2);
    expect(screen.queryByRole('link', { name: /Cover letter v2/ })).not.toBeInTheDocument();
  });

  it('names every day button by its date and item count, and presses the selected one', () => {
    renderPage();

    expect(
      screen.getByRole('button', { name: 'Monday, October 5, 2 items, today' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Monday, October 12, 1 item' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(
      screen.getByRole('button', { name: 'Tuesday, October 6, no items' }),
    ).toBeInTheDocument();
    // The 31 days of October; the neighbouring months' days are not buttons.
    expect(screen.getAllByRole('button', { name: /^[A-Z][a-z]+day, / })).toHaveLength(31);
  });

  it('shows the chosen day in the panel', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Monday, October 12, 1 item' }));

    expect(screen.getByRole('button', { name: 'Monday, October 12, 1 item' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('link', { name: 'Submitted · Cover letter: Cover letter v2, Celonis' }),
    ).toHaveAttribute('href', `/jobs/${MOCK_JOB_IDS.celonis}`);
    expect(screen.queryByRole('link', { name: /Prepare system design/ })).not.toBeInTheDocument();
  });

  it('says when the chosen day has nothing on it', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Tuesday, October 6, no items' }));

    expect(screen.getByText('Nothing on Tuesday, October 6')).toBeInTheDocument();
  });

  it('opens a month without today on its first day with items', () => {
    renderPage({ today: '2026-11-20' });

    expect(
      within(getDayPanel()).getByRole('heading', { name: 'Monday, October 5' }),
    ).toBeInTheDocument();
  });

  it('drops a chosen day when the month changes', async () => {
    const user = userEvent.setup();
    renderWithRouter(<MonthPager />);

    await user.click(screen.getByRole('button', { name: 'Monday, October 12, 1 item' }));
    await user.click(screen.getByRole('button', { name: 'Next month' }));

    expect(
      within(getDayPanel()).getByRole('heading', { name: 'Sunday, November 1' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Nothing dated in November 2026')).toBeInTheDocument();

    // Back in October, the month opens on today again, not on the 12th.
    await user.click(screen.getByRole('button', { name: 'Previous month' }));

    expect(
      within(getDayPanel()).getByRole('heading', { name: 'Monday, October 5' }),
    ).toBeInTheDocument();
  });

  it('selects today from the Today button in another month', async () => {
    const user = userEvent.setup();
    renderWithRouter(<MonthPager />);

    await user.click(screen.getByRole('button', { name: 'Monday, October 12, 1 item' }));
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    await user.click(screen.getByRole('button', { name: 'Today' }));

    expect(
      screen.getByRole('button', { name: 'Monday, October 5, 2 items, today' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it("announces a month's opening day after paging, but not a day chosen by its button", async () => {
    const user = userEvent.setup();
    const { container } = renderWithRouter(<MonthPager />);
    const live = () => container.querySelector('p.sr-only[aria-live="polite"]');

    // Nothing on the first load, nor for a day button, which names itself.
    expect(live()).toBeEmptyDOMElement();
    await user.click(screen.getByRole('button', { name: 'Monday, October 12, 1 item' }));
    expect(live()).toBeEmptyDOMElement();

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(live()).toHaveTextContent('Sunday, November 1, no items');

    await user.click(screen.getByRole('button', { name: 'Tuesday, November 3, no items' }));
    expect(live()).toHaveTextContent('Sunday, November 1, no items');
  });

  it('keeps the month buttons mounted, and focused, while the next month loads', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoadingPager />);

    const nextMonth = screen.getByRole('button', { name: 'Next month' });
    await user.click(nextMonth);

    expect(screen.getByRole('status')).toHaveTextContent('Loading calendar');
    // The live region stays, empty, so the loaded day is announced next.
    expect(document.querySelector('p.sr-only[aria-live="polite"]')).toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: 'Next month' })).toBe(nextMonth);
    expect(nextMonth).toHaveFocus();
  });

  it('selects today again from the Today button', async () => {
    const user = userEvent.setup();
    const onThisMonth = vi.fn();
    renderPage({ onThisMonth });

    await user.click(screen.getByRole('button', { name: 'Monday, October 12, 1 item' }));
    await user.click(screen.getByRole('button', { name: 'Today' }));

    expect(onThisMonth).toHaveBeenCalledOnce();
    expect(
      within(getDayPanel()).getByRole('heading', { name: 'Monday, October 5' }),
    ).toBeInTheDocument();
  });

  it('links each item to its job, naming the kind and the company', () => {
    renderPage();

    expect(
      screen.getByRole('link', { name: 'Interview prep: Prepare system design, Celonis' }),
    ).toHaveAttribute('href', `/jobs/${MOCK_JOB_IDS.celonis}`);
    expect(
      screen.getByRole('link', { name: 'Task: Tailor CV bullets, Personio, done' }),
    ).toHaveAttribute('href', `/jobs/${MOCK_JOB_IDS.personio}`);
  });

  it('shows a completed item struck through and marked done', () => {
    renderPage();

    const link = screen.getByRole('link', { name: 'Task: Tailor CV bullets, Personio, done' });

    expect(within(link).getByText('Tailor CV bullets')).toHaveClass('line-through');
    expect(link).toHaveTextContent('Task · Done');
  });

  it('tints a kind the same in the grid chip, the panel, and the colour key', () => {
    const { container } = renderPage();

    const grid = getGrid(container);
    const link = screen.getByRole('link', { name: /Prepare system design/ });

    // Reminder lavender, submitted document mint, completed task muted.
    expect(within(grid).getByText('Prepare system design')).toHaveClass('bg-primary-100');
    expect(within(link).getByText('Interview prep')).toHaveClass('bg-primary-100');
    expect(within(grid).getByText('Cover letter v2')).toHaveClass('bg-success-100');
    expect(within(grid).getByText('Tailor CV bullets')).toHaveClass(
      'bg-app-surface2',
      'line-through',
    );
    expect(
      within(screen.getByRole('list', { name: 'Colour key' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Reminder', 'Task', 'Submitted document']);
  });

  it('keeps grid chips out of the accessibility tree, so items are not announced twice', () => {
    renderPage();

    expect(screen.getAllByRole('link', { name: /Prepare system design/ })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /Prepare system design/ })).not.toBeInTheDocument();
  });

  it('shows one dot per kind on a phone-sized day', () => {
    renderPage();

    const day = screen.getByRole('button', { name: 'Monday, October 5, 2 items, today' });
    const dots = day.querySelector('.md\\:hidden') as HTMLElement;

    expect(dots.children).toHaveLength(2);
    expect(dots.children[0]).toHaveClass('bg-primary-500');
    expect(dots.children[1]).toHaveClass('bg-orange-500');
  });

  it('rounds the corner days to the grid border, so a selected corner day is not cut off', () => {
    // February 2027 starts on a Monday and has 28 days, so all four
    // corners are days of the month.
    renderPage({ items: [], month: { month: 1, year: 2027 } });

    expect(screen.getByRole('button', { name: 'Monday, February 1, no items' })).toHaveClass(
      'rounded-tl-[11px]',
    );
    expect(screen.getByRole('button', { name: 'Sunday, February 7, no items' })).toHaveClass(
      'rounded-tr-[11px]',
    );
    expect(screen.getByRole('button', { name: 'Monday, February 22, no items' })).toHaveClass(
      'rounded-bl-[11px]',
    );
    expect(screen.getByRole('button', { name: 'Sunday, February 28, no items' })).toHaveClass(
      'rounded-br-[11px]',
    );
    expect(screen.getByRole('button', { name: 'Monday, February 8, no items' })).not.toHaveClass(
      'rounded-tl-[11px]',
    );
  });

  it('marks today in the grid', () => {
    renderPage();

    expect(within(screen.getByRole('button', { name: /October 5,/ })).getByText('5')).toHaveClass(
      'bg-primary-600',
    );
  });

  it('shows "+n more" on a day with more items than fit, and lists them all in the panel', () => {
    const crowded = Array.from(
      { length: 5 },
      (_, index): TCalendarItem => ({
        ...interviewPrep,
        id: `reminder-${index}`,
        title: `Item ${index}`,
      }),
    );
    const { container } = renderPage({ items: crowded });

    const grid = getGrid(container);

    expect(within(grid).getByText('+2 more')).toBeInTheDocument();
    expect(within(grid).queryByText('Item 3')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Item 3/ })).toBeInTheDocument();
  });

  it('leaves days of the neighbouring months empty, since their items are not loaded', () => {
    const { container } = renderPage({
      items: [interviewPrep, { ...interviewPrep, date: '2026-11-01', id: 'next-month' }],
    });

    expect(within(getGrid(container)).getAllByText('Prepare system design')).toHaveLength(1);
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
    expect(within(getDayPanel()).queryByRole('list')).not.toBeInTheDocument();
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

  it('shows a loading state once, keeping the month buttons', () => {
    renderPage({ isLoading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Loading calendar');
    expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /October 5/ })).not.toBeInTheDocument();
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
