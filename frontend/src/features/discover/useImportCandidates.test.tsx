import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useImportCandidates } from './useImportCandidates';
import { server } from '../../test/server';
import type { TImportCandidateResponse } from '../../services';

const endpoint = '/api/import-candidates';

const candidate = (id: string, company: string): TImportCandidateResponse => ({
  content: { company, description: 'Text', location: '', roleTitle: 'Engineer' },
  createdAt: '2026-10-01T09:00:00Z',
  duplicateStatus: 'UNCHECKED',
  id,
  reviewStatus: 'PENDING',
  source: 'MANUAL',
  sourceUrl: null,
  updatedAt: '2026-10-01T09:00:00Z',
});

describe('useImportCandidates', () => {
  it('creates a candidate that survives a reload, and never calls /api/jobs', async () => {
    const stored: TImportCandidateResponse[] = [];
    const jobRequests: string[] = [];
    server.use(
      http.get(endpoint, () => HttpResponse.json(stored)),
      http.post(endpoint, () => {
        const created = candidate('c1', 'N26');

        stored.push(created);

        return HttpResponse.json(created, { status: 201 });
      }),
      http.all('/api/jobs*', ({ request }) => {
        jobRequests.push(`${request.method} ${request.url}`);

        return HttpResponse.json([]);
      }),
    );
    const first = renderHook(() => useImportCandidates());

    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    await act(() =>
      first.result.current.createCandidate({
        content: candidate('x', 'N26').content,
        sourceUrl: null,
      }),
    );
    first.unmount();

    const reloaded = renderHook(() => useImportCandidates());

    await waitFor(() => expect(reloaded.result.current.candidates).toHaveLength(1));
    expect(reloaded.result.current.candidates[0]?.content.company).toBe('N26');
    expect(jobRequests).toEqual([]);
  });

  it('records a failed save and rejects with it', async () => {
    server.use(http.post(endpoint, () => new HttpResponse(null, { status: 500 })));
    const { result } = renderHook(() => useImportCandidates());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await expect(
        result.current.createCandidate({ content: candidate('x', 'N26').content, sourceUrl: null }),
      ).rejects.toThrow('Failed to save candidate');
    });

    expect(result.current.mutationError?.message).toBe('Failed to save candidate');
  });

  it('marks imported candidates and returns every result', async () => {
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json([candidate('c1', 'N26'), candidate('c2', 'Zalando')]),
      ),
      http.post(`${endpoint}/import`, async ({ request }) => {
        const { candidateIds } = (await request.json()) as { candidateIds: string[] };

        return HttpResponse.json({
          results: candidateIds.map((candidateId) =>
            candidateId === 'c1'
              ? { candidateId, errorCode: null, jobId: 'job-1', outcome: 'IMPORTED' }
              : { candidateId, errorCode: 'X', jobId: null, outcome: 'FAILED' },
          ),
        });
      }),
    );
    const { result } = renderHook(() => useImportCandidates());

    await waitFor(() => expect(result.current.candidates).toHaveLength(2));

    let results: unknown;

    await act(async () => {
      results = await result.current.importCandidates(['c1', 'c2']);
    });

    expect(results).toHaveLength(2);
    expect(result.current.candidates.map((item) => item.reviewStatus)).toEqual([
      'IMPORTED',
      'PENDING',
    ]);
  });
});
