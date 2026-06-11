import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { renderWithProviders } from '../../../test/renderWithProviders';
import { AppShellSidebar } from './AppShellSidebar';

describe('AppShellSidebar', () => {
  it('renders brand content and main navigation', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppShellSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('complementary', { name: 'Smart Job Tracker' })).toBeInTheDocument();
    expect(screen.getByText('Frontend MVP')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });
});
