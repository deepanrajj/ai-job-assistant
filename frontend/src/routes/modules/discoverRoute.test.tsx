import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { Component as DiscoverRoute } from './discoverRoute';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('discoverRoute', () => {
  it('renders the coming soon placeholder', () => {
    renderWithProviders(<DiscoverRoute />);

    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
