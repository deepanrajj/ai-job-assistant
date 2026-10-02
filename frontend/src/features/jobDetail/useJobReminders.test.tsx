import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { getReminderItemKey, useJobReminders } from './useJobReminders';
import { MOCK_JOB_IDS } from '../../test/mockJobs';
import { MOCK_REMINDER_IDS, createMockReminderResponse } from '../../test/mockReminders';
import { MOCK_TASK_IDS, createMockTaskResponse } from '../../test/mockTasks';
import { server } from '../../test/server';
import type { TReminderItem } from '../../types';

const JOB_ID = MOCK_JOB_IDS.celonis;
const remindersEndpoint = `/api/jobs/${JOB_ID}/reminders`;
const reminderEndpoint = `${remindersEndpoint}/${MOCK_REMINDER_IDS.primary}`;
const tasksEndpoint = `/api/jobs/${JOB_ID}/tasks`;
const taskEndpoint = `${tasksEndpoint}/${MOCK_TASK_IDS.primary}`;

const formValues = { dueDate: '2026-06-01', title: 'Send thank-you note', type: 'OTHER' as const };

/**
 * Serves the given stored reminders and tasks for the test job.
 */
const serveSources = (
  reminders = [createMockReminderResponse()],
  tasks = [createMockTaskResponse()],
) => {
  server.use(
    http.get(remindersEndpoint, () => HttpResponse.json(reminders)),
    http.get(tasksEndpoint, () => HttpResponse.json(tasks)),
  );
};

const renderLoadedHook = async () => {
  const hook = renderHook(() => useJobReminders(JOB_ID));

  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));

  return hook;
};

const findItem = (items: TReminderItem[], id: string): TReminderItem => {
  const item = items.find((candidate) => candidate.id === id);

  if (!item) throw new Error(`Reminder item ${id} not found`);

  return item;
};

