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
    expect(within(nav).getByText('Jobs')).toHaveClass('sr-only');
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
});
