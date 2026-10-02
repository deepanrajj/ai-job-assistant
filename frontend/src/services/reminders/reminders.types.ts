import type { TJobReminderType, TReminderSource } from '../../types';

/**
 * Translation keys used for reminder service fallback errors.
 */
export const REMINDER_FALLBACK_ERROR_TRANSLATION_KEYS = {
  listReminders: 'reminders.fallbackError.listReminders',
  createReminder: 'reminders.fallbackError.createReminder',
  updateReminder: 'reminders.fallbackError.updateReminder',
  deleteReminder: 'reminders.fallbackError.deleteReminder',
  listNextReminders: 'reminders.fallbackError.listNextReminders',
} as const;

/**
 * Supported reminder fallback error lookup keys.
 */
export type TReminderFallbackErrorKey = keyof typeof REMINDER_FALLBACK_ERROR_TRANSLATION_KEYS;

/**
 * Wire representation of a stored reminder exactly as
 * `/api/jobs/{jobId}/reminders` returns it.
 *
 * Excludes `jobId`: every route already carries it in the path. The server
 * owns `completedAt`; it is null while the reminder is open.
 */
export type TReminderResponse = {
  id: string;
  type: TJobReminderType;
  title: string;
  dueDate: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Request body accepted by `POST /api/jobs/{jobId}/reminders`. A new
 * reminder is always open, so there is no completion field.
 */
export type TCreateReminderRequest = {
  type: TJobReminderType;
  title: string;
  dueDate: string;
};

/**
 * Request body accepted by `PUT /api/jobs/{jobId}/reminders/{reminderId}`.
 *
 * A full replacement. `completed` is a flag rather than a timestamp: the
 * server sets `completedAt` from its own clock when a reminder becomes
 * complete, keeps it when it already was, and clears it on reopen.
 */
export type TUpdateReminderRequest = TCreateReminderRequest & {
  completed: boolean;
};

/**
 * Wire representation of one item from `GET /api/reminders/next`: the
 * earliest open reminders across every job, stored and task-derived
 * alike. `id` is a reminder id or a task id depending on `source`, and
 * `type` is null for a task.
 */
export type TNextReminderResponse = {
  source: TReminderSource;
  id: string;
  jobId: string;
  type: TJobReminderType | null;
  title: string;
  dueDate: string;
};
