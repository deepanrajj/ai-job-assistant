import type { TLanguage } from '../../i18n';
import { inactiveJobStatuses, RECENT_JOBS_LIMIT } from './dashboard.constants';
import type { TJob, TReminderItem } from '../../types';
import type { IDashboardData, IReminderGroup, TJobStatusCounts } from './dashboard.types';

/**
 * Creates an empty count map for every supported job status.
 *
 * @returns {TJobStatusCounts} Empty job status counts.
 */
const createEmptyStatusCounts = (): TJobStatusCounts => ({
  WISHLIST: 0,
  APPLIED: 0,
  INTERVIEW: 0,
  OFFER: 0,
  REJECTED: 0,
  WITHDRAWN: 0,
});

/**
 * Derives the job counts and recent activity displayed by the dashboard.
 *
 * @param {TJob[]} jobs Jobs available to summarize.
 * @returns {IDashboardData} Derived dashboard job data.
 */
export const getDashboardData = (jobs: TJob[]): IDashboardData => {
  const statusCounts = createEmptyStatusCounts();
  let activeJobCount = 0;

  jobs.forEach((job) => {
    statusCounts[job.status] += 1;

    if (!inactiveJobStatuses.includes(job.status)) activeJobCount += 1;
  });

  const recentJobs = [...jobs]
    .sort(
      (first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
    )
    .slice(0, RECENT_JOBS_LIMIT);

  return {
    activeJobCount,
    recentJobs,
    statusCounts,
    totalJobCount: jobs.length,
  };
};

/**
 * Formats a dashboard activity date for the active language: day and month,
 * plus the year when it is not the year of `today`, so last year's date is
 * never read as this year's.
 *
 * @param {string | Date} date ISO date string or date to format.
 * @param {TLanguage} language Active app language.
 * @param {Date} today The current day, from `useLocalToday`.
 * @returns {string} Localized dashboard date.
 */
export const formatDashboardDate = (
  date: string | Date,
  language: TLanguage,
  today: Date,
): string => {
  const value = new Date(date);

  return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
    day: 'numeric',
    month: 'short',
    ...(value.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }),
  }).format(value);
};

/**
 * Formats a `YYYY-MM-DD` day as a short weekday and date for the reminder
 * agenda, reading it as a local calendar day rather than UTC midnight.
 *
 * @param {string} isoDate Local calendar date as `YYYY-MM-DD`.
 * @param {TLanguage} language Active app language.
 * @returns {string} Localized day label, such as "Wed, Oct 14".
 */
export const formatAgendaDay = (isoDate: string, language: TLanguage): string => {
  const [year, month, day] = isoDate.split('-').map(Number);

  return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(new Date(year, month - 1, day));
};

/**
 * Calculates the visual width for a job status meter.
 *
 * @param {number} count Jobs assigned to the status.
 * @param {number} totalJobCount Total jobs represented by the meter.
 * @returns {string} Percentage width for the status meter.
 */
export const getStatusMeterWidth = (count: number, totalJobCount: number): string =>
  totalJobCount > 0 ? `${(count / totalJobCount) * 100}%` : '0%';

/**
 * Groups reminders for the dashboard's weekly agenda: overdue first, then
 * one group per day of the current week that has reminders, then later.
 * Reminders keep their incoming order within each group, and day groups
 * are sorted by date.
 *
 * Days without reminders get no group: the dashboard loads only the next
 * few reminders, so it cannot tell that such a day is free.
 *
 * @param {TReminderItem[]} reminders Open reminders, earliest due first.
 * @param {string} today Today's local date as `YYYY-MM-DD`.
 * @param {string} weekEnd First day after the current week as `YYYY-MM-DD`.
 * @returns {IReminderGroup[]} Non-empty reminder groups in display order.
 */
export const groupRemindersByWeek = (
  reminders: TReminderItem[],
  today: string,
  weekEnd: string,
): IReminderGroup[] => {
  const overdue: IReminderGroup = { date: null, kind: 'overdue', reminders: [] };
  const later: IReminderGroup = { date: null, kind: 'later', reminders: [] };
  const days = new Map<string, IReminderGroup>();

  // `YYYY-MM-DD` strings compare as dates, as in `getReminderDueState`.
  reminders.forEach((reminder) => {
    if (reminder.dueDate < today) overdue.reminders.push(reminder);
    else if (reminder.dueDate >= weekEnd) later.reminders.push(reminder);
    else {
      const day = days.get(reminder.dueDate) ?? {
        date: reminder.dueDate,
        kind: 'day',
        reminders: [],
      };

      day.reminders.push(reminder);
      days.set(reminder.dueDate, day);
    }
  });

  // Day groups are sorted here rather than trusted to the input order: the
  // response merges stored reminders with task-derived ones.
  const dayGroups = [...days.values()].sort((left, right) =>
    (left.date ?? '').localeCompare(right.date ?? ''),
  );

  return [overdue, ...dayGroups, later].filter((group) => group.reminders.length > 0);
};
