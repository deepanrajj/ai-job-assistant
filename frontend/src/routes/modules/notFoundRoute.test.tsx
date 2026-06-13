import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Component as NotFoundRoute } from './notFoundRoute';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('notFoundRoute', () => {
  it('renders not found route content inside router context', () => {
    renderWithProviders(
      <MemoryRouter>
        <NotFoundRoute />
      </MemoryRouter>,
    );

    expect(screen.getByText('We could not find that page')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to dashboard' })).toBeInTheDocument();
  });
});
