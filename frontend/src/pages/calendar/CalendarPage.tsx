import { useMemo, type FC } from 'react';
import { Link } from 'react-router-dom';

import { Button, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { useTranslation, type TLanguage } from '../../i18n';
import { classNames } from '../../utils';
import { getMonthGrid, groupCalendarItemsByDate } from '../../features/calendar/calendar.utils';
import {
  getCalendarItemKey,
  getCalendarItemKindLabel,
} from '../../features/calendar/calendarItem.utils';
import type { AppError } from '../../errors';
import { APP_PATH_BUILDERS } from '../../routes/paths';
import { CALENDAR_DAY_ITEM_LIMIT } from '../../features/calendar/calendar.constants';
import type { TJob } from '../../types';
import type { ICalendarMonth, TCalendarItem } from '../../features/calendar/calendar.types';

/**
 * Props used by the calendar page.
 */
interface ICalendarPageProps {
  error: AppError | null;
  isLoading: boolean;
  items: TCalendarItem[];
  jobs: TJob[];
  month: ICalendarMonth;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
  onRetry: () => void;
  onThisMonth: () => void;
  today: string;
}

/**
 * The Monday to Sunday dates of a week that starts on 4 January 2027, a
 * Monday, used only to name the weekday columns in the active language.
 */
const WEEKDAY_SAMPLE_DATES = Array.from(
  { length: 7 },
  (_, index) => new Date(Date.UTC(2027, 0, 4 + index)),
);

/**
 * Formats a month and year, such as "October 2026".
 *
 * @param {ICalendarMonth} month The month.
 * @param {TLanguage} language Active app language.
 * @returns {string} Localized month heading.
 */
const formatMonthHeading = ({ month, year }: ICalendarMonth, language: TLanguage): string =>
  new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month, 1)));

/**
 * Formats a date-only value with its weekday, such as "Mon, Oct 5, 2026",
 * in UTC so the day never shifts with the user's timezone.
 *
 * @param {string} date `YYYY-MM-DD` date.
 * @param {TLanguage} language Active app language.
 * @returns {string} Localized date heading.
 */
