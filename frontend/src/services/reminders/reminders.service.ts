import { deleteJson, getJson, postJson, putJson } from '../api';
import { getReminderFallbackErrorMessage } from './reminders.utils';
// TEMPORARY: remove this import and every USE_MOCK_REMINDERS branch below
// when the task 040 backend lands. See reminders.mock.ts.
import {
  USE_MOCK_REMINDERS,
  mockCreateReminder,
  mockDeleteReminder,
  mockGetNextReminders,
  mockGetReminders,
  mockUpdateReminder,
} from './reminders.mock';
import { APP_ERROR_CODES } from '../../types';
import type {
  TCreateReminderRequest,
  TNextReminderResponse,
  TReminderResponse,
  TUpdateReminderRequest,
} from './reminders.types';

/**
 * Builds the endpoint URL for a job's reminders.
 *
 * The job id is encoded because it reaches this service from a route param,
 * and an unencoded one does not stay a path segment.
 *
 * @param {string} jobId Job identifier.
 * @returns {string} Endpoint URL for that job's reminders.
 */
const getRemindersEndpoint = (jobId: string): string =>
  `/api/jobs/${encodeURIComponent(jobId)}/reminders`;

/**
 * Builds the endpoint URL for a single reminder under a job.
 *
 * @param {string} jobId Job identifier.
 * @param {string} reminderId Reminder identifier.
 * @returns {string} Endpoint URL for that reminder.
 */
const getReminderEndpoint = (jobId: string, reminderId: string): string =>
  `${getRemindersEndpoint(jobId)}/${encodeURIComponent(reminderId)}`;

/**
 * Fetches a job's stored reminders, earliest due date first. Task
 * reminders are not included; they come from the job's tasks.
 *
 * @param {string} jobId Job identifier.
 * @returns {Promise<TReminderResponse[]>} Reminders as the API returns them.
 */
export const getReminders = (jobId: string): Promise<TReminderResponse[]> =>
  USE_MOCK_REMINDERS
    ? mockGetReminders(jobId)
    : getJson<TReminderResponse[]>(getRemindersEndpoint(jobId), {
        errorCode: APP_ERROR_CODES.REMINDER_REQUEST_FAILED,
        fallbackErrorMessage: getReminderFallbackErrorMessage('listReminders'),
      });

/**
 * Creates a reminder under a job.
 *
 * @param {string} jobId Job identifier.
 * @param {TCreateReminderRequest} payload Reminder creation request body.
 * @returns {Promise<TReminderResponse>} The created reminder, including its server-assigned id.
 */
export const createReminder = (
  jobId: string,
  payload: TCreateReminderRequest,
): Promise<TReminderResponse> =>
  USE_MOCK_REMINDERS
    ? mockCreateReminder(jobId, payload)
    : postJson<TReminderResponse, TCreateReminderRequest>(getRemindersEndpoint(jobId), payload, {
        errorCode: APP_ERROR_CODES.REMINDER_REQUEST_FAILED,
        fallbackErrorMessage: getReminderFallbackErrorMessage('createReminder'),
      });

/**
 * Replaces every editable field of a reminder, including whether it is
 * complete.
 *
 * @param {string} jobId Job identifier.
 * @param {string} reminderId Reminder identifier.
 * @param {TUpdateReminderRequest} payload Complete replacement request body.
 * @returns {Promise<TReminderResponse>} The updated reminder as the API returns it.
 */
export const updateReminder = (
  jobId: string,
  reminderId: string,
  payload: TUpdateReminderRequest,
): Promise<TReminderResponse> =>
  USE_MOCK_REMINDERS
    ? mockUpdateReminder(jobId, reminderId, payload)
    : putJson<TReminderResponse, TUpdateReminderRequest>(
        getReminderEndpoint(jobId, reminderId),
        payload,
        {
          errorCode: APP_ERROR_CODES.REMINDER_REQUEST_FAILED,
          fallbackErrorMessage: getReminderFallbackErrorMessage('updateReminder'),
        },
      );

/**
 * Deletes a reminder.
 *
 * The API answers 204 with no body, so this resolves to undefined.
 *
 * @param {string} jobId Job identifier.
 * @param {string} reminderId Reminder identifier.
 * @returns {Promise<void>} Resolves once the reminder is deleted.
 */
export const deleteReminder = (jobId: string, reminderId: string): Promise<void> =>
  USE_MOCK_REMINDERS
    ? mockDeleteReminder(jobId, reminderId)
    : deleteJson<void>(getReminderEndpoint(jobId, reminderId), {
        errorCode: APP_ERROR_CODES.REMINDER_REQUEST_FAILED,
        fallbackErrorMessage: getReminderFallbackErrorMessage('deleteReminder'),
      });

/**
 * Fetches the earliest open reminders across every job, stored and
 * task-derived alike, earliest due date first.
 *
 * @param {number} limit Maximum number of items; the server clamps it.
 * @returns {Promise<TNextReminderResponse[]>} Items as the API returns them.
 */
export const getNextReminders = (limit: number): Promise<TNextReminderResponse[]> =>
  USE_MOCK_REMINDERS
    ? mockGetNextReminders(limit)
    : getJson<TNextReminderResponse[]>(`/api/reminders/next?limit=${limit}`, {
        errorCode: APP_ERROR_CODES.REMINDER_REQUEST_FAILED,
        fallbackErrorMessage: getReminderFallbackErrorMessage('listNextReminders'),
      });
