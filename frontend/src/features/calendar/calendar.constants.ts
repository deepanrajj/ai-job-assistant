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
