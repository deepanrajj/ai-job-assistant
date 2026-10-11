import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { AppShellHeader } from './AppShellHeader';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('AppShellHeader', () => {
  it('shows the brand, shared Add Job action, language switch, profile route, and mobile menu control', async () => {
    const user = userEvent.setup();
    const onToggleMobileMenu = vi.fn();
    renderWithProviders(
      <MemoryRouter initialEntries={['/jobs']}>
        <AppShellHeader
          menuButtonRef={createRef<HTMLButtonElement>()}
          mobileMenuOpen={false}
          onToggleMobileMenu={onToggleMobileMenu}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Smart Job Tracker' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add Job' })).toHaveAttribute('href', '/jobs/new');
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(onToggleMobileMenu).toHaveBeenCalledTimes(1);
  });

  it('hides the Add Job action on the create page', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/jobs/new']}>
        <AppShellHeader
          menuButtonRef={createRef<HTMLButtonElement>()}
          mobileMenuOpen={false}
          onToggleMobileMenu={() => {}}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Add Job' })).not.toBeInTheDocument();
  });

  it('makes no claim about the data source', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/jobs']}>
        <AppShellHeader
          menuButtonRef={createRef<HTMLButtonElement>()}
          mobileMenuOpen={false}
          onToggleMobileMenu={() => {}}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/local tracker data/i)).not.toBeInTheDocument();
  });
});
