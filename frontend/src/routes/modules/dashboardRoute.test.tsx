import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { Component as DashboardRoute } from './dashboardRoute';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('dashboardRoute', () => {
  it('renders dashboard route content with saved jobs', () => {
    renderWithProviders(<DashboardRoute />);

    expect(screen.getByText('Total jobs')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument();
  });
});
