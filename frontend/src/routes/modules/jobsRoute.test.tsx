import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { Component as JobsRoute } from './jobsRoute';
import { renderWithRouter } from '../../test/renderWithRouter';
import { server } from '../../test/server';

describe('jobsRoute', () => {
  it('renders jobs route content once the saved jobs load', async () => {
    renderWithRouter(<JobsRoute />);

    expect(await screen.findByRole('heading', { name: 'Saved jobs' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: /Celonis/i })).toBeInTheDocument();
  });

  it('renders the error state when the jobs request fails', async () => {
    server.use(http.get('/api/jobs', () => new HttpResponse(null, { status: 500 })));
    renderWithRouter(<JobsRoute />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Saved jobs could not be loaded');
  });
});
