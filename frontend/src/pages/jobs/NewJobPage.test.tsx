import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { NewJobPage } from './NewJobPage';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('NewJobPage', () => {
  it('renders an empty add job form', () => {
    renderWithProviders(
      <RouterProvider
        router={createMemoryRouter([
          {
            path: '/',
            element: <NewJobPage />,
          },
        ])}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Add job' })).toBeInTheDocument();
    expect(screen.getByLabelText('Company')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('WISHLIST');
  });

  it('submits a new job payload and returns to jobs', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();
    const router = createMemoryRouter(
      [
        {
          path: '/jobs/new',
          element: <NewJobPage onSave={handleSave} />,
        },
        {
          path: '/jobs',
          element: <p>Jobs route</p>,
        },
      ],
      {
        initialEntries: ['/jobs/new'],
      },
    );

    renderWithProviders(<RouterProvider router={router} />);

    await user.type(screen.getByLabelText('Company'), 'Acme GmbH');
    await user.type(screen.getByLabelText('Role'), 'Frontend Engineer');
    await user.click(screen.getByRole('button', { name: 'Create job' }));

    await waitFor(() =>
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          company: 'Acme GmbH',
          roleTitle: 'Frontend Engineer',
          status: 'WISHLIST',
        }),
      ),
    );
    expect(await screen.findByText('Jobs route')).toBeInTheDocument();
  });

  it('returns to jobs when cancelled', async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        {
          path: '/jobs/new',
          element: <NewJobPage />,
        },
        {
          path: '/jobs',
          element: <p>Jobs route</p>,
        },
      ],
      {
        initialEntries: ['/jobs/new'],
      },
    );

    renderWithProviders(<RouterProvider router={router} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByText('Jobs route')).toBeInTheDocument();
  });
});