const formatDayHeading = (date: string, language: TLanguage): string =>
  new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    weekday: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`));

/**
 * Props used by one calendar item line.
 */
interface ICalendarItemLinkProps {
  company: string;
  item: TCalendarItem;
}

/**
 * Renders one item in the date-grouped list: its kind, title, and job,
 * linking to the job. Completed items are struck through and muted.
 *
 * @param {ICalendarItemLinkProps} props Component props.
 * @returns {JSX.Element} Calendar item link.
 */
const CalendarItemLink: FC<ICalendarItemLinkProps> = ({ company, item }) => {
  const { t } = useTranslation();

  return (
    <Link
      aria-label={t('calendar.itemLinkLabel', {
        company,
        kind: getCalendarItemKindLabel(item, t),
        title: item.title,
      })}
      className="flex flex-col gap-1 rounded-lg px-3 py-2 transition hover:bg-app-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 sm:flex-row sm:items-center sm:justify-between"
      to={APP_PATH_BUILDERS.jobDetail(item.jobId)}
    >
      <span className="min-w-0">
        <span
          className={classNames(
            'block font-medium',
            item.isComplete ? 'text-app-textMuted line-through' : 'text-app-text',
          )}
        >
          {item.title}
        </span>
        <span className="block text-xs text-app-textMuted">
          {getCalendarItemKindLabel(item, t)}
          {item.isComplete ? ` · ${t('calendar.completed')}` : ''}
        </span>
      </span>
      <span className="shrink-0 text-sm text-app-textSoft">{company}</span>
    </Link>
  );
};

/**
 * Shows one month of dated items across every job: reminders, task due
 * dates, and submitted documents. Wide screens get a Monday-first month
 * grid as a visual summary; every screen gets the same month as a list
 * grouped by date, which is the accessible view, so the grid is hidden
 * from assistive technology rather than read twice.
 *
 * @param {ICalendarPageProps} props Component props.
 * @returns {JSX.Element} Calendar page.
 */
export const CalendarPage: FC<ICalendarPageProps> = ({
  error,
  isLoading,
  items,
  jobs,
  month,
  onNextMonth,
  onPreviousMonth,
  onRetry,
  onThisMonth,
  today,
}) => {
  const { language, t } = useTranslation();
  const jobsById = useMemo(() => new Map(jobs.map((job) => [job.id, job])), [jobs]);
  const groups = useMemo(() => groupCalendarItemsByDate(items), [items]);
  const itemsByDate = useMemo(
    () => new Map(groups.map((group) => [group.date, group.items])),
    [groups],
  );
  const weeks = useMemo(() => getMonthGrid(month), [month]);
  const weekdayFormatter = new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
    timeZone: 'UTC',
    weekday: 'short',
  });
  const monthHeading = formatMonthHeading(month, language);
  const companyOf = (item: TCalendarItem): string =>
    jobsById.get(item.jobId)?.company ?? t('calendar.unknownJob');

  const renderBody = () => {
    if (isLoading) return <LoadingState label={t('calendar.loading')} />;

    if (error)
      return (
        <ErrorState
          action={<Button onClick={onRetry}>{t('jobs.loadErrorRetry')}</Button>}
          description={error.message}
          title={t('calendar.loadErrorTitle')}
        />
      );

    return (
      <div className="space-y-6">
        <div aria-hidden="true" className="hidden md:block">
          <div className="grid grid-cols-7 gap-px rounded-lg border border-app-border bg-app-border text-sm">
            {WEEKDAY_SAMPLE_DATES.map((date) => (
              <div
                className="bg-app-surface2 px-2 py-1 text-xs font-medium text-app-textMuted"
                key={date.toISOString()}
              >
                {weekdayFormatter.format(date)}
              </div>
            ))}
            {weeks.flat().map((day) => {
              // Only this month's items are loaded, so a day of the
              // neighbouring month shows none rather than looking free.
              const dayItems = day.isInMonth ? (itemsByDate.get(day.date) ?? []) : [];
              const hiddenCount = dayItems.length - CALENDAR_DAY_ITEM_LIMIT;

              return (
                <div
                  className={classNames(
                    'min-h-24 p-1.5',
                    day.isInMonth ? 'bg-app-surface' : 'bg-app-surface2 text-app-textMuted',
                    day.date === today ? 'ring-2 ring-inset ring-primary-600' : '',
                  )}
                  key={day.date}
                >
                  <p className="text-xs font-medium">{day.dayOfMonth}</p>
                  <ul className="mt-1 space-y-0.5">
                    {dayItems.slice(0, CALENDAR_DAY_ITEM_LIMIT).map((item) => (
                      <li key={getCalendarItemKey(item)}>
                        <Link
                          className={classNames(
                            'block truncate rounded px-1 text-xs hover:bg-primary-50',
                            item.isComplete
                              ? 'text-app-textMuted line-through'
                              : 'text-primary-700',
                          )}
                          tabIndex={-1}
                          to={APP_PATH_BUILDERS.jobDetail(item.jobId)}
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {hiddenCount > 0 && (
                    <p className="mt-0.5 px-1 text-xs text-app-textMuted">
                      {t('calendar.moreItems', { count: hiddenCount })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {groups.length === 0 ? (
          <EmptyState
            description={t('calendar.emptyDescription')}
            title={t('calendar.emptyTitle', { month: monthHeading })}
          />
        ) : (
          <ol aria-label={t('calendar.listLabel', { month: monthHeading })} className="space-y-4">
            {groups.map((group) => (
              <li key={group.date}>
                <h3
                  className={classNames(
                    'mb-1 text-sm font-semibold',
                    group.date === today ? 'text-primary-700' : 'text-app-text',
                  )}
                >
                  {formatDayHeading(group.date, language)}
                  {group.date === today ? ` · ${t('calendar.today')}` : ''}
                </h3>
                <ul className="divide-y divide-app-border rounded-lg border border-app-border">
                  {group.items.map((item) => (
                    <li key={getCalendarItemKey(item)}>
                      <CalendarItemLink company={companyOf(item)} item={item} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  };

  return (
    <Card
      action={
        <div className="flex shrink-0 gap-1">
          <Button onClick={onPreviousMonth} size="sm" variant="ghost">
            <span aria-hidden="true">‹</span>
            <span className="sr-only sm:not-sr-only sm:ml-1">{t('calendar.previousMonth')}</span>
          </Button>
          <Button onClick={onThisMonth} size="sm" variant="ghost">
            {t('calendar.thisMonth')}
          </Button>
          <Button onClick={onNextMonth} size="sm" variant="ghost">
            <span className="sr-only sm:not-sr-only sm:mr-1">{t('calendar.nextMonth')}</span>
            <span aria-hidden="true">›</span>
          </Button>
        </div>
      }
      title={monthHeading}
    >
      {renderBody()}
    </Card>
  );
};
