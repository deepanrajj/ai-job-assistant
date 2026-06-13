import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { RouteErrorElement } from './RouteErrorElement';
import { renderWithProviders } from '../test/renderWithProviders';

describe('RouteErrorElement', () => {
  it('renders translated route errors with the response status', async () => {
    const router = createMemoryRouter(
      [
        {
          element: <div>Broken route</div>,
          errorElement: <RouteErrorElement />,
          loader: () => {
            throw new Response('Broken', {
              status: 503,
            });
          },
          path: '/',
        },
      ],
      {
        initialEntries: ['/'],
      },
    );

    renderWithProviders(<RouterProvider router={router} />);

    expect(
      await screen.findByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument();
    expect(screen.getByText('503')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('handles non-response errors and retry actions', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const router = createMemoryRouter(
      [
        {
          element: <div>Broken route</div>,
          errorElement: <RouteErrorElement />,
          loader: () => {
            throw new Error('Broken');
          },
          path: '/',
        },
        {
          element: <p>Dashboard page</p>,
          path: '/dashboard',
        },
      ],
      {
        initialEntries: ['/'],
      },
    );

    renderWithProviders(<RouterProvider router={router} />);

    expect(
      await screen.findByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('503')).not.toBeInTheDocument();

    try {
      await user.click(screen.getByRole('button', { name: 'Try again' }));
    } finally {
      consoleError.mockRestore();
    }

    await user.click(screen.getByRole('button', { name: 'Go to dashboard' }));

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
  });
});
