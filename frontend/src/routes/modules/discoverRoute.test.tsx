import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  Component as DiscoverRoute,
  DiscoverRouteComingSoon,
  DiscoverRouteWithSearches,
} from './discoverRoute';
import { renderWithProviders } from '../../test/renderWithProviders';
import { createMockJobResponses } from '../../test/mockJobs';
import { server } from '../../test/server';

describe('discoverRoute', () => {
  it('uses the variant with saved searches while the feature is on, as it is under test', () => {
    expect(DiscoverRoute).toBe(DiscoverRouteWithSearches);
  });

  it('loads the saved searches', async () => {
    renderWithProviders(<DiscoverRoute />);

    expect(await screen.findByText('No saved searches yet')).toBeInTheDocument();
  });

  it('shows the candidate review below the saved searches, checked against the saved jobs', async () => {
    server.use(http.get('/api/jobs', () => HttpResponse.json(createMockJobResponses())));
    renderWithProviders(<DiscoverRoute />);

    expect(await screen.findByRole('region', { name: 'Import candidates' })).toBeInTheDocument();
    expect(await screen.findByText('No candidates yet')).toBeInTheDocument();
  });

  it('keeps the coming soon placeholder, making no request, while the feature is off', () => {
    renderWithProviders(<DiscoverRouteComingSoon />);

    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
