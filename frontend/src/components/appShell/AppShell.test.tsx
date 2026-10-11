import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { AppShell } from './AppShell';
import { renderWithProviders } from '../../test/renderWithProviders';
import { APP_PATHS } from '../../routes/paths';
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
          {
            element: <p>Job detail outlet</p>,
            handle: appRouteHandles.JOB_DETAIL,
            path: '/jobs/:jobId',
          },
          {
            element: <p>Add job outlet</p>,
            handle: appRouteHandles.JOB_NEW,
            path: '/jobs/new',
          },
          ...(
            [
              ['discover', appRouteHandles.DISCOVER],
              ['applications', appRouteHandles.APPLICATIONS],
              ['calendar', appRouteHandles.CALENDAR],
              ['profile', appRouteHandles.PROFILE],
            ] as const
          ).map(([path, handle]) => ({
            element: <p>{path} outlet</p>,
            handle,
            path: `/${path}`,
          })),
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

  it.each([
    [APP_PATHS.DASHBOARD, 'Dashboard'],
    [APP_PATHS.JOBS, 'Jobs'],
    ['/jobs/job-123', 'Jobs'],
    [APP_PATHS.DISCOVER, 'Discover'],
    [APP_PATHS.APPLICATIONS, 'Applications'],
    [APP_PATHS.CALENDAR, 'Calendar'],
    [APP_PATHS.PROFILE, 'Profile'],
  ])('marks %s under %s in the main navigation', (path, label) => {
    renderWithProviders(<RouterProvider router={createAppShellRouter(path)} />);

    const navigation = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(navigation).getByRole('link', { name: label })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('keeps the skip link first and routes the global Add Job action', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter('/jobs')} />);

    await user.tab();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('main')).toHaveAttribute('aria-labelledby', 'page-title');
    expect(
      within(screen.getByRole('banner')).getByRole('link', { name: 'Add Job' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Add Job' })).toHaveLength(1);

    await user.click(screen.getByRole('link', { name: 'Add Job' }));
    expect(screen.getByText('Add job outlet')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Add Job' })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('opens the mobile drawer with all routes and closes it after navigation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter()} />);

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const navigation = screen.getByRole('navigation', { name: 'Mobile navigation' });
    expect(within(navigation).getAllByRole('link')).toHaveLength(6);
    expect(within(navigation).getByRole('link', { name: 'Applications' })).toHaveAttribute(
      'href',
      APP_PATHS.APPLICATIONS,
    );
    await user.click(within(navigation).getByRole('link', { name: 'Applications' }));
    expect(screen.getByText('applications outlet')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('closes the mobile drawer with Escape and returns focus to the menu button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter()} />);

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(
      within(screen.getByRole('dialog', { name: 'Mobile navigation' })).getByRole('button', {
        name: 'Close navigation menu',
      }),
    ).toHaveFocus();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveFocus();
  });

  it('keeps keyboard focus within the open mobile drawer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter()} />);

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const navigation = screen.getByRole('navigation', { name: 'Mobile navigation' });
    await user.tab({ shift: true });
    expect(within(navigation).getByRole('link', { name: 'Profile' })).toHaveFocus();
    await user.tab();
    expect(
      within(screen.getByRole('dialog', { name: 'Mobile navigation' })).getByRole('button', {
        name: 'Close navigation menu',
      }),
    ).toHaveFocus();
  });

  it('keeps all destinations named when the desktop sidebar is collapsed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter()} />);

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    const navigation = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(navigation).getAllByRole('link')).toHaveLength(6);
    expect(within(navigation).getByRole('link', { name: 'Jobs' })).toHaveAttribute('title', 'Jobs');
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('updates the language from the header language selector', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter('/dashboard')} />);

    await user.click(screen.getByRole('button', { name: 'German' }));

    expect(document.documentElement).toHaveAttribute('lang', 'de');
    expect(screen.getByRole('navigation', { name: 'Hauptnavigation' })).toBeInTheDocument();
  });
});
