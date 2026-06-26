import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { Component as JobNewRoute } from './jobNewRoute';
import { renderWithRouter } from '../../test/renderWithRouter';

describe('jobNewRoute', () => {
  it('renders the new job route content', () => {
    renderWithRouter(<JobNewRoute />);

    expect(screen.getByRole('heading', { name: 'Add job' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create job' })).toBeInTheDocument();
  });
});
