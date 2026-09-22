import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { Component as ProfileRoute } from './profileRoute';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('profileRoute', () => {
  it('renders the coming soon placeholder', () => {
    renderWithProviders(<ProfileRoute />);

    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
