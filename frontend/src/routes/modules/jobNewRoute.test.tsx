import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { Component as JobNewRoute } from './jobNewRoute';
import { renderWithRouter } from '../../test/renderWithRouter';
import { server } from '../../test/server';

describe('jobNewRoute', () => {
  // The form loads the saved jobs for its duplicate warning (task 050).
  beforeEach(() => {
    server.use(http.get('/api/jobs', () => HttpResponse.json([])));
  });

  it('renders the new job route content', () => {
    renderWithRouter(<JobNewRoute />);

    expect(screen.getByRole('heading', { name: 'Add job' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create job' })).toBeInTheDocument();
  });
});
