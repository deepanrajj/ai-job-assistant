import type { TJobDocumentType, TJobReminderType } from '../../types';

/**
 * Translation keys used for calendar service fallback errors.
 */
export const CALENDAR_FALLBACK_ERROR_TRANSLATION_KEYS = {
  listCalendarItems: 'calendar.fallbackError.listCalendarItems',
} as const;

/**
 * Supported calendar fallback error lookup keys.
 */
export type TCalendarFallbackErrorKey = keyof typeof CALENDAR_FALLBACK_ERROR_TRANSLATION_KEYS;

/**
 * What a calendar item comes from: a stored reminder, a task's due date,
 * or a document's submitted date.
 */
export type TCalendarItemSource = 'REMINDER' | 'TASK' | 'DOCUMENT';

/**
 * One item of `GET /api/calendar-items`. `date` is a `YYYY-MM-DD`
 * calendar date, never a moment. `reminderType` is set only for a
 * reminder and `documentType` only for a document. `isComplete` is a
 * completed reminder or a DONE task; a document is never complete.
 */
export type TCalendarItemResponse = {
  source: TCalendarItemSource;
  id: string;
  jobId: string;
  date: string;
  title: string;
  reminderType: TJobReminderType | null;
  documentType: TJobDocumentType | null;
  isComplete: boolean;
};
