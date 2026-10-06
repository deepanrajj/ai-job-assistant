import { getJson } from '../api';
import { getCalendarFallbackErrorMessage } from './calendar.utils';
// TEMPORARY: remove this import and the USE_MOCK_CALENDAR branch below
// when the task 042 backend lands. See calendar.mock.ts.
import { USE_MOCK_CALENDAR, mockGetCalendarItems } from './calendar.mock';
import { APP_ERROR_CODES } from '../../types';
import type { TCalendarItemResponse } from './calendar.types';

/**
 * Fetches every dated item across every job whose date falls in
 * `[from, to]`, both inclusive `YYYY-MM-DD` dates, ordered by date.
 *
 * @param {string} from First date of the range.
 * @param {string} to Last date of the range.
 * @returns {Promise<TCalendarItemResponse[]>} Items as the API returns them.
 */
export const getCalendarItems = (from: string, to: string): Promise<TCalendarItemResponse[]> =>
  USE_MOCK_CALENDAR
    ? mockGetCalendarItems(from, to)
    : getJson<TCalendarItemResponse[]>(
        `/api/calendar-items?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        {
          errorCode: APP_ERROR_CODES.CALENDAR_REQUEST_FAILED,
          fallbackErrorMessage: getCalendarFallbackErrorMessage('listCalendarItems'),
        },
      );
