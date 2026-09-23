import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { Component as CalendarRoute } from './calendarRoute';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('calendarRoute', () => {
  it('renders the coming soon placeholder', () => {
    renderWithProviders(<CalendarRoute />);

    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
