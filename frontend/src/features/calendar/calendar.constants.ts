import { tileToneClasses } from '../../components/ui';
import type { TCalendarItemSource } from '../../services';

/**
 * TEMPORARY - remove when the task 042 backend lands.
 *
 * False in built images (`production` mode), where `GET /api/calendar-items`
 * does not exist yet: the Calendar page stays "coming soon" and no calendar
 * request is made. True in the dev server, where `USE_MOCK_CALENDAR` stands
 * in for the endpoint, and under Vitest, so the feature stays tested.
 */
export const CALENDAR_FEATURE_ENABLED = import.meta.env.MODE !== 'production';

/**
 * Most items a month-grid cell lists before "+n more".
 */
export const CALENDAR_DAY_ITEM_LIMIT = 3;

/**
 * Chip tint per item source in the month grid, from the shared tile
 * tones: reminders lavender, tasks peach, submitted documents mint.
 */
export const CALENDAR_SOURCE_TONES: Record<TCalendarItemSource, string> = {
  DOCUMENT: tileToneClasses.mint,
  REMINDER: tileToneClasses.lavender,
  TASK: tileToneClasses.peach,
};

/**
 * Dot colour per item source, the same hue as its chip tint: the grid's
 * dots on phones, the colour key, and the selected-day list all use it,
 * so one kind keeps one colour everywhere on the page.
 */
export const CALENDAR_SOURCE_DOTS: Record<TCalendarItemSource, string> = {
  DOCUMENT: 'bg-success-500',
  REMINDER: 'bg-primary-500',
  TASK: 'bg-orange-500',
};

/**
 * The item sources in the order the colour key and a day's dots list them,
 * which is also the order the endpoint sorts one date's items in.
 */
export const CALENDAR_SOURCES: TCalendarItemSource[] = ['REMINDER', 'TASK', 'DOCUMENT'];
