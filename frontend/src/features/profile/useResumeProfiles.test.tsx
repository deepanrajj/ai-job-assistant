import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useResumeProfiles } from './useResumeProfiles';
import { createEmptyProfileContent } from './profileEntries.utils';
import { server } from '../../test/server';
import type { TResumeProfileResponse } from '../../services';

const endpoint = '/api/resume-profiles';

const profile = (id: string, name: string): TResumeProfileResponse => ({
  createdAt: '2026-10-01T09:00:00Z',
  id,
  name,
  profile: createEmptyProfileContent(),
  updatedAt: '2026-10-01T09:00:00Z',
});

const renderLoadedHook = async () => {
  const hook = renderHook(() => useResumeProfiles());

  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));

  return hook;
};

describe('useResumeProfiles', () => {
  it('loads the profiles', async () => {
    server.use(http.get(endpoint, () => HttpResponse.json([profile('p1', 'Base')])));
    const { result } = await renderLoadedHook();

    expect(result.current.profiles.map((item) => item.name)).toEqual(['Base']);
  });

  it('adds a created profile, replaces an updated one, and drops a deleted one', async () => {
    server.use(
      http.get(endpoint, () => HttpResponse.json([profile('p1', 'Base')])),
      http.post(endpoint, () => HttpResponse.json(profile('p2', 'Backend'), { status: 201 })),
      http.put(`${endpoint}/p1`, () => HttpResponse.json(profile('p1', 'Base v2'))),
      http.delete(`${endpoint}/p2`, () => new HttpResponse(null, { status: 204 })),
    );
    const { result } = await renderLoadedHook();
    const body = { name: 'x', profile: createEmptyProfileContent() };

    await act(() => result.current.createProfile(body));
    await act(() => result.current.updateProfile('p1', body));

    expect(result.current.profiles.map((item) => item.name)).toEqual(['Base v2', 'Backend']);

    await act(() => result.current.deleteProfile('p2'));

    expect(result.current.profiles.map((item) => item.id)).toEqual(['p1']);
    expect(result.current.isMutating).toBe(false);
  });

  it('records a failed write, rejects with it, and clears it after a later success', async () => {
    server.use(
      http.get(endpoint, () => HttpResponse.json([profile('p1', 'Base')])),
      http.delete(`${endpoint}/p1`, () => new HttpResponse(null, { status: 500 }), { once: true }),
    );
    const { result } = await renderLoadedHook();

    await act(async () => {
      await expect(result.current.deleteProfile('p1')).rejects.toThrow(
        'Failed to delete resume profile',
      );
    });

    expect(result.current.mutationError?.message).toBe('Failed to delete resume profile');

    server.use(http.delete(`${endpoint}/p1`, () => new HttpResponse(null, { status: 204 })));
    await act(() => result.current.deleteProfile('p1'));

    expect(result.current.mutationError).toBeNull();
  });

  it('reports a failed load and recovers on reload', async () => {
    server.use(http.get(endpoint, () => new HttpResponse(null, { status: 500 }), { once: true }));
    const { result } = await renderLoadedHook();

    expect(result.current.loadError?.message).toBe('Failed to load resume profiles');

    server.use(http.get(endpoint, () => HttpResponse.json([profile('p1', 'Base')])));
    act(() => result.current.reload());

    await waitFor(() => expect(result.current.profiles).toHaveLength(1));
    expect(result.current.loadError).toBeNull();
  });
});
