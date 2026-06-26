import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { AppShell } from './AppShell';
import { renderWithProviders } from '../../test/renderWithProviders';
import { appRouteHandles } from '../../routes/routes.constants';

const createAppShellRouter = (initialPath = '/jobs') =>
  createMemoryRouter(
    [
      {
        element: <AppShell />,
        children: [
          {
            element: <p>Dashboard outlet</p>,
            handle: appRouteHandles.DASHBOARD,
            path: '/dashboard',
          },
          {
            element: <p>Jobs outlet</p>,
            handle: appRouteHandles.JOBS,
            path: '/jobs',
          },
        ],
      },
    ],
    {
      initialEntries: [initialPath],
    },
  );

describe('AppShell', () => {
  it('renders active route metadata from route handles', () => {
    renderWithProviders(<RouterProvider router={createAppShellRouter()} />);

    expect(screen.getByRole('heading', { name: 'Jobs' })).toBeInTheDocument();
    expect(
      screen.getByText('Review your saved opportunities and keep the pipeline moving.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Jobs outlet')).toBeInTheDocument();
  });

  it('navigates through accessible navigation links', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter()} />);

    await user.click(
      within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', {
        name: 'Dashboard',
      }),
    );

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Dashboard outlet')).toBeInTheDocument();
  });

  it('updates the language from the header language selector', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter('/dashboard')} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'de');

    expect(document.documentElement).toHaveAttribute('lang', 'de');
    expect(screen.getByText('Lokale Tracker-Daten')).toBeInTheDocument();
  });
});
