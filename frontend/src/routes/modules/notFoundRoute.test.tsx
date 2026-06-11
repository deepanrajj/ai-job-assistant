import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { renderWithProviders } from '../../test/renderWithProviders';
import { Component as NotFoundRoute } from './notFoundRoute';

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
