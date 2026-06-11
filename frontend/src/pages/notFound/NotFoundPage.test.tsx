import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test/renderWithProviders';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('renders a helpful message and navigates back to the dashboard', async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        {
          element: <NotFoundPage />,
          path: '*',
        },
        {
          element: <h1>Dashboard route</h1>,
          path: '/dashboard',
        },
      ],
      {
        initialEntries: ['/missing'],
      },
    );

    renderWithProviders(<RouterProvider router={router} />);

    expect(screen.getByText('We could not find that page')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go to dashboard' }));

    expect(await screen.findByRole('heading', { name: 'Dashboard route' })).toBeInTheDocument();
  });
});
