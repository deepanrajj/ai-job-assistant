import type { TCalendarItemResponse } from './calendar.types';
import { getDocuments } from '../documents';
import { getJobs } from '../jobs';
import { getReminders } from '../reminders';
import { getTasks } from '../tasks';

/*
 * TEMPORARY MOCK - remove when the task 042 backend lands.
 *
 * Stands in for `GET /api/calendar-items`, which does not exist yet, so
 * the Calendar page can be seen in the dev server (`npm run dev:frontend`).
 * It builds the items from the existing per-job services: real jobs and
 * tasks, and the reminders and documents that tasks 040 and 041 mock in
 * the dev server. That reads every job separately, which the real
 * endpoint exists to avoid; acceptable only in a dev-only stand-in.
 *
 * To remove it, once the backend lands:
 * 1. Delete this file and `calendar.mock.test.ts`.
 * 2. Delete the `USE_MOCK_CALENDAR` branch and the `./calendar.mock`
 *    import in `calendar.service.ts`.
 * 3. Delete `CALENDAR_FEATURE_ENABLED` in
 *    `features/calendar/calendar.constants.ts` and the places that read
 *    it, so built images show the calendar.
 */

/**
 * On only in the Vite dev server (`development` mode). Off in built images,
 * where the calendar is hidden by `CALENDAR_FEATURE_ENABLED`, and off under
 * Vitest, so every test uses the real request path.
 */
export const USE_MOCK_CALENDAR = import.meta.env.MODE === 'development';

const SOURCE_ORDER: Record<TCalendarItemResponse['source'], number> = {
  REMINDER: 0,
  TASK: 1,
  DOCUMENT: 2,
};

/**
 * Mock of `GET /api/calendar-items?from=&to=`: every dated reminder, task,
 * and submitted document across every job within the inclusive range,
 * ordered by date, then source, then id, as the endpoint will be.
 */
export const mockGetCalendarItems = async (
  from: string,
  to: string,
): Promise<TCalendarItemResponse[]> => {
  const jobs = await getJobs();
  const perJob = await Promise.all(
    jobs.map(async (job) => {
      const [reminders, tasks, documents] = await Promise.all([
        getReminders(job.id),
        getTasks(job.id),
        getDocuments(job.id),
      ]);

      return [
        ...reminders.map(
          (reminder): TCalendarItemResponse => ({
            date: reminder.dueDate,
            documentType: null,
            id: reminder.id,
            isComplete: reminder.completedAt !== null,
            jobId: job.id,
            reminderType: reminder.type,
            source: 'REMINDER',
            title: reminder.title,
          }),
        ),
        ...tasks.flatMap((task): TCalendarItemResponse[] =>
          task.dueDate
            ? [
                {
                  date: task.dueDate,
                  documentType: null,
                  id: task.id,
                  isComplete: task.status === 'DONE',
                  jobId: job.id,
                  reminderType: null,
                  source: 'TASK',
                  title: task.title,
                },
              ]
            : [],
        ),
        ...documents.flatMap((document): TCalendarItemResponse[] =>
          document.submittedAt
            ? [
                {
                  date: document.submittedAt,
                  documentType: document.type,
                  id: document.id,
                  isComplete: false,
                  jobId: job.id,
                  reminderType: null,
                  source: 'DOCUMENT',
                  title: document.title,
                },
              ]
            : [],
        ),
      ];
    }),
  );

  return perJob
    .flat()
    .filter((item) => item.date >= from && item.date <= to)
    .sort((left, right) => {
      if (left.date !== right.date) return left.date < right.date ? -1 : 1;
      if (left.source !== right.source)
        return SOURCE_ORDER[left.source] - SOURCE_ORDER[right.source];

      return left.id.localeCompare(right.id);
    });
};
