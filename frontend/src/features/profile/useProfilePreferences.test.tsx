import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { createEmptyProfilePreferences } from '../../services';
import { useProfilePreferences } from './useProfilePreferences';
import { server } from '../../test/server';

const endpoint = '/api/profile/preferences';

describe('useProfilePreferences', () => {
  it('loads the record and saves a normalized one', async () => {
    let body: unknown;
    server.use(
      http.put(endpoint, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({ ...(body as object), updatedAt: '2026-10-05T09:00:00Z' });
      }),
    );
    const { result } = renderHook(() => useProfilePreferences());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.preferences?.updatedAt).toBeNull();

    await act(() =>
      result.current.save({ ...createEmptyProfilePreferences(), skills: [' Kotlin ', 'kotlin'] }),
    );

    expect(body).toMatchObject({ skills: ['Kotlin'] });
    expect(result.current.preferences?.updatedAt).toBe('2026-10-05T09:00:00Z');
  });

  it('ignores a load that returns after a save started', async () => {
    let releaseLoad: () => void = () => {};
    let loads = 0;

    server.use(
      http.get(endpoint, async () => {
        loads += 1;
        await new Promise<void>((resolve) => {
          releaseLoad = resolve;
        });

        return HttpResponse.json({
          ...createEmptyProfilePreferences(),
          skills: ['Old'],
          updatedAt: '2026-10-01T09:00:00Z',
        });
      }),
      http.put(endpoint, async ({ request }) =>
        HttpResponse.json({
          ...((await request.json()) as object),
          updatedAt: '2026-10-05T09:00:00Z',
        }),
      ),
    );
    const { result } = renderHook(() => useProfilePreferences());

    await waitFor(() => expect(loads).toBe(1));
    await act(() => result.current.save({ ...createEmptyProfilePreferences(), skills: ['New'] }));
    await act(async () => {
      releaseLoad();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(result.current.preferences).toMatchObject({
      skills: ['New'],
      updatedAt: '2026-10-05T09:00:00Z',
    });
  });

  it('records a failed save and rejects with it', async () => {
    server.use(http.put(endpoint, () => new HttpResponse(null, { status: 500 })));
    const { result } = renderHook(() => useProfilePreferences());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.save(createEmptyProfilePreferences())).rejects.toThrow(
        'Failed to save skills and preferences',
      );
    });

    expect(result.current.saveError?.message).toBe('Failed to save skills and preferences');
  });

  it('reports a failed load and recovers on reload', async () => {
    server.use(http.get(endpoint, () => new HttpResponse(null, { status: 500 }), { once: true }));
    const { result } = renderHook(() => useProfilePreferences());

    await waitFor(() => expect(result.current.loadError).not.toBeNull());

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.preferences).not.toBeNull());
  });
});
