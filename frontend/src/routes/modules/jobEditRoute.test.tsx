import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { Component as JobEditRoute } from './jobEditRoute';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('jobEditRoute', () => {
  it('renders edit job content for the route param', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/jobs/:jobId/edit',
          element: <JobEditRoute />,
        },
      ],
      {
        initialEntries: ['/jobs/job-001/edit'],
      },
    );

    renderWithProviders(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { name: 'Edit job' })).toBeInTheDocument();
    expect(screen.getByLabelText('Company')).toHaveValue('Celonis');
  });
});
