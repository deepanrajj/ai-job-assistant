import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  Component as DashboardRoute,
  DashboardRouteWithReminders,
  DashboardRouteWithoutReminders,
} from './dashboardRoute';
import { renderWithRouter } from '../../test/renderWithRouter';
import { MOCK_JOB_IDS, createMockJobResponses } from '../../test/mockJobs';
import { createMockNextReminderResponse } from '../../test/mockReminders';
import { server } from '../../test/server';

describe('dashboardRoute', () => {
  beforeEach(() => {
    server.use(http.get('/api/jobs', () => HttpResponse.json(createMockJobResponses())));
  });

  it('renders dashboard content from the jobs the backend returns', async () => {
    renderWithRouter(<DashboardRoute />);

    expect(await screen.findByText('Total jobs')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument();

    // A company name proves the rows came from the response rather than from
    // a rendered shell that happens to carry the right headings.
    expect(screen.getByText('Celonis')).toBeInTheDocument();
  });

  it('renders the error state when the jobs request fails', async () => {
    server.use(http.get('/api/jobs', () => new HttpResponse(null, { status: 500 })));
    renderWithRouter(<DashboardRoute />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Dashboard could not be loaded');
  });

  it('renders the next reminders the backend returns, named by their job', async () => {
    server.use(
      http.get('/api/reminders/next', () =>
        HttpResponse.json([createMockNextReminderResponse({ jobId: MOCK_JOB_IDS.celonis })]),
      ),
    );
    renderWithRouter(<DashboardRoute />);

    expect(
      await screen.findByRole('link', {
        name: 'Open Celonis for reminder Follow up with recruiter',
      }),
    ).toBeInTheDocument();
  });

  it('keeps the dashboard when only the reminders request fails', async () => {
    server.use(http.get('/api/reminders/next', () => new HttpResponse(null, { status: 500 })));
    renderWithRouter(<DashboardRoute />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Reminders could not be loaded');
    expect(screen.getByText('Total jobs')).toBeInTheDocument();
  });

  it('uses the variant with reminders while the feature is on, as it is under test', () => {
    expect(DashboardRoute).toBe(DashboardRouteWithReminders);
  });

  it('renders without the reminders card, and never asks for reminders, while the feature is off', async () => {
    let reminderRequests = 0;
    server.use(
      http.get('/api/reminders/next', () => {
        reminderRequests += 1;

        return HttpResponse.json([]);
      }),
    );
    renderWithRouter(<DashboardRouteWithoutReminders />);

    expect(await screen.findByText('Celonis')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Next reminders' })).not.toBeInTheDocument();
    expect(reminderRequests).toBe(0);
  });
});
