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
  it('keeps existing candidates and a confirmed write when the initial load finishes afterward', async () => {
    let releaseLoad: () => void = () => {};
    let loadStarted = false;
    const loadGate = new Promise<void>((resolve) => {
      releaseLoad = resolve;
    });
    server.use(
      http.get(endpoint, async () => {
        loadStarted = true;
        await loadGate;
        return HttpResponse.json([candidate('old', 'Zalando')]);
      }),
      http.post(endpoint, () => HttpResponse.json(candidate('c1', 'N26'), { status: 201 })),
    );
    const { result } = renderHook(() => useImportCandidates());

    await waitFor(() => expect(loadStarted).toBe(true));
    await act(() =>
      result.current.createCandidate({ content: candidate('x', 'N26').content, sourceUrl: null }),
    );
    expect(result.current.candidates).toHaveLength(1);

    await act(async () => releaseLoad());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.candidates.map((entry) => entry.id)).toEqual(['old', 'c1']);
  });

  it('shows a confirmed candidate after the initial load fails', async () => {
    server.use(
      http.get(endpoint, () => new HttpResponse(null, { status: 500 })),
      http.post(endpoint, () => HttpResponse.json(candidate('c1', 'N26'), { status: 201 })),
    );
    const { result } = renderHook(() => useImportCandidates());

    await waitFor(() =>
      expect(result.current.loadError?.message).toBe('Failed to load import candidates'),
    );
    await act(() =>
      result.current.createCandidate({ content: candidate('x', 'N26').content, sourceUrl: null }),
    );

    expect(result.current.candidates.map((entry) => entry.id)).toEqual(['c1']);
    expect(result.current.loadError?.message).toBe('Failed to load import candidates');
  });

  it('replays confirmed updates and deletes over a late reload', async () => {
    const original = [candidate('c1', 'N26'), candidate('c2', 'Zalando')];
    let releaseReload: () => void = () => {};
    let reloadStarted = false;
    let loads = 0;
    const reloadGate = new Promise<void>((resolve) => {
      releaseReload = resolve;
    });
    server.use(
      http.get(endpoint, async () => {
        loads += 1;
        if (loads > 1) {
          reloadStarted = true;
          await reloadGate;
        }
        return HttpResponse.json(original);
      }),
      http.put(`${endpoint}/c1`, () => HttpResponse.json(candidate('c1', 'Updated'))),
      http.delete(`${endpoint}/c2`, () => new HttpResponse(null, { status: 204 })),
    );
    const { result } = renderHook(() => useImportCandidates());

    await waitFor(() => expect(result.current.candidates).toHaveLength(2));
    act(() => result.current.reload());
    await waitFor(() => expect(reloadStarted).toBe(true));
    await act(() =>
      result.current.updateCandidate('c1', {
        content: candidate('c1', 'Updated').content,
        sourceUrl: null,
      }),
    );
    await act(() => result.current.deleteCandidate('c2'));
    await act(async () => releaseReload());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.candidates.map((entry) => [entry.id, entry.content.company])).toEqual([
      ['c1', 'Updated'],
    ]);
  });

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

    act(() => result.current.clearMutationError());
    expect(result.current.mutationError).toBeNull();
  });
});
