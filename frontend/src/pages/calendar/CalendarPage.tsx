import { useMemo, useState, type FC } from 'react';
import { Link } from 'react-router-dom';

import { Button, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons';
import { useTranslation, type TLanguage } from '../../i18n';
import { classNames } from '../../utils';
import {
  getDefaultSelectedDate,
  getMonthDateRange,
  getMonthGrid,
  groupCalendarItemsByDate,
} from '../../features/calendar/calendar.utils';
import {
  getCalendarItemKey,
  getCalendarItemKindLabel,
} from '../../features/calendar/calendarItem.utils';
import type { AppError } from '../../errors';
import { APP_PATH_BUILDERS } from '../../routes/paths';
import {
  CALENDAR_DAY_ITEM_LIMIT,
  CALENDAR_SOURCES,
  CALENDAR_SOURCE_DOTS,
  CALENDAR_SOURCE_TONES,
} from '../../features/calendar/calendar.constants';
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
 * Id of the selected-day panel, which every day button controls.
 */
const DAY_PANEL_ID = 'calendar-day-panel';

/**
 * Id of the selected-day panel's heading, which names the panel.
 */
const DAY_HEADING_ID = 'calendar-day-heading';

/**
 * Returns the `Intl` locale for an app language.
 *
 * @param {TLanguage} language Active app language.
 * @returns {string} BCP 47 locale.
 */
const getLocale = (language: TLanguage): string => (language === 'de' ? 'de-DE' : 'en-US');

/**
 * Formats a month and year, such as "October 2026".
 *
 * @param {ICalendarMonth} month The month.
 * @param {TLanguage} language Active app language.
 * @returns {string} Localized month heading.
 */
const formatMonthHeading = ({ month, year }: ICalendarMonth, language: TLanguage): string =>
  new Intl.DateTimeFormat(getLocale(language), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month, 1)));

/**
 * Formats a date-only value in UTC, so the day never shifts with the
 * user's timezone.
 *
 * @param {Intl.DateTimeFormat} formatter A formatter created in UTC.
 * @param {string} date `YYYY-MM-DD` date.
 * @returns {string} Localized date.
 */
const formatDate = (formatter: Intl.DateTimeFormat, date: string): string =>
  formatter.format(new Date(`${date}T00:00:00Z`));

/**
 * Returns the `YYYY-MM` month of a `YYYY-MM-DD` date.
 *
 * @param {string} date `YYYY-MM-DD` date.
 * @returns {string} Its month.
 */
const getMonthKey = (date: string): string => date.slice(0, 7);

/**
 * Props used by one item of the selected-day list.
 */
interface ICalendarItemLinkProps {
  company: string;
  item: TCalendarItem;
}

/**
 * Renders one item of the selected day: its title, then its kind in the
 * kind's tint, as on the grid chip, and its job, linking to the job.
 * Completed items are struck through and muted.
 *
 * @param {ICalendarItemLinkProps} props Component props.
 * @returns {JSX.Element} Calendar item link.
 */
const CalendarItemLink: FC<ICalendarItemLinkProps> = ({ company, item }) => {
  const { t } = useTranslation();
  const kind = getCalendarItemKindLabel(item, t);

  return (
    <Link
      aria-label={t(item.isComplete ? 'calendar.itemLinkDoneLabel' : 'calendar.itemLinkLabel', {
        company,
        kind,
        title: item.title,
      })}
      className="block rounded-xl px-3 py-2.5 transition hover:bg-primary-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
      to={APP_PATH_BUILDERS.jobDetail(item.jobId)}
    >
      <span
        className={classNames(
          'block font-medium',
          item.isComplete ? 'text-app-textMuted line-through' : 'text-app-text',
        )}
      >
        {item.title}
      </span>
      <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-app-textMuted">
        <span
          className={classNames(
            'rounded-md px-1.5 py-0.5 font-medium',
            item.isComplete
              ? 'bg-app-surface2 text-app-textMuted'
              : CALENDAR_SOURCE_TONES[item.source],
          )}
        >
          {kind}
          {item.isComplete ? ` · ${t('calendar.completed')}` : ''}
        </span>
        <span>{company}</span>
      </span>
    </Link>
  );
};

