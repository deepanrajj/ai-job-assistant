import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import {
  CalendarRouteComingSoon,
  CalendarRouteWithItems,
  Component as CalendarRoute,
} from './calendarRoute';
import { getLocalIsoDate } from '../../features/reminders/reminders.utils';
import { renderWithRouter } from '../../test/renderWithRouter';
import { MOCK_JOB_IDS, createMockJobResponses } from '../../test/mockJobs';
import { server } from '../../test/server';

describe('calendarRoute', () => {
  it('uses the variant with items while the feature is on, as it is under test', () => {
    expect(CalendarRoute).toBe(CalendarRouteWithItems);
  });

  it('asks for the current month, then the next month when moving forward', async () => {
    const user = userEvent.setup();
    const requestedRanges: string[] = [];
    const today = new Date();
    const thisMonthStart = getLocalIsoDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const nextMonthStart = getLocalIsoDate(new Date(today.getFullYear(), today.getMonth() + 1, 1));
    server.use(
      http.get('/api/jobs', () => HttpResponse.json(createMockJobResponses())),
      http.get('/api/calendar-items', ({ request }) => {
        const url = new URL(request.url);

        requestedRanges.push(url.searchParams.get('from') ?? '');

        return HttpResponse.json([
          {
            date: url.searchParams.get('from'),
            documentType: null,
            id: 'reminder-1',
            isComplete: false,
            jobId: MOCK_JOB_IDS.celonis,
            reminderType: 'FOLLOW_UP',
            source: 'REMINDER',
            title: 'Follow up',
          },
        ]);
      }),
    );
    renderWithRouter(<CalendarRoute />);

    expect(
      await screen.findByRole('link', { name: 'Follow-up: Follow up, Celonis' }),
    ).toHaveAttribute('href', `/jobs/${MOCK_JOB_IDS.celonis}`);

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    await screen.findByRole('link', { name: 'Follow-up: Follow up, Celonis' });

    expect(requestedRanges).toEqual([thisMonthStart, nextMonthStart]);
  });

  it('shows one error with a retry when the items request fails', async () => {
    server.use(
      http.get('/api/jobs', () => HttpResponse.json(createMockJobResponses())),
      http.get('/api/calendar-items', () => new HttpResponse(null, { status: 500 })),
    );
    renderWithRouter(<CalendarRoute />);

    expect(await screen.findByRole('alert')).toHaveTextContent('The calendar could not be loaded');
  });

  it('keeps the coming soon placeholder, making no request, while the feature is off', () => {
    renderWithRouter(<CalendarRouteComingSoon />);

    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
