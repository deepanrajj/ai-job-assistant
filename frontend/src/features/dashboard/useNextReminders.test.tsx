import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useNextReminders } from './useNextReminders';
import { createMockNextReminderResponse } from '../../test/mockReminders';
import { server } from '../../test/server';

const nextRemindersEndpoint = '/api/reminders/next';

describe('useNextReminders', () => {
  it('asks for five reminders and maps them as open items', async () => {
    let requestedUrl = '';
    server.use(
      http.get(nextRemindersEndpoint, ({ request }) => {
        requestedUrl = request.url;

        return HttpResponse.json([
          createMockNextReminderResponse({ jobId: 'job-1', source: 'TASK', type: null }),
        ]);
      }),
    );
    const { result } = renderHook(() => useNextReminders());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(new URL(requestedUrl).searchParams.get('limit')).toBe('5');
    expect(result.current.reminders).toEqual([
      expect.objectContaining({ isComplete: false, jobId: 'job-1', source: 'TASK', type: null }),
    ]);
  });

  it('treats a non-array body as no reminders', async () => {
    server.use(http.get(nextRemindersEndpoint, () => HttpResponse.json({ unexpected: true })));
    const { result } = renderHook(() => useNextReminders());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.reminders).toEqual([]);
  });

  it('reports a failure and recovers on reload', async () => {
    server.use(
      http.get(nextRemindersEndpoint, () => new HttpResponse(null, { status: 500 }), {
        once: true,
      }),
    );
    const { result } = renderHook(() => useNextReminders());

    await waitFor(() =>
      expect(result.current.error?.message).toBe('Failed to load upcoming reminders'),
    );

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
  });
});
