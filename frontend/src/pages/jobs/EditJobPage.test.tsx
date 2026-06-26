import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { EditJobPage } from './EditJobPage';
import { renderWithProviders } from '../../test/renderWithProviders';
import { createMockJobs } from '../../test/mockJobs';

describe('EditJobPage', () => {
  it('renders an edit form with existing job values', () => {
    renderWithProviders(
      <RouterProvider
        router={createMemoryRouter([
          {
            path: '/',
            element: <EditJobPage jobId="job-001" jobs={createMockJobs()} />,
          },
        ])}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Edit job' })).toBeInTheDocument();
    expect(screen.getByLabelText('Company')).toHaveValue('Celonis');
    expect(screen.getByLabelText('Role')).toHaveValue('Senior Frontend Engineer');
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('INTERVIEW');
  });

  it('submits an edited job payload and returns to jobs', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    const router = createMemoryRouter(
      [
        {
          path: '/jobs/:jobId/edit',
          element: <EditJobPage jobId="job-001" jobs={createMockJobs()} onSave={handleSave} />,
        },
        {
          path: '/jobs',
          element: <p>Jobs route</p>,
        },
      ],
      {
        initialEntries: ['/jobs/job-001/edit'],
      },
    );

    renderWithProviders(<RouterProvider router={router} />);

    await user.clear(screen.getByLabelText('Company'));
    await user.type(screen.getByLabelText('Company'), 'Updated GmbH');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          company: 'Updated GmbH',
          id: 'job-001',
        }),
      ),
    );
    expect(await screen.findByText('Jobs route')).toBeInTheDocument();
  });

  it('renders an error state when the edited job does not exist', async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        {
          path: '/jobs/:jobId/edit',
          element: <EditJobPage jobId="missing-job" jobs={createMockJobs()} />,
        },
        {
          path: '/jobs',
          element: <p>Jobs route</p>,
        },
      ],
      {
        initialEntries: ['/jobs/missing-job/edit'],
      },
    );

    renderWithProviders(<RouterProvider router={router} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Job not found');

    await user.click(screen.getByRole('button', { name: 'Back to jobs' }));

    expect(await screen.findByText('Jobs route')).toBeInTheDocument();
  });
});
