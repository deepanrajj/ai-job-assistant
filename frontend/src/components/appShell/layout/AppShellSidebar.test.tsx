import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { AppShellSidebar } from './AppShellSidebar';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('AppShellSidebar', () => {
  it('preserves all desktop destinations when collapsed', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/jobs/123']}>
        <AppShellSidebar
          collapsed
          mobileOpen={false}
          onCloseMobile={() => {}}
          onToggleCollapsed={() => {}}
        />
      </MemoryRouter>,
    );

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getAllByRole('link')).toHaveLength(6);
    expect(within(nav).getByRole('link', { name: 'Jobs' })).toHaveAttribute('aria-current', 'page');
    const jobsLink = within(nav).getByRole('link', { name: 'Jobs' });
    expect(within(jobsLink).getByText('Jobs')).toHaveClass('sr-only');
  });

  it('closes the mobile drawer through its visible control', async () => {
    const user = userEvent.setup();
    const onCloseMobile = vi.fn();
    renderWithProviders(
      <MemoryRouter initialEntries={['/jobs']}>
        <AppShellSidebar
          collapsed={false}
          mobileOpen
          onCloseMobile={onCloseMobile}
          onToggleCollapsed={() => {}}
        />
      </MemoryRouter>,
    );

    await user.click(
      within(screen.getByRole('dialog', { name: 'Mobile navigation' })).getByRole('button', {
        name: 'Close navigation menu',
      }),
    );
    expect(onCloseMobile).toHaveBeenCalledTimes(1);
  });

  it('offers Add Job and the language switch inside the mobile drawer', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/jobs']}>
        <AppShellSidebar
          collapsed={false}
          mobileOpen
          onCloseMobile={() => {}}
          onToggleCollapsed={() => {}}
        />
      </MemoryRouter>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Mobile navigation' });
    expect(within(dialog).getByRole('group', { name: 'Language' })).toBeInTheDocument();
    // Following the link leaves the route, which closes the drawer in AppShell.
    expect(within(dialog).getByRole('link', { name: 'Add Job' })).toHaveAttribute(
      'href',
      '/jobs/new',
    );
  });

  it('hides the drawer Add Job action on the create page', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/jobs/new']}>
        <AppShellSidebar
          collapsed={false}
          mobileOpen
          onCloseMobile={() => {}}
          onToggleCollapsed={() => {}}
        />
      </MemoryRouter>,
    );

    expect(
      within(screen.getByRole('dialog', { name: 'Mobile navigation' })).queryByRole('link', {
        name: 'Add Job',
      }),
    ).not.toBeInTheDocument();
  });
});
