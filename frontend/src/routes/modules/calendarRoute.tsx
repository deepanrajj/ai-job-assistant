import { useState, type FC } from 'react';

import { CalendarPage } from '../../pages/calendar/CalendarPage';
import { ComingSoonPage } from '../../pages/comingSoon/ComingSoonPage';
import { useCalendarItems } from '../../features/calendar/useCalendarItems';
import { useLocalToday } from '../../hooks';
import { useJobsList } from '../../features/jobs';
import { useTranslation } from '../../i18n';
import {
  getCalendarMonth,
  getMonthDateRange,
  shiftCalendarMonth,
} from '../../features/calendar/calendar.utils';
import { getLocalIsoDate } from '../../features/reminders/reminders.utils';
import { CALENDAR_FEATURE_ENABLED } from '../../features/calendar/calendar.constants';

/**
 * Renders the Calendar page for one month at a time, starting at the
 * current month.
 *
 * The route owns the month and both requests, as the other routes do, so
 * the page stays free of MSW. Either request failing shows one error with
 * one retry that reloads both: items without their jobs cannot be named.
 *
 * @returns {JSX.Element} Calendar route content.
 */
export const CalendarRouteWithItems: FC = () => {
  const today = useLocalToday();
  const [month, setMonth] = useState(() => getCalendarMonth(today));
  const { from, to } = getMonthDateRange(month);
  const jobsList = useJobsList();
  const calendarItems = useCalendarItems(from, to);

  const handleRetry = () => {
    jobsList.reload();
    calendarItems.reload();
  };

  return (
    <CalendarPage
      error={jobsList.error ?? calendarItems.error}
      isLoading={jobsList.isLoading || calendarItems.isLoading}
      items={calendarItems.items}
      jobs={jobsList.jobs}
      month={month}
      onNextMonth={() => setMonth((current) => shiftCalendarMonth(current, 1))}
      onPreviousMonth={() => setMonth((current) => shiftCalendarMonth(current, -1))}
      onRetry={handleRetry}
      onThisMonth={() => setMonth(getCalendarMonth(today))}
      today={getLocalIsoDate(today)}
    />
  );
};

/**
 * Renders the Calendar placeholder, making no request.
 *
 * @returns {JSX.Element} Calendar route content.
 */
export const CalendarRouteComingSoon: FC = () => {
  const { t } = useTranslation();

  return (
    <ComingSoonPage
      description={t('route.comingSoon.description')}
      title={t('route.comingSoon.title')}
    />
  );
};

/**
 * The Calendar route, chosen once at module load so each variant calls the
 * same hooks on every render. TEMPORARY: collapse to
 * `CalendarRouteWithItems` once the task 042 backend lands; see
 * `CALENDAR_FEATURE_ENABLED`.
 */
export const Component: FC = CALENDAR_FEATURE_ENABLED
  ? CalendarRouteWithItems
  : CalendarRouteComingSoon;
