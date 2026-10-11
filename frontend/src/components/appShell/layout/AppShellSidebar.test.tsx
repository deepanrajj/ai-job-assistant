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
    expect(within(jobsLink).getAllByText('Jobs')[0]).toHaveClass('sr-only');
    expect(within(jobsLink).getAllByText('Jobs')[1]).toHaveAttribute('aria-hidden', 'true');
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

  it('offers Add Job and the language switch inside the mobile drawer', async () => {
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

    const dialog = screen.getByRole('dialog', { name: 'Mobile navigation' });
    expect(within(dialog).getByRole('group', { name: 'Language' })).toBeInTheDocument();
    const addJob = within(dialog).getByRole('link', { name: 'Add Job' });
    expect(addJob).toHaveAttribute('href', '/jobs/new');
    await user.click(addJob);
    expect(onCloseMobile).toHaveBeenCalledTimes(1);
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
