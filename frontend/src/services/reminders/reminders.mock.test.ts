import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';

import {
  USE_MOCK_REMINDERS,
  mockCreateReminder,
  mockDeleteReminder,
  mockGetNextReminders,
  mockGetReminders,
  mockUpdateReminder,
  resetMockReminders,
} from './reminders.mock';
import { MOCK_JOB_IDS, createMockJobResponses } from '../../test/mockJobs';
import { createMockTaskResponse } from '../../test/mockTasks';
import { server } from '../../test/server';

/*
 * TEMPORARY: covers reminders.mock.ts, and goes with it when the task 040
 * backend lands.
 */

const JOB_ID = MOCK_JOB_IDS.celonis;

describe('reminders.mock', () => {
  beforeEach(() => {
    resetMockReminders();
  });

  it('is off under Vitest, so the service tests still use the real requests', () => {
    expect(USE_MOCK_REMINDERS).toBe(false);
  });

  it('seeds one overdue, one due today, one upcoming, and one completed reminder per job', async () => {
    const reminders = await mockGetReminders(JOB_ID);

    expect(reminders.map((reminder) => reminder.title)).toEqual([
      'Send thank-you note',
      'Follow up with the recruiter',
      'Submit the application',
      'Prepare system design examples',
    ]);
    expect(reminders.filter((reminder) => reminder.completedAt !== null)).toHaveLength(1);
  });

  it('creates, completes, keeps the completion date on resave, reopens, and deletes', async () => {
    const created = await mockCreateReminder(JOB_ID, {
      dueDate: '2999-01-01',
      title: 'Ask for feedback',
      type: 'OTHER',
    });

    expect(created.completedAt).toBeNull();

    const completed = await mockUpdateReminder(JOB_ID, created.id, {
      completed: true,
      dueDate: '2999-01-01',
      title: 'Ask for feedback',
      type: 'OTHER',
    });
    const resaved = await mockUpdateReminder(JOB_ID, created.id, {
      completed: true,
      dueDate: '2999-01-02',
      title: 'Ask for feedback',
      type: 'OTHER',
    });

    expect(completed.completedAt).not.toBeNull();
    expect(resaved.completedAt).toBe(completed.completedAt);
    expect(resaved.dueDate).toBe('2999-01-02');

    const reopened = await mockUpdateReminder(JOB_ID, created.id, {
      completed: false,
      dueDate: '2999-01-02',
      title: 'Ask for feedback',
      type: 'OTHER',
    });

    expect(reopened.completedAt).toBeNull();

    await mockDeleteReminder(JOB_ID, created.id);

    expect((await mockGetReminders(JOB_ID)).map((reminder) => reminder.id)).not.toContain(
      created.id,
    );
  });

  it('rejects an unknown reminder like the API would', async () => {
    const payload = { completed: false, dueDate: '2999-01-01', title: 'x', type: 'OTHER' as const };

    await expect(mockUpdateReminder(JOB_ID, 'missing', payload)).rejects.toMatchObject({
      apiCode: 'REMINDER_NOT_FOUND',
      status: 404,
    });
    await expect(mockDeleteReminder(JOB_ID, 'missing')).rejects.toMatchObject({ status: 404 });
  });

  it('merges open mock reminders with real open dated tasks across jobs, earliest first', async () => {
    server.use(
      http.get('/api/jobs', () => HttpResponse.json(createMockJobResponses().slice(0, 1))),
      http.get(`/api/jobs/${JOB_ID}/tasks`, () =>
        HttpResponse.json([
          createMockTaskResponse({ dueDate: '2000-01-01', title: 'Oldest task' }),
          createMockTaskResponse({ dueDate: '2000-01-01', id: 'done', status: 'DONE' }),
          createMockTaskResponse({ dueDate: null, id: 'undated' }),
        ]),
      ),
    );

    const items = await mockGetNextReminders(2);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ jobId: JOB_ID, source: 'TASK', title: 'Oldest task' });
    expect(items[1]).toMatchObject({ source: 'REMINDER', title: 'Follow up with the recruiter' });
  });

  it('clamps the limit like the API will', async () => {
    server.use(http.get('/api/jobs', () => HttpResponse.json(createMockJobResponses())));

    expect(await mockGetNextReminders(0)).toHaveLength(1);
    expect(await mockGetNextReminders(500)).toHaveLength(9);
  });
});
