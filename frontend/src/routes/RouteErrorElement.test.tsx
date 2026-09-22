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

    const alert = await screen.findByRole('alert');

    // The status is inside the alert region, not a sibling of it, so it is
    // part of what assistive technology is actually told about - the whole
    // point of this element existing.
    expect(alert).toHaveTextContent('Something went wrong');
    expect(alert).toHaveTextContent('503');
    // This fallback replaces the whole page, so it needs its own heading
    // for assistive-technology heading navigation, even though the same
    // text is already inside the alert region above - including the
    // status, so heading-list navigation does not lose it either.
    expect(
      screen.getByRole('heading', { level: 1, name: '503 — Something went wrong' }),
    ).toBeInTheDocument();
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

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Something went wrong');
    expect(alert).not.toHaveTextContent('503');

    try {
      await user.click(screen.getByRole('button', { name: 'Try again' }));
    } finally {
      consoleError.mockRestore();
    }

    await user.click(screen.getByRole('button', { name: 'Go to dashboard' }));

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
  });

  it('catches a render exception, not just a loader error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const BrokenComponent = () => {
      throw new Error('Broken render');
    };
    const router = createMemoryRouter(
      [
        {
          element: <BrokenComponent />,
          errorElement: <RouteErrorElement />,
          path: '/',
        },
      ],
      {
        initialEntries: ['/'],
      },
    );

    renderWithProviders(<RouterProvider router={router} />);

    try {
      expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    } finally {
      consoleError.mockRestore();
    }
  });
});
