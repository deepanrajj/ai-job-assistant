import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AppShellHeader } from './AppShellHeader';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { appRouteHandles } from '../../../routes/routes.constants';

describe('AppShellHeader', () => {
  it('renders route title, subtitle, and mobile navigation', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/jobs']}>
        <AppShellHeader page={appRouteHandles.JOBS} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Jobs' })).toBeInTheDocument();
    expect(
      screen.getByText('Review your saved opportunities and keep the pipeline moving.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeInTheDocument();
  });

  /**
   * The badge claimed the app ran on local tracker data. Task 025 removed
   * the last local store, so the claim became false on every page. Pinned
   * here so it cannot come back with the store gone.
   */
  it('makes no claim about the data source', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/jobs']}>
        <AppShellHeader page={appRouteHandles.JOBS} />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/local tracker data/i)).not.toBeInTheDocument();
  });
});
