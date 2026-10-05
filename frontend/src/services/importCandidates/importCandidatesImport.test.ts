import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';

import {
  mockCreateImportCandidate,
  mockGetImportCandidates,
  mockImportCandidatesAsJobs,
  resetMockImportCandidates,
} from './importCandidates.mock';
import { inferJobSourceFromUrl, mapCandidateToJobRequest } from './importCandidates.utils';
import { createMockJobResponse } from '../../test/mockJobs';
import { server } from '../../test/server';
import type { TImportCandidateResponse } from './importCandidates.types';

/*
 * Task 049: the candidate-to-job mapping, which the backend import
 * follows, and the dev mock of the import endpoint (TEMPORARY, goes with
 * importCandidates.mock.ts).
 */

const candidate: TImportCandidateResponse = {
  content: {
    company: 'N26',
    description: 'Build payment APIs.',
    location: '',
    roleTitle: 'Backend Engineer',
  },
  createdAt: '2026-10-01T09:00:00Z',
  duplicateStatus: 'UNCHECKED',
  id: 'c1',
  reviewStatus: 'PENDING',
  source: 'MANUAL',
  sourceUrl: 'https://de.linkedin.com/jobs/view/123',
  updatedAt: '2026-10-01T09:00:00Z',
};

describe('inferJobSourceFromUrl', () => {
  it.each([
    ['https://www.linkedin.com/jobs/view/1', 'LINKEDIN'],
    ['https://de.indeed.com/viewjob?jk=1', 'INDEED'],
    ['https://www.indeed.co.uk/viewjob', 'INDEED'],
    ['https://www.xing.com/jobs/1', 'XING'],
  ])('reads %s as %s', (url, source) => {
    expect(inferJobSourceFromUrl(url)).toBe(source);
  });

  it.each([['https://careers.n26.com/jobs/1'], ['https://notlinkedin.com/jobs'], ['not a url']])(
    'leaves %s unknown',
    (url) => {
      expect(inferJobSourceFromUrl(url)).toBeNull();
    },
  );

  it('leaves a missing link unknown', () => {
    expect(inferJobSourceFromUrl(null)).toBeNull();
  });
});

describe('mapCandidateToJobRequest', () => {
  it('keeps the content and link, saves as wishlist, and infers the source', () => {
    expect(mapCandidateToJobRequest(candidate)).toEqual({
      company: 'N26',
      description: 'Build payment APIs.',
      jobUrl: 'https://de.linkedin.com/jobs/view/123',
      location: null,
      roleTitle: 'Backend Engineer',
      source: 'LINKEDIN',
      status: 'WISHLIST',
    });
  });
});

describe('mockImportCandidatesAsJobs', () => {
  beforeEach(() => {
    resetMockImportCandidates();
  });

  it('creates each job through POST /api/jobs and marks the candidate imported', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post('/api/jobs', async ({ request }) => {
        bodies.push(await request.json());

        return HttpResponse.json(createMockJobResponse({ id: `job-${bodies.length}` }), {
          status: 201,
        });
      }),
    );
    const created = await mockCreateImportCandidate({
      content: candidate.content,
      sourceUrl: candidate.sourceUrl,
    });

    const { results } = await mockImportCandidatesAsJobs([created.id, 'missing']);

    expect(results).toEqual([
      { candidateId: created.id, errorCode: null, jobId: 'job-1', outcome: 'IMPORTED' },
      {
        candidateId: 'missing',
        errorCode: 'IMPORT_CANDIDATE_NOT_FOUND',
        jobId: null,
        outcome: 'FAILED',
      },
    ]);
    expect(bodies).toEqual([mapCandidateToJobRequest(created)]);
    expect(
      (await mockGetImportCandidates()).find((item) => item.id === created.id)?.reviewStatus,
    ).toBe('IMPORTED');

    const again = await mockImportCandidatesAsJobs([created.id]);

    expect(again.results[0]).toMatchObject({
      errorCode: 'IMPORT_CANDIDATE_ALREADY_IMPORTED',
      outcome: 'FAILED',
    });
  });

  it('reports a failed job creation and keeps the candidate pending', async () => {
    server.use(http.post('/api/jobs', () => new HttpResponse(null, { status: 500 })));
    const created = await mockCreateImportCandidate({
      content: candidate.content,
      sourceUrl: null,
    });

    const { results } = await mockImportCandidatesAsJobs([created.id]);

    expect(results[0]).toMatchObject({ outcome: 'FAILED', jobId: null });
    expect(
      (await mockGetImportCandidates()).find((item) => item.id === created.id)?.reviewStatus,
    ).toBe('PENDING');
  });
});
