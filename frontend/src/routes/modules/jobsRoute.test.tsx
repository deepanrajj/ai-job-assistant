import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../test/renderWithProviders';
import { Component as JobsRoute } from './jobsRoute';

describe('jobsRoute', () => {
  it('renders jobs route content with mock jobs', () => {
    renderWithProviders(<JobsRoute />);

    expect(screen.getByRole('heading', { name: 'Saved jobs' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
  });
});
