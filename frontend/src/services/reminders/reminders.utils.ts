import { translate } from '../../i18n';
import type { TJobReminderType, TReminderItem } from '../../types';
import {
  REMINDER_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TCreateReminderRequest,
  type TNextReminderResponse,
  type TReminderFallbackErrorKey,
  type TReminderResponse,
  type TUpdateReminderRequest,
} from './reminders.types';
import type { TTaskResponse } from '../tasks';

/**
 * Resolves the localized fallback error message for a reminder service operation.
 *
 * @param {TReminderFallbackErrorKey} key Reminder operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getReminderFallbackErrorMessage = (key: TReminderFallbackErrorKey): string =>
  translate(REMINDER_FALLBACK_ERROR_TRANSLATION_KEYS[key]);

/**
 * Converts a stored reminder into the item every reminder screen renders.
 *
 * @param {TReminderResponse} response Reminder exactly as `/api/jobs/{jobId}/reminders` returned it.
 * @param {string} jobId Job the reminder belongs to, taken from the request path.
 * @returns {TReminderItem} Reminder item.
 */
export const mapReminderResponseToReminderItem = (
  response: TReminderResponse,
  jobId: string,
): TReminderItem => ({
  id: response.id,
  jobId,
  source: 'REMINDER',
  type: response.type,
  title: response.title,
  dueDate: response.dueDate,
  isComplete: response.completedAt !== null,
});

/**
 * Converts a task into a reminder item, or returns null for a task with no
 * due date: only a dated task is a reminder.
 *
 * @param {TTaskResponse} response Task exactly as `/api/jobs/{jobId}/tasks` returned it.
 * @param {string} jobId Job the task belongs to, taken from the request path.
 * @returns {TReminderItem | null} Reminder item, or null when the task has no due date.
 */
export const mapTaskResponseToReminderItem = (
  response: TTaskResponse,
  jobId: string,
): TReminderItem | null =>
  response.dueDate
    ? {
        id: response.id,
        jobId,
        source: 'TASK',
        type: null,
        title: response.title,
        dueDate: response.dueDate,
        isComplete: response.status === 'DONE',
      }
    : null;

/**
 * Converts one `GET /api/reminders/next` item into a reminder item. The
 * endpoint only returns open reminders.
 *
 * @param {TNextReminderResponse} response Item exactly as the endpoint returned it.
 * @returns {TReminderItem} Reminder item.
 */
export const mapNextReminderResponseToReminderItem = (
  response: TNextReminderResponse,
): TReminderItem => ({
  id: response.id,
  jobId: response.jobId,
  source: response.source,
  type: response.type,
  title: response.title,
  dueDate: response.dueDate,
  isComplete: false,
});

/**
 * Raw field values a reminder form collects before they are sent.
 */
export interface IReminderFormValues {
  dueDate: string;
  title: string;
  type: TJobReminderType;
}

/**
 * Checks whether a reminder form is ready to submit: a non-blank title and
 * a due date. Gates both the add-reminder button and a row's save button.
 *
 * @param {IReminderFormValues} values Raw reminder form field values.
 * @returns {boolean} True when the form is ready to submit.
 */
export const isReminderFormValid = (values: IReminderFormValues): boolean =>
  Boolean(values.title.trim() && values.dueDate);

/**
 * Builds a create request body from raw reminder form values.
 *
 * @param {IReminderFormValues} values Raw reminder form field values.
 * @returns {TCreateReminderRequest} Request body ready to send to the backend.
 */
export const buildCreateReminderRequest = (
  values: IReminderFormValues,
): TCreateReminderRequest => ({
  type: values.type,
  title: values.title.trim(),
  dueDate: values.dueDate,
});

/**
 * Builds a full-replacement update body from raw reminder form values and
 * the completion state the reminder should end up in.
 *
 * @param {IReminderFormValues} values Raw reminder form field values.
 * @param {boolean} completed Whether the reminder should be complete after the update.
 * @returns {TUpdateReminderRequest} Request body ready to send to the backend.
 */
export const buildUpdateReminderRequest = (
  values: IReminderFormValues,
  completed: boolean,
): TUpdateReminderRequest => ({
  ...buildCreateReminderRequest(values),
  completed,
});
