import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { Component as ApplicationsRoute } from './applicationsRoute';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('applicationsRoute', () => {
  it('renders the coming soon placeholder', () => {
    renderWithProviders(<ApplicationsRoute />);

    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
