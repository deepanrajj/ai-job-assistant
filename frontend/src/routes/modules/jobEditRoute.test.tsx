import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { Component as JobEditRoute } from './jobEditRoute';
import { renderWithProviders } from '../../test/renderWithProviders';
import { MOCK_JOB_IDS, createMockJobResponse } from '../../test/mockJobs';
import { server } from '../../test/server';

const renderJobEditRoute = () => {
  const router = createMemoryRouter(
    [
      {
        path: '/jobs/:jobId/edit',
        element: <JobEditRoute />,
      },
    ],
    {
      initialEntries: [`/jobs/${MOCK_JOB_IDS.celonis}/edit`],
    },
  );

  return renderWithProviders(<RouterProvider router={router} />);
};

describe('jobEditRoute', () => {
  it('prefills the form with the job the route param names', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}`, () =>
        HttpResponse.json(
          createMockJobResponse({
            company: 'Celonis',
            id: MOCK_JOB_IDS.celonis,
          }),
        ),
      ),
    );
    renderJobEditRoute();

    expect(await screen.findByRole('heading', { name: 'Edit job' })).toBeInTheDocument();
    expect(screen.getByLabelText('Company')).toHaveValue('Celonis');
  });

  it('renders the not found state for a job the backend does not have', async () => {
    server.use(
      http.get(`/api/jobs/${MOCK_JOB_IDS.celonis}`, () =>
        HttpResponse.json({ code: 'JOB_NOT_FOUND', message: 'Job not found.' }, { status: 404 }),
      ),
    );
    renderJobEditRoute();

    expect(await screen.findByRole('alert')).toHaveTextContent('Job not found');
  });
});
