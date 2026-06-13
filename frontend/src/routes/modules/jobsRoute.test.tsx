import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { Component as JobsRoute } from './jobsRoute';
import { renderWithRouter } from '../../test/renderWithRouter';

describe('jobsRoute', () => {
  it('renders jobs route content with mock jobs', () => {
    renderWithRouter(<JobsRoute />);

    expect(screen.getByRole('heading', { name: 'Saved jobs' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
  });
});
