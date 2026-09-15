import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { Component as DashboardRoute } from './dashboardRoute';
import { renderWithProviders } from '../../test/renderWithProviders';
import { createMockJobResponses } from '../../test/mockJobs';
import { server } from '../../test/server';

describe('dashboardRoute', () => {
  beforeEach(() => {
    server.use(http.get('/api/jobs', () => HttpResponse.json(createMockJobResponses())));
  });

  it('renders dashboard content from the jobs the backend returns', async () => {
    renderWithProviders(<DashboardRoute />);

    expect(await screen.findByText('Total jobs')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument();

    // A company name proves the rows came from the response rather than from
    // a rendered shell that happens to carry the right headings.
    expect(screen.getByText('Celonis')).toBeInTheDocument();
  });

  it('renders the error state when the jobs request fails', async () => {
    server.use(http.get('/api/jobs', () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<DashboardRoute />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Dashboard could not be loaded');
  });
});
