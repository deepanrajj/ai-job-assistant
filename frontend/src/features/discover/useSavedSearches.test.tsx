import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { createEmptySavedSearchCriteria, type TSavedSearchResponse } from '../../services';
import { useSavedSearches } from './useSavedSearches';
import { server } from '../../test/server';

const endpoint = '/api/saved-searches';

const savedSearch = (id: string, name: string): TSavedSearchResponse => ({
  createdAt: '2026-10-01T09:00:00Z',
  criteria: { ...createEmptySavedSearchCriteria(), name },
  id,
  updatedAt: '2026-10-01T09:00:00Z',
});

const renderLoadedHook = async () => {
  const hook = renderHook(() => useSavedSearches());

  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));

  return hook;
};

const namesOf = (searches: TSavedSearchResponse[]) =>
  searches.map((search) => search.criteria.name);

describe('useSavedSearches', () => {
  it('loads, creates, updates, and deletes saved searches', async () => {
    server.use(
      http.get(endpoint, () => HttpResponse.json([savedSearch('s1', 'Backend')])),
      http.post(endpoint, () => HttpResponse.json(savedSearch('s2', 'Frontend'), { status: 201 })),
      http.put(`${endpoint}/s1`, () => HttpResponse.json(savedSearch('s1', 'Backend v2'))),
      http.delete(`${endpoint}/s2`, () => new HttpResponse(null, { status: 204 })),
    );
    const { result } = await renderLoadedHook();
    const body = { criteria: createEmptySavedSearchCriteria() };

    expect(namesOf(result.current.searches)).toEqual(['Backend']);

    await act(() => result.current.createSearch(body));
    await act(() => result.current.updateSearch('s1', body));

    expect(namesOf(result.current.searches)).toEqual(['Backend v2', 'Frontend']);

    await act(() => result.current.deleteSearch('s2'));

    expect(namesOf(result.current.searches)).toEqual(['Backend v2']);
  });

  it('records a failed write and rejects with it', async () => {
    server.use(
      http.get(endpoint, () => HttpResponse.json([savedSearch('s1', 'Backend')])),
      http.delete(`${endpoint}/s1`, () => new HttpResponse(null, { status: 500 })),
    );
    const { result } = await renderLoadedHook();

    await act(async () => {
      await expect(result.current.deleteSearch('s1')).rejects.toThrow(
        'Failed to delete saved search',
      );
    });

    expect(result.current.mutationError?.message).toBe('Failed to delete saved search');
    expect(result.current.searches).toHaveLength(1);

    act(() => result.current.clearMutationError());
    expect(result.current.mutationError).toBeNull();
  });

  it('reports a failed load', async () => {
    server.use(http.get(endpoint, () => new HttpResponse(null, { status: 500 })));
    const { result } = await renderLoadedHook();

    expect(result.current.loadError?.message).toBe('Failed to load saved searches');
  });
});
