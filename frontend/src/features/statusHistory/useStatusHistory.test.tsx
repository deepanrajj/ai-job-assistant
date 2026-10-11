import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useStatusHistory } from './useStatusHistory';
import { createMockTimelineEventResponse } from '../../test/mockTimeline';
import { server } from '../../test/server';

const historyEndpoint = '/api/timeline-events';

describe('useStatusHistory', () => {
  it('reports loading, then every event', async () => {
    server.use(
      http.get(historyEndpoint, () =>
        HttpResponse.json({
          content: [createMockTimelineEventResponse()],
          page: 0,
          size: 100,
          totalElements: 1,
          totalPages: 1,
        }),
      ),
    );
    const { result } = renderHook(() => useStatusHistory());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.events).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.events).toHaveLength(1);
  });

  it('gives no events at all when a later page fails, and recovers on reload', async () => {
    let failSecondPage = true;
    server.use(
      http.get(historyEndpoint, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));

        if (page === 1 && failSecondPage) return new HttpResponse(null, { status: 500 });

        return HttpResponse.json({
          content: [createMockTimelineEventResponse({ id: `event-${page}` })],
          page,
          size: 100,
          totalElements: 2,
          totalPages: 2,
        });
      }),
    );
    const { result } = renderHook(() => useStatusHistory());

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toBe('Failed to load status history');
    expect(result.current.events).toBeNull();

    failSecondPage = false;
    act(() => result.current.reload());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.events?.map((event) => event.id)).toEqual(['event-0', 'event-1']);
  });
});
