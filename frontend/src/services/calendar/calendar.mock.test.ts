import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';

import { USE_MOCK_CALENDAR, mockGetCalendarItems } from './calendar.mock';
import { createMockDocumentResponse } from '../../test/mockDocuments';
import { MOCK_JOB_IDS, createMockJobResponses } from '../../test/mockJobs';
import { createMockReminderResponse } from '../../test/mockReminders';
import { createMockTaskResponse } from '../../test/mockTasks';
import { server } from '../../test/server';

/*
 * TEMPORARY: covers calendar.mock.ts, and goes with it when the task 042
 * backend lands. Under Vitest the reminder and document services make
 * real requests, so MSW serves all three sources here.
 */

const JOB_ID = MOCK_JOB_IDS.celonis;

describe('calendar.mock', () => {
  it('is off outside the dev server, including under Vitest', () => {
    expect(USE_MOCK_CALENDAR).toBe(false);
  });

  it('merges dated reminders, tasks, and submitted documents within the range, in order', async () => {
    server.use(
      http.get('/api/jobs', () => HttpResponse.json(createMockJobResponses().slice(0, 1))),
      http.get(`/api/jobs/${JOB_ID}/reminders`, () =>
        HttpResponse.json([
          createMockReminderResponse({ dueDate: '2026-10-05', id: 'r-in' }),
          createMockReminderResponse({
            completedAt: '2026-10-02T10:00:00Z',
            dueDate: '2026-10-02',
            id: 'r-done',
          }),
          createMockReminderResponse({ dueDate: '2026-11-01', id: 'r-out' }),
        ]),
      ),
      http.get(`/api/jobs/${JOB_ID}/tasks`, () =>
        HttpResponse.json([
          createMockTaskResponse({ dueDate: '2026-10-05', id: 't-in', status: 'DONE' }),
          createMockTaskResponse({ dueDate: null, id: 't-undated' }),
        ]),
      ),
      http.get(`/api/jobs/${JOB_ID}/documents`, () =>
        HttpResponse.json([
          createMockDocumentResponse({ id: 'd-sent', submittedAt: '2026-10-31', type: 'CV' }),
          createMockDocumentResponse({ id: 'd-unsent', submittedAt: null }),
        ]),
      ),
    );

    const items = await mockGetCalendarItems('2026-10-01', '2026-10-31');

    expect(items.map((item) => [item.date, item.source, item.id, item.isComplete])).toEqual([
      ['2026-10-02', 'REMINDER', 'r-done', true],
      ['2026-10-05', 'REMINDER', 'r-in', false],
      ['2026-10-05', 'TASK', 't-in', true],
      ['2026-10-31', 'DOCUMENT', 'd-sent', false],
    ]);
    expect(items[3]).toMatchObject({ documentType: 'CV', jobId: JOB_ID, reminderType: null });
  });
});
