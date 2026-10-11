import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
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

/**
 * Simulates the viewport for `useBreakpoint`: below `lg` until `setDesktop(true)` fires a change.
 */
const mockViewport = () => {
  let desktop = false;
  const listeners = new Set<() => void>();
  // Swap rather than spy: spying on the setup file's mock and restoring it would wipe it.
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = vi.fn(
    (query: string) =>
      ({
        addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
        matches: desktop && query.includes('64rem'),
        media: query,
        removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
      }) as unknown as MediaQueryList,
  );

  return {
    restore: () => {
      window.matchMedia = originalMatchMedia;
    },
    setDesktop: (value: boolean) => {
      desktop = value;
      listeners.forEach((listener) => listener());
    },
  };
};

describe('AppShell', () => {
  let viewport: ReturnType<typeof mockViewport>;

  beforeEach(() => {
    viewport = mockViewport();
  });

  afterEach(() => {
    viewport.restore();
  });

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
    const navigation = within(screen.getByRole('dialog', { name: 'Mobile navigation' })).getByRole(
      'navigation',
    );
    expect(within(navigation).getAllByRole('link')).toHaveLength(6);
    expect(within(navigation).getByRole('link', { name: 'Applications' })).toHaveAttribute(
      'href',
      APP_PATHS.APPLICATIONS,
    );
    await user.click(within(navigation).getByRole('link', { name: 'Applications' }));
    expect(screen.getByText('applications outlet')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).not.toBeInTheDocument();
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

    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveFocus();
  });

  it('keeps keyboard focus within the open mobile drawer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter()} />);

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const navigation = within(screen.getByRole('dialog', { name: 'Mobile navigation' })).getByRole(
      'navigation',
    );
    const englishButton = within(
      screen.getByRole('dialog', { name: 'Mobile navigation' }),
    ).getByRole('button', { name: 'EN English' });
    // From the close button: back over the language switch, then wrap to the last link.
    await user.tab({ shift: true });
    await user.tab({ shift: true });
    expect(englishButton).toHaveFocus();
    await user.tab({ shift: true });
    expect(within(navigation).getByRole('link', { name: 'Profile' })).toHaveFocus();
    await user.tab();
    expect(englishButton).toHaveFocus();
  });

  it('keeps all destinations named when the desktop sidebar is collapsed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter()} />);

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    const navigation = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(navigation).getAllByRole('link')).toHaveLength(6);
    const jobsLink = within(navigation).getByRole('link', { name: 'Jobs' });
    expect(jobsLink).not.toHaveAttribute('title');
    act(() => jobsLink.focus());
    expect(screen.getByRole('tooltip')).toHaveTextContent('Jobs');
    const toggle = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', navigation.id);
  });

  it('updates the language from the header language selector', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter('/dashboard')} />);

    await user.click(screen.getByRole('button', { name: 'DE German' }));

    expect(document.documentElement).toHaveAttribute('lang', 'de');
    expect(screen.getByRole('navigation', { name: 'Hauptnavigation' })).toBeInTheDocument();
  });

  it('renders the page heading inside the main landmark', () => {
    renderWithProviders(<RouterProvider router={createAppShellRouter()} />);

    expect(
      within(screen.getByRole('main')).getByRole('heading', { level: 1, name: 'Jobs' }),
    ).toBeInTheDocument();
  });

  it('makes the page behind the open drawer inert and locks its scroll', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter()} />);

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(document.querySelector('header')).toHaveAttribute('inert');
    expect(document.getElementById('main-content')?.parentElement?.parentElement).toHaveAttribute(
      'inert',
    );
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(screen.getByRole('banner')).not.toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('');
  });

  it('closes the mobile drawer when the route changes outside it', async () => {
    const user = userEvent.setup();
    const router = createAppShellRouter();
    renderWithProviders(<RouterProvider router={router} />);

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    await act(() => router.navigate('/dashboard'));

    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();

    // Returning to the route the drawer was opened on must not reopen it.
    await act(() => router.navigate(-1));
    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('makes the skip link inert while the drawer is open', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter()} />);

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(screen.getByText('Skip to main content')).toHaveAttribute('inert');
  });

  it('closes the mobile drawer when the viewport reaches the desktop breakpoint', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter()} />);

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    act(() => viewport.setDesktop(true));
    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).not.toBeInTheDocument();

    // Shrinking back must not reopen the drawer.
    act(() => viewport.setDesktop(false));
    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).not.toBeInTheDocument();
  });

  it('resets scroll on link navigation but keeps it on Back', async () => {
    const router = createAppShellRouter();
    renderWithProviders(<RouterProvider router={router} />);

    document.documentElement.scrollTop = 500;
    await act(() => router.navigate('/dashboard'));
    expect(document.documentElement.scrollTop).toBe(0);

    document.documentElement.scrollTop = 500;
    await act(() => router.navigate(-1));
    expect(document.documentElement.scrollTop).toBe(500);
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('closes the drawer and returns focus when its current-route link is chosen', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RouterProvider router={createAppShellRouter()} />);

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Mobile navigation' });
    await user.click(within(dialog).getByRole('link', { name: 'Jobs' }));

    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveFocus();
  });
});
