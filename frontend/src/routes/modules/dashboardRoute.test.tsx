import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../test/renderWithProviders';
import { Component as DashboardRoute } from './dashboardRoute';

describe('dashboardRoute', () => {
  it('renders dashboard route content with mock jobs', () => {
    renderWithProviders(<DashboardRoute />);

    expect(screen.getByText('Total jobs')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument();
  });
});
