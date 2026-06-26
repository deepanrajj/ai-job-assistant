import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { JobsPage } from './JobsPage';
import { renderWithProviders } from '../../test/renderWithProviders';
import { renderWithRouter } from '../../test/renderWithRouter';
import { createMockJobs } from '../../test/mockJobs';

describe('JobsPage', () => {
  it('searches saved jobs by company name', async () => {
    const user = userEvent.setup();
    renderWithRouter(<JobsPage jobs={createMockJobs()} />);

    expect(screen.getByRole('heading', { name: 'Saved jobs' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search'), 'personio');

    expect(screen.getByRole('rowheader', { name: /Personio/i })).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /Celonis/i })).not.toBeInTheDocument();
  });

  it('filters saved jobs by status', async () => {
    const user = userEvent.setup();
    renderWithRouter(<JobsPage jobs={createMockJobs()} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'INTERVIEW');

    expect(screen.getByRole('rowheader', { name: /Celonis/i })).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /Personio/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: /Miro/i })).not.toBeInTheDocument();
  });

  it('navigates to the add job route from the table action', async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        {
          path: '/jobs',
          element: <JobsPage jobs={createMockJobs()} />,
        },
        {
          path: '/jobs/new',
          element: <p>Add job route</p>,
        },
      ],
      {
        initialEntries: ['/jobs'],
      },
    );

    renderWithProviders(<RouterProvider router={router} />);

    await user.click(screen.getByRole('button', { name: 'Add Job' }));

    expect(await screen.findByText('Add job route')).toBeInTheDocument();
  });
});