describe('useJobReminders', () => {
  it('merges stored reminders and dated tasks in due-date order and skips undated tasks', async () => {
    serveSources(
      [createMockReminderResponse({ dueDate: '2026-05-12' })],
      [
        createMockTaskResponse({ dueDate: '2026-05-10' }),
        createMockTaskResponse({ id: MOCK_TASK_IDS.secondary, dueDate: null, title: 'Undated' }),
      ],
    );
    const { result } = await renderLoadedHook();

    expect(result.current.reminders.map((item) => [item.source, item.title])).toEqual([
      ['TASK', 'Tailor CV bullets'],
      ['REMINDER', 'Follow up with recruiter'],
    ]);
    expect(result.current.hasLoadedReminders).toBe(true);
  });

  it('treats a non-array body as an empty source instead of throwing', async () => {
    server.use(
      http.get(remindersEndpoint, () => HttpResponse.json({ unexpected: true })),
      http.get(tasksEndpoint, () => HttpResponse.json({ unexpected: true })),
    );
    const { result } = await renderLoadedHook();

    expect(result.current.reminders).toEqual([]);
  });

  it('reports a failed load of either source and recovers on reload', async () => {
    serveSources();
    server.use(
      http.get(tasksEndpoint, () => new HttpResponse(null, { status: 500 }), { once: true }),
    );
    const { result } = await renderLoadedHook();

    expect(result.current.loadError?.message).toBe('Failed to load tasks');
    expect(result.current.hasLoadedReminders).toBe(false);

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.reminders).toHaveLength(2));
    expect(result.current.loadError).toBeNull();
  });

  it('creates a reminder with a trimmed title and lists it even when the refresh fails', async () => {
    const existing = createMockReminderResponse({
      dueDate: '2026-05-01',
      id: MOCK_REMINDER_IDS.secondary,
      title: 'Existing reminder',
    });
    serveSources([existing], []);
    let body: unknown;
    const created = createMockReminderResponse({ title: 'Send thank-you note', type: 'OTHER' });
    server.use(
      http.post(remindersEndpoint, async ({ request }) => {
        body = await request.json();
        server.use(http.get(remindersEndpoint, () => new HttpResponse(null, { status: 500 })));

        return HttpResponse.json(created, { status: 201 });
      }),
    );
    const { result } = await renderLoadedHook();

    await act(() =>
      result.current.createJobReminder({ ...formValues, title: '  Send thank-you note ' }),
    );

    expect(body).toEqual({ dueDate: '2026-06-01', title: 'Send thank-you note', type: 'OTHER' });
    expect(result.current.loadError?.message).toBe('Failed to load reminders');
    expect(result.current.reminders.map((item) => item.title)).toEqual([
      'Existing reminder',
      'Send thank-you note',
    ]);
  });

  it('keeps a completed reminder completed when its fields are edited', async () => {
    serveSources([createMockReminderResponse({ completedAt: '2026-05-01T10:00:00Z' })], []);
    let body: unknown;
    server.use(
      http.put(reminderEndpoint, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(createMockReminderResponse());
      }),
    );
    const { result } = await renderLoadedHook();

    await act(() => result.current.updateJobReminder(MOCK_REMINDER_IDS.primary, formValues));

    expect(body).toEqual({ ...formValues, completed: true });
  });

  it('completes a stored reminder from its loaded fields', async () => {
    serveSources([createMockReminderResponse()], []);
    let body: unknown;
    server.use(
      http.put(reminderEndpoint, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(
          createMockReminderResponse({ completedAt: '2026-05-12T10:00:00Z' }),
        );
      }),
    );
    const { result } = await renderLoadedHook();
    const item = findItem(result.current.reminders, MOCK_REMINDER_IDS.primary);

    await act(() => result.current.toggleReminderComplete(item));

    expect(body).toEqual({
      completed: true,
      dueDate: '2026-05-12',
      title: 'Follow up with recruiter',
      type: 'FOLLOW_UP',
    });
  });

  it('completes a task reminder by writing the task with its title and date unchanged', async () => {
    serveSources([], [createMockTaskResponse()]);
    let body: unknown;
    server.use(
      http.put(taskEndpoint, async ({ request }) => {
        body = await request.json();
        serveSources([], [createMockTaskResponse({ status: 'DONE' })]);

        return HttpResponse.json(createMockTaskResponse({ status: 'DONE' }));
      }),
    );
    const { result } = await renderLoadedHook();
    const item = findItem(result.current.reminders, MOCK_TASK_IDS.primary);

    await act(() => result.current.toggleReminderComplete(item));

    expect(body).toEqual({ dueDate: '2026-05-10', status: 'DONE', title: 'Tailor CV bullets' });
    expect(findItem(result.current.reminders, MOCK_TASK_IDS.primary).isComplete).toBe(true);
  });

  it('reopens a completed task reminder', async () => {
    serveSources([], [createMockTaskResponse({ status: 'DONE' })]);
    let body: unknown;
    server.use(
      http.put(taskEndpoint, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json(createMockTaskResponse());
      }),
    );
    const { result } = await renderLoadedHook();

    await act(() =>
      result.current.toggleReminderComplete(
        findItem(result.current.reminders, MOCK_TASK_IDS.primary),
      ),
    );

    expect(body).toEqual({ dueDate: '2026-05-10', status: 'TODO', title: 'Tailor CV bullets' });
  });

  it('does nothing for an item that is no longer loaded', async () => {
    serveSources([], []);
    const { result } = await renderLoadedHook();
    const stale: TReminderItem = {
      dueDate: '2026-05-10',
      id: 'gone',
      isComplete: false,
      jobId: JOB_ID,
      source: 'TASK',
      title: 'Gone',
      type: null,
    };

    await act(() => result.current.toggleReminderComplete(stale));
    await act(() => result.current.toggleReminderComplete({ ...stale, source: 'REMINDER' }));

    expect(result.current.mutationError).toBeNull();
  });

  it('deletes a reminder and keeps the deletion when the refresh after it fails', async () => {
    serveSources();
    server.use(
      http.delete(reminderEndpoint, () => {
        server.use(http.get(remindersEndpoint, () => new HttpResponse(null, { status: 500 })));

        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = await renderLoadedHook();

    await act(() => result.current.deleteJobReminder(MOCK_REMINDER_IDS.primary));

    expect(result.current.loadError?.message).toBe('Failed to load reminders');
    expect(result.current.reminders.map((item) => item.source)).toEqual(['TASK']);
  });

  it('records a failed write and rejects with it', async () => {
    serveSources();
    server.use(http.delete(reminderEndpoint, () => new HttpResponse(null, { status: 500 })));
    const { result } = await renderLoadedHook();

    await act(async () => {
      await expect(result.current.deleteJobReminder(MOCK_REMINDER_IDS.primary)).rejects.toThrow(
        'Failed to delete reminder',
      );
    });

    expect(result.current.mutationError?.message).toBe('Failed to delete reminder');
    expect(result.current.deletingReminderIds.size).toBe(0);
  });

  it('builds item keys that include the source', () => {
    expect(
      getReminderItemKey({
        dueDate: '2026-05-10',
        id: 'abc',
        isComplete: false,
        jobId: JOB_ID,
        source: 'TASK',
        title: 'x',
        type: null,
      }),
    ).toBe('TASK:abc');
  });
});
