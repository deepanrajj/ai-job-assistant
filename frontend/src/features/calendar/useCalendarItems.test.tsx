import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCalendarItems, type ICalendarItemsState } from './useCalendarItems';
import { server } from '../../test/server';

/**
 * Serves one reminder on the first day of whatever range is asked for.
 */
const serveOneItemPerRange = () =>
  server.use(
    http.get('/api/calendar-items', ({ request }) => {
      const from = new URL(request.url).searchParams.get('from');

      return HttpResponse.json([
        {
          date: from,
          documentType: null,
          id: `reminder-${from}`,
          isComplete: false,
          jobId: 'job-1',
          reminderType: 'FOLLOW_UP',
          source: 'REMINDER',
          title: 'Follow up',
        },
      ]);
    }),
  );

describe('useCalendarItems', () => {
  it('loads the items of the range it is given', async () => {
    serveOneItemPerRange();
    const { result } = renderHook(() => useCalendarItems('2026-10-01', '2026-10-31'));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items.map((item) => item.date)).toEqual(['2026-10-01']);
  });

  it("reports loading from the first render with a new range, never showing the old range's items", async () => {
    serveOneItemPerRange();
    const renders: Array<ICalendarItemsState & { from: string }> = [];
    const { result, rerender } = renderHook(
      ({ from, to }) => {
        const state = useCalendarItems(from, to);

        renders.push({ ...state, from });

        return state;
      },
      { initialProps: { from: '2026-10-01', to: '2026-10-31' } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ from: '2026-11-01', to: '2026-11-30' });
    await waitFor(() => expect(result.current.items[0]?.date).toBe('2026-11-01'));

    const novemberRenders = renders.filter((render) => render.from === '2026-11-01');
    const shownBeforeLoaded = novemberRenders.filter((render) => !render.isLoading);

    expect(novemberRenders[0]?.isLoading).toBe(true);
    expect(
      shownBeforeLoaded.flatMap((render) => render.items).map((item) => item.date),
    ).not.toContain('2026-10-01');
  });

  it("reports loading, not the old range's error, from the first render with a new range", async () => {
    server.use(http.get('/api/calendar-items', () => new HttpResponse(null, { status: 500 })));
    const renders: Array<ICalendarItemsState & { from: string }> = [];
    const { result, rerender } = renderHook(
      ({ from, to }) => {
        const state = useCalendarItems(from, to);

        renders.push({ ...state, from });

        return state;
      },
      { initialProps: { from: '2026-10-01', to: '2026-10-31' } },
    );
    await waitFor(() => expect(result.current.error).not.toBeNull());

    rerender({ from: '2026-11-01', to: '2026-11-30' });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    const firstNovemberRender = renders.find((render) => render.from === '2026-11-01');

    expect(firstNovemberRender?.isLoading).toBe(true);
    expect(firstNovemberRender?.error).toBeNull();
  });
});
