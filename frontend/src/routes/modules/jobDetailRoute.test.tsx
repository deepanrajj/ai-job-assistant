import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { Component as JobDetailRoute } from './jobDetailRoute';
import { Component as JobsRoute } from './jobsRoute';
import { renderWithProviders } from '../../test/renderWithProviders';
import { MOCK_JOB_IDS, createMockJobResponse, createMockJobResponses } from '../../test/mockJobs';
import { server } from '../../test/server';
import { APP_PATHS } from '../paths';

const renderJobDetailRoute = (initialEntry: string) => {
  const router = createMemoryRouter(
    [
      {
        path: APP_PATHS.JOBS,
        element: <JobsRoute />,
      },
      {
        path: APP_PATHS.JOB_DETAIL,
        element: <JobDetailRoute />,
      },
    ],
    {
      initialEntries: [initialEntry],
    },
  );

  return renderWithProviders(<RouterProvider router={router} />);
};

const celonisDetailEndpoint = `/api/jobs/${MOCK_JOB_IDS.celonis}`;

describe('jobDetailRoute', () => {
  it('renders the job the route param names', async () => {
    server.use(
      http.get(celonisDetailEndpoint, () =>
        HttpResponse.json(
          createMockJobResponse({
            company: 'Celonis',
            id: MOCK_JOB_IDS.celonis,
            roleTitle: 'Senior Frontend Engineer',
          }),
        ),
      ),
    );
    renderJobDetailRoute(`/jobs/${MOCK_JOB_IDS.celonis}`);

    expect(
      await screen.findByRole('heading', { name: 'Senior Frontend Engineer' }),
    ).toBeInTheDocument();
  });

  it('renders the not found state for a job the backend does not have', async () => {
    server.use(
      http.get(celonisDetailEndpoint, () =>
        HttpResponse.json({ code: 'JOB_NOT_FOUND', message: 'Job not found.' }, { status: 404 }),
      ),
    );
    renderJobDetailRoute(`/jobs/${MOCK_JOB_IDS.celonis}`);

    expect(await screen.findByRole('alert')).toHaveTextContent('Job not found');
  });

  it('renders the load error state when the request fails', async () => {
    server.use(http.get(celonisDetailEndpoint, () => new HttpResponse(null, { status: 500 })));
    renderJobDetailRoute(`/jobs/${MOCK_JOB_IDS.celonis}`);

    expect(await screen.findByRole('alert')).toHaveTextContent('Job could not be loaded');
  });

  it('opens the job a jobs list row links to', async () => {
    // The regression for bug 004. The list has rendered backend ids since
    // task 024 while this page resolved them against localStorage, so every
    // row's details action landed on the not-found state. Fixture ids are
    // UUIDs, which is what stops one coinciding with a seeded local id.
    const user = userEvent.setup();

    server.use(
      http.get('/api/jobs', () => HttpResponse.json(createMockJobResponses())),
      http.get(`/api/jobs/${MOCK_JOB_IDS.miro}`, () =>
        HttpResponse.json(
          createMockJobResponse({
            company: 'Miro',
            id: MOCK_JOB_IDS.miro,
            roleTitle: 'Senior Product Engineer',
          }),
        ),
      ),
    );
    renderJobDetailRoute(APP_PATHS.JOBS);

    await user.click(await screen.findByRole('link', { name: 'View details for Miro' }));

    expect(
      await screen.findByRole('heading', { name: 'Senior Product Engineer' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Job not found')).not.toBeInTheDocument();
  });
});