/**
 * Shows one month of dated items across every job: reminders, task due
 * dates, and submitted documents.
 *
 * The month card holds a Monday-first grid where every day of the month
 * is a button. From `md` a day shows up to three chips tinted by kind and
 * "+n more"; on phones, where a chip cannot fit, it shows one dot per
 * kind. Choosing a day lists its items in the day panel beside the grid
 * from `xl`, and under it below. The panel is the readable view, so the
 * chips are hidden from assistive technology and each day button is named
 * by its date and item count instead.
 *
 * A month opens on today, or on its first day with items; see
 * `getDefaultSelectedDate`.
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
  // The month buttons clear a chosen day, so paging back to a month opens
  // it on its default day; "Today" chooses today.
  const [chosenDate, setChosenDate] = useState<string | null>(null);
  // Set by the month buttons, so a month's opening day is announced after
  // paging but not on the first load.
  const [hasPaged, setHasPaged] = useState(false);
  const monthKey = getMonthKey(getMonthDateRange(month).from);

  // One formatter per language and pattern: the grid formats every day.
  const { dayFormatter, weekdayFormatter } = useMemo(
    () => ({
      dayFormatter: new Intl.DateTimeFormat(getLocale(language), {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
        weekday: 'long',
      }),
      weekdayFormatter: new Intl.DateTimeFormat(getLocale(language), {
        timeZone: 'UTC',
        weekday: 'short',
      }),
    }),
    [language],
  );
  const jobsById = useMemo(() => new Map(jobs.map((job) => [job.id, job])), [jobs]);
  const groups = useMemo(() => groupCalendarItemsByDate(items), [items]);
  const itemsByDate = useMemo(
    () => new Map(groups.map((group) => [group.date, group.items])),
    [groups],
  );
  const weeks = useMemo(() => getMonthGrid(month), [month]);
  const openingDate = getDefaultSelectedDate(month, today, groups);
  // The month key check keeps a chosen day from applying to another month.
  const selectedDate =
    chosenDate !== null && getMonthKey(chosenDate) === monthKey ? chosenDate : openingDate;
  const monthHeading = formatMonthHeading(month, language);
  const companyOf = (item: TCalendarItem): string =>
    jobsById.get(item.jobId)?.company ?? t('calendar.unknownJob');
  const countLabel = (count: number): string =>
    count === 0
      ? t('calendar.itemCountNone')
      : count === 1
        ? t('calendar.itemCountOne')
        : t('calendar.itemCountOther', { count });

  const pageTo = (chosen: string | null, onPage: () => void) => {
    setChosenDate(chosen);
    setHasPaged(true);
    onPage();
  };

  const monthActions = (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        aria-label={t('calendar.previousMonth')}
        onClick={() => pageTo(null, onPreviousMonth)}
        size="sm"
        variant="secondary"
      >
        <ChevronLeftIcon />
      </Button>
      <Button onClick={() => pageTo(today, onThisMonth)} size="sm" variant="secondary">
        {t('calendar.thisMonth')}
      </Button>
      <Button
        aria-label={t('calendar.nextMonth')}
        onClick={() => pageTo(null, onNextMonth)}
        size="sm"
        variant="secondary"
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );

  const legend = (
    <ul
      aria-label={t('calendar.legendLabel')}
      className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-app-textMuted"
    >
      {CALENDAR_SOURCES.map((source) => (
        <li className="flex items-center gap-1.5" key={source}>
          <span
            aria-hidden="true"
            className={classNames('h-2 w-2 rounded-full', CALENDAR_SOURCE_DOTS[source])}
          />
          {t(`calendar.legend.${source}`)}
        </li>
      ))}
    </ul>
  );

  const grid = (
    <div>
      <div
        aria-hidden="true"
        className="grid grid-cols-7 text-center text-xs font-medium text-app-textMuted"
      >
        {WEEKDAY_SAMPLE_DATES.map((date) => (
          <div className="py-2" key={date.toISOString()}>
            {weekdayFormatter.format(date)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-app-border">
        {weeks.flat().map((day, index) => {
          const cellClassName = classNames(
            'relative min-h-12 min-w-0 p-1 md:min-h-24 md:p-1.5',
            index % 7 !== 0 && 'border-l border-app-borderSoft',
            index >= 7 && 'border-t border-app-borderSoft',
          );

          // Only this month's items are loaded, so a day of a neighbouring
          // month is a plain, muted cell rather than a day that looks free.
          if (!day.isInMonth)
            return (
              <div
                aria-hidden="true"
                className={classNames(cellClassName, 'bg-app-surface2/60 text-app-textMuted')}
                key={day.date}
              >
                <span className="flex h-6 w-6 items-center justify-center text-xs">
                  {day.dayOfMonth}
                </span>
              </div>
            );

          const dayItems = itemsByDate.get(day.date) ?? [];
          const hiddenCount = dayItems.length - CALENDAR_DAY_ITEM_LIMIT;
          const daySources = CALENDAR_SOURCES.filter((source) =>
            dayItems.some((item) => item.source === source),
          );
          const isToday = day.date === today;
          const isSelected = day.date === selectedDate;
          const dateLabel = formatDate(dayFormatter, day.date);

          return (
            <button
              aria-controls={DAY_PANEL_ID}
              aria-label={t(isToday ? 'calendar.dayButtonTodayLabel' : 'calendar.dayButtonLabel', {
                count: countLabel(dayItems.length),
                date: dateLabel,
              })}
              aria-pressed={isSelected}
              className={classNames(
                cellClassName,
                'flex flex-col items-center text-left transition focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary-800 md:items-stretch',
                isSelected
                  ? 'bg-primary-50 ring-2 ring-inset ring-primary-500'
                  : 'bg-app-surface hover:bg-primary-50/60',
              )}
              key={day.date}
              onClick={() => setChosenDate(day.date)}
              type="button"
            >
              <span
                className={classNames(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                  isToday ? 'bg-primary-600 font-semibold text-white' : 'text-app-text',
                )}
              >
                {day.dayOfMonth}
              </span>
              {/* Phones: one dot per kind on the day. */}
              {daySources.length > 0 && (
                <span aria-hidden="true" className="mt-1 flex gap-0.5 md:hidden">
                  {daySources.map((source) => (
                    <span
                      className={classNames(
                        'h-1.5 w-1.5 rounded-full',
                        CALENDAR_SOURCE_DOTS[source],
                      )}
                      key={source}
                    />
                  ))}
                </span>
              )}
              {/* From md: up to three chips, then "+n more". */}
              {dayItems.length > 0 && (
                <span aria-hidden="true" className="mt-1 hidden w-full space-y-1 md:block">
                  {dayItems.slice(0, CALENDAR_DAY_ITEM_LIMIT).map((item) => (
                    <span
                      className={classNames(
                        'block truncate rounded-md px-1.5 py-0.5 text-xs font-medium',
                        item.isComplete
                          ? 'bg-app-surface2 text-app-textMuted line-through'
                          : CALENDAR_SOURCE_TONES[item.source],
                      )}
                      key={getCalendarItemKey(item)}
                    >
                      {item.title}
                    </span>
                  ))}
                  {hiddenCount > 0 && (
                    <span className="block px-1.5 text-xs font-medium text-primary-700">
                      {t('calendar.moreItems', { count: hiddenCount })}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const selectedItems = itemsByDate.get(selectedDate) ?? [];
  const selectedHeading = formatDate(dayFormatter, selectedDate);
  const selectedSummary =
    selectedDate === today
      ? `${t('calendar.today')} · ${countLabel(selectedItems.length)}`
      : countLabel(selectedItems.length);
  const isLoaded = !isLoading && !error;

  // One root and one month card in every state, so the month buttons are
  // never remounted and keep focus while the next month loads. Loading
  // and error replace the card's body, with no day panel, so the state
  // shows once.
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
      <Card action={monthActions} title={monthHeading}>
        {isLoading ? (
          <LoadingState label={t('calendar.loading')} />
        ) : error ? (
          <ErrorState
            action={<Button onClick={onRetry}>{t('jobs.loadErrorRetry')}</Button>}
            description={error.message}
            title={t('calendar.loadErrorTitle')}
          />
        ) : (
          <>
            {legend}
            {grid}
          </>
        )}
      </Card>
      {/* Below xl the panel is under the grid, often off screen, so after
          paging the month's opening day and its count are announced. A day
          chosen by its button is not: the button already says it. The
          region stays mounted, empty while loading, so the text is a change
          that screen readers announce. */}
      <p aria-live="polite" className="sr-only">
        {isLoaded && hasPaged
          ? t(openingDate === today ? 'calendar.dayButtonTodayLabel' : 'calendar.dayButtonLabel', {
              count: countLabel(itemsByDate.get(openingDate)?.length ?? 0),
              date: formatDate(dayFormatter, openingDate),
            })
          : ''}
      </p>
      {isLoaded && (
        <div id={DAY_PANEL_ID}>
          <Card
            padding="none"
            subtitle={selectedSummary}
            title={selectedHeading}
            titleId={DAY_HEADING_ID}
          >
            {selectedItems.length === 0 ? (
              groups.length === 0 ? (
                <EmptyState
                  description={t('calendar.emptyDescription')}
                  title={t('calendar.emptyTitle', { month: monthHeading })}
                />
              ) : (
                <EmptyState
                  description={t('calendar.dayEmptyDescription')}
                  title={t('calendar.dayEmptyTitle', { date: selectedHeading })}
                />
              )
            ) : (
              <ul className="space-y-0.5 p-2">
                {selectedItems.map((item) => (
                  <li key={getCalendarItemKey(item)}>
                    <CalendarItemLink company={companyOf(item)} item={item} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
