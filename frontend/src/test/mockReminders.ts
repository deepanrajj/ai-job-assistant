import { getLocalIsoDate } from '../features/reminders/reminders.utils';
import type { TNextReminderResponse, TReminderResponse } from '../services';

/**
 * Ids of the reminders a test can address without hardcoding a UUID,
 * mirroring `MOCK_CONTACT_IDS` in `mockContacts.ts`.
 */
export const MOCK_REMINDER_IDS = {
  primary: 'c3333333-3333-4333-8333-333333333333',
  secondary: 'd4444444-4444-4444-8444-444444444444',
} as const;

/**
 * Returns the local calendar date `offsetDays` away from today, so a test
 * can place a reminder before, on, or after today without faking the clock.
 *
 * @param {number} offsetDays Days from today; negative for the past.
 * @returns {string} Local calendar date in `YYYY-MM-DD` form.
 */
export const localDateFromToday = (offsetDays: number): string => {
  const date = new Date();

  date.setDate(date.getDate() + offsetDays);

  return getLocalIsoDate(date);
};

/**
 * Creates a mock wire reminder, shaped exactly as
 * `GET /api/jobs/{jobId}/reminders` returns one. Open by default.
 *
 * @param {Partial<TReminderResponse>} overrides Wire fields that should differ from the default.
 * @returns {TReminderResponse} Mock reminder response suitable for API-backed tests.
 */
export const createMockReminderResponse = (
  overrides: Partial<TReminderResponse> = {},
): TReminderResponse => ({
  id: MOCK_REMINDER_IDS.primary,
  type: 'FOLLOW_UP',
  title: 'Follow up with recruiter',
  dueDate: '2026-05-12',
  completedAt: null,
  createdAt: '2026-05-01T09:00:00.123456Z',
  updatedAt: '2026-05-01T09:00:00.123456Z',
  ...overrides,
});

/**
 * Creates a mock item from `GET /api/reminders/next`.
 *
 * @param {Partial<TNextReminderResponse>} overrides Wire fields that should differ from the default.
 * @returns {TNextReminderResponse} Mock next-reminder response.
 */
export const createMockNextReminderResponse = (
  overrides: Partial<TNextReminderResponse> = {},
): TNextReminderResponse => ({
  source: 'REMINDER',
  id: MOCK_REMINDER_IDS.primary,
  jobId: 'job-unknown',
  type: 'FOLLOW_UP',
  title: 'Follow up with recruiter',
  dueDate: '2026-05-12',
  ...overrides,
});
