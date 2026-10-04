import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  ApplicationsRouteComingSoon,
  ApplicationsRouteWithDocuments,
  Component as ApplicationsRoute,
} from './applicationsRoute';
import { renderWithRouter } from '../../test/renderWithRouter';
import { createMockDocumentResponse } from '../../test/mockDocuments';
import { MOCK_JOB_IDS, createMockJobResponses } from '../../test/mockJobs';
import { server } from '../../test/server';

describe('applicationsRoute', () => {
  it('uses the variant with documents while the feature is on, as it is under test', () => {
    expect(ApplicationsRoute).toBe(ApplicationsRouteWithDocuments);
  });

  it("lists the documents the backend returns, under each document's job", async () => {
    server.use(
      http.get('/api/jobs', () => HttpResponse.json(createMockJobResponses())),
      http.get('/api/application-documents', () =>
        HttpResponse.json([
          {
            ...createMockDocumentResponse({ submittedAt: '2026-05-10' }),
            jobId: MOCK_JOB_IDS.celonis,
          },
        ]),
      ),
    );
    renderWithRouter(<ApplicationsRoute />);

    expect(await screen.findByRole('heading', { name: 'Celonis' })).toBeInTheDocument();
    expect(screen.getByText('CV - backend v3')).toBeInTheDocument();
    expect(screen.getByText('Submitted May 10, 2026')).toBeInTheDocument();
  });

  it('shows one error with a retry when either request fails', async () => {
    server.use(
      http.get('/api/jobs', () => HttpResponse.json(createMockJobResponses())),
      http.get('/api/application-documents', () => new HttpResponse(null, { status: 500 })),
    );
    renderWithRouter(<ApplicationsRoute />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Applications could not be loaded');
  });

  it('keeps the coming soon placeholder, making no request, while the feature is off', () => {
    renderWithRouter(<ApplicationsRouteComingSoon />);

    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
