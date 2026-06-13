import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AppShellNavigation } from './AppShellNavigation';
import { renderWithProviders } from '../../../test/renderWithProviders';

describe('AppShellNavigation', () => {
  it('renders localized navigation links with active link classes', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/jobs']}>
        <AppShellNavigation
          ariaLabel="Main navigation"
          className="navigation"
          linkClassName={({ isActive }) => (isActive ? 'active' : 'inactive')}
        />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole('navigation', { name: 'Main navigation' });

    expect(within(navigation).getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(within(navigation).getByRole('link', { name: 'Jobs' })).toHaveClass('active');
    expect(within(navigation).getByRole('link', { name: 'AI Assistant' })).toHaveAttribute(
      'href',
      '/ai-assistant',
    );
  });
});
