import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';
import type {
  TCreateReminderRequest,
  TNextReminderResponse,
  TReminderResponse,
  TUpdateReminderRequest,
} from './reminders.types';
import { getJobs } from '../jobs';
import { getTasks } from '../tasks';

/*
 * TEMPORARY MOCK - remove when the task 040 backend lands.
 *
 * Stands in for the reminder endpoints that do not exist yet, so the
 * Reminders tab and the dashboard card can be seen in the dev server
 * (`npm run dev:frontend`). Jobs and tasks still come from the real
 * backend: only stored reminders are faked, in memory, so they reset on
 * every page reload.
 *
 * To remove it, once the backend lands:
 * 1. Delete this file and `reminders.mock.test.ts`.
 * 2. Delete the `USE_MOCK_REMINDERS` branches and the
 *    `./reminders.mock` import in `reminders.service.ts`.
 * 3. Delete `REMINDERS_FEATURE_ENABLED` in
 *    `features/reminders/reminders.constants.ts` and the places that
 *    read it, so built images show the reminders UI.
 */

/**
 * On only in the Vite dev server (`development` mode). Off in built
 * images (`production`), where the reminders UI is hidden instead by
 * `REMINDERS_FEATURE_ENABLED`, and off under Vitest (`test`), so every
 * existing test still exercises the real fetch path.
 */
export const USE_MOCK_REMINDERS = import.meta.env.MODE === 'development';

const MIN_NEXT_LIMIT = 1;
const MAX_NEXT_LIMIT = 20;

/**
 * Stored reminders per job, seeded the first time a job is read.
 */
const remindersByJob = new Map<string, TReminderResponse[]>();

let createdCount = 0;

/**
 * Formats the local calendar date `offsetDays` from today as `YYYY-MM-DD`.
 */
const localDateFromToday = (offsetDays: number): string => {
  const date = new Date();

  date.setDate(date.getDate() + offsetDays);

  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

/**
 * One reminder in each state the UI distinguishes: overdue, due today,
 * upcoming, and completed.
 */
const seedReminders = (jobId: string): TReminderResponse[] => {
  const now = new Date().toISOString();
  const seed = (
    suffix: string,
    fields: Pick<TReminderResponse, 'dueDate' | 'title' | 'type'> &
      Partial<Pick<TReminderResponse, 'completedAt'>>,
  ): TReminderResponse => ({
    completedAt: null,
    createdAt: now,
    id: `${jobId}-mock-${suffix}`,
    updatedAt: now,
    ...fields,
  });

  return [
    seed('overdue', {
      dueDate: localDateFromToday(-2),
      title: 'Follow up with the recruiter',
      type: 'FOLLOW_UP',
    }),
    seed('today', {
      dueDate: localDateFromToday(0),
      title: 'Submit the application',
      type: 'APPLICATION_DEADLINE',
    }),
    seed('upcoming', {
      dueDate: localDateFromToday(5),
      title: 'Prepare system design examples',
      type: 'INTERVIEW_PREP',
    }),
    seed('completed', {
      completedAt: now,
      dueDate: localDateFromToday(-7),
      title: 'Send thank-you note',
      type: 'OTHER',
    }),
  ];
};

const getJobReminders = (jobId: string): TReminderResponse[] => {
  const existing = remindersByJob.get(jobId);

  if (existing) return existing;

  const seeded = seedReminders(jobId);

  remindersByJob.set(jobId, seeded);

  return seeded;
};

const byDueDateThenId = (
  left: { dueDate: string; id: string },
  right: { dueDate: string; id: string },
): number =>
  left.dueDate === right.dueDate
    ? left.id.localeCompare(right.id)
    : left.dueDate.localeCompare(right.dueDate);

const reminderNotFound = (): AppError =>
  new AppError(
    'Reminder not found.',
    APP_ERROR_CODES.REMINDER_REQUEST_FAILED,
    404,
    'REMINDER_NOT_FOUND',
  );

/**
 * Mock of `GET /api/jobs/{jobId}/reminders`.
 */
export const mockGetReminders = async (jobId: string): Promise<TReminderResponse[]> =>
  [...getJobReminders(jobId)].sort(byDueDateThenId).map((reminder) => ({ ...reminder }));

/**
 * Mock of `POST /api/jobs/{jobId}/reminders`. A new reminder is open.
 */
export const mockCreateReminder = async (
  jobId: string,
  payload: TCreateReminderRequest,
): Promise<TReminderResponse> => {
  const now = new Date().toISOString();

  createdCount += 1;

  const created: TReminderResponse = {
    ...payload,
    completedAt: null,
    createdAt: now,
    id: `${jobId}-mock-created-${createdCount}`,
    updatedAt: now,
  };

  getJobReminders(jobId).push(created);

  return { ...created };
};

/**
 * Mock of `PUT /api/jobs/{jobId}/reminders/{reminderId}`, applying the
 * same completion rules the backend will: completing sets `completedAt`,
 * resaving a completed reminder keeps it, reopening clears it.
 */
export const mockUpdateReminder = async (
  jobId: string,
  reminderId: string,
  payload: TUpdateReminderRequest,
): Promise<TReminderResponse> => {
  const reminder = getJobReminders(jobId).find((candidate) => candidate.id === reminderId);

  if (!reminder) throw reminderNotFound();

  const now = new Date().toISOString();
  const { completed, ...fields } = payload;

  Object.assign(reminder, fields, {
    completedAt: completed ? (reminder.completedAt ?? now) : null,
    updatedAt: now,
  });

  return { ...reminder };
};

/**
 * Mock of `DELETE /api/jobs/{jobId}/reminders/{reminderId}`.
 */
export const mockDeleteReminder = async (jobId: string, reminderId: string): Promise<void> => {
  const reminders = getJobReminders(jobId);
  const index = reminders.findIndex((candidate) => candidate.id === reminderId);

  if (index === -1) throw reminderNotFound();

  reminders.splice(index, 1);
};

/**
 * Mock of `GET /api/reminders/next`: the earliest open items across every
 * job, mock stored reminders and real dated tasks merged. It reads each
 * job's tasks with its own request, which the real endpoint will not;
 * that is acceptable for a throwaway mock over a handful of local jobs.
 */
export const mockGetNextReminders = async (limit: number): Promise<TNextReminderResponse[]> => {
  const jobs = await getJobs();
  const storedItems = jobs.flatMap((job) =>
    getJobReminders(job.id)
      .filter((reminder) => reminder.completedAt === null)
      .map(
        (reminder): TNextReminderResponse => ({
          dueDate: reminder.dueDate,
          id: reminder.id,
          jobId: job.id,
          source: 'REMINDER',
          title: reminder.title,
          type: reminder.type,
        }),
      ),
  );
  const taskItems = (
    await Promise.all(
      jobs.map(async (job) =>
        (await getTasks(job.id)).flatMap((task): TNextReminderResponse[] =>
          task.status === 'TODO' && task.dueDate
            ? [
                {
                  dueDate: task.dueDate,
                  id: task.id,
                  jobId: job.id,
                  source: 'TASK',
                  title: task.title,
                  type: null,
                },
              ]
            : [],
        ),
      ),
    )
  ).flat();
  const boundedLimit = Math.min(Math.max(limit, MIN_NEXT_LIMIT), MAX_NEXT_LIMIT);

  return [...storedItems, ...taskItems].sort(byDueDateThenId).slice(0, boundedLimit);
};

/**
 * Clears every mock reminder. For tests only.
 */
export const resetMockReminders = (): void => {
  remindersByJob.clear();
  createdCount = 0;
};
