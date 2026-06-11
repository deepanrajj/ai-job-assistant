import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { appRouteHandles } from '../../../routes/routes.constants';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { AppShellHeader } from './AppShellHeader';

describe('AppShellHeader', () => {
  it('renders route title, subtitle, local data badge, and mobile navigation', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/jobs']}>
        <AppShellHeader page={appRouteHandles.JOBS} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Jobs' })).toBeInTheDocument();
    expect(
      screen.getByText('Review your saved opportunities and keep the pipeline moving.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Local mock data')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeInTheDocument();
  });
});
