import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { Component as JobDetailRoute } from './jobDetailRoute';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('jobDetailRoute', () => {
  it('renders job detail content for the route param', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/jobs/:jobId',
          element: <JobDetailRoute />,
        },
      ],
      {
        initialEntries: ['/jobs/job-001'],
      },
    );

    renderWithProviders(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { name: 'Senior Frontend Engineer' })).toBeInTheDocument();
  });
});
