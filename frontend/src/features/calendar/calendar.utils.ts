import { getLocalIsoDate } from '../reminders/reminders.utils';
import type {
  ICalendarDateGroup,
  ICalendarDay,
  ICalendarMonth,
  TCalendarItem,
} from './calendar.types';

const DAYS_PER_WEEK = 7;
const MONTHS_PER_YEAR = 12;

/**
 * Returns the month containing a local date.
 *
 * @param {Date} date Any moment in the month.
 * @returns {ICalendarMonth} Its year and zero-based month.
 */
export const getCalendarMonth = (date: Date): ICalendarMonth => ({
  month: date.getMonth(),
  year: date.getFullYear(),
});

/**
 * Moves a month forwards or backwards, across year boundaries.
 *
 * @param {ICalendarMonth} month Starting month.
 * @param {number} delta Months to move; negative moves back.
 * @returns {ICalendarMonth} The resulting month.
 */
export const shiftCalendarMonth = (
  { month, year }: ICalendarMonth,
  delta: number,
): ICalendarMonth => {
  const index = year * MONTHS_PER_YEAR + month + delta;

  return {
    month: ((index % MONTHS_PER_YEAR) + MONTHS_PER_YEAR) % MONTHS_PER_YEAR,
    year: Math.floor(index / MONTHS_PER_YEAR),
  };
};

/**
 * Returns a month's first and last calendar dates as `YYYY-MM-DD`, the
 * inclusive range the calendar endpoint is asked for. Built from local
 * year, month, and day only, so no timezone or DST shift can move them.
 *
 * @param {ICalendarMonth} month The month.
 * @returns {{ from: string; to: string }} First and last date of the month.
 */
export const getMonthDateRange = ({
  month,
  year,
}: ICalendarMonth): { from: string; to: string } => ({
  from: getLocalIsoDate(new Date(year, month, 1)),
  to: getLocalIsoDate(new Date(year, month + 1, 0)),
});

/**
 * Builds a month's grid: whole Monday-to-Sunday weeks covering every day
 * of the month, with leading and trailing days from the neighbouring
 * months marked as outside it.
 *
 * @param {ICalendarMonth} month The month.
 * @returns {ICalendarDay[][]} One array of seven days per week.
 */
export const getMonthGrid = ({ month, year }: ICalendarMonth): ICalendarDay[][] => {
  const firstDay = new Date(year, month, 1);
  const daysBeforeMonth = (firstDay.getDay() + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekCount = Math.ceil((daysBeforeMonth + daysInMonth) / DAYS_PER_WEEK);
  const weeks: ICalendarDay[][] = [];

  for (let week = 0; week < weekCount; week += 1) {
    const days: ICalendarDay[] = [];

    for (let weekday = 0; weekday < DAYS_PER_WEEK; weekday += 1) {
      const date = new Date(year, month, 1 - daysBeforeMonth + week * DAYS_PER_WEEK + weekday);

      days.push({
        date: getLocalIsoDate(date),
        dayOfMonth: date.getDate(),
        isInMonth: date.getMonth() === month,
      });
    }

    weeks.push(days);
  }

  return weeks;
};

/**
 * Groups items by date, in date order, keeping each date's items in the
 * order they arrived in. Dates are compared as `YYYY-MM-DD` strings.
 *
 * @param {TCalendarItem[]} items Calendar items in any order.
 * @returns {ICalendarDateGroup[]} One group per date that has items.
 */
export const groupCalendarItemsByDate = (items: TCalendarItem[]): ICalendarDateGroup[] => {
  const groups = new Map<string, TCalendarItem[]>();

  for (const item of items) groups.set(item.date, [...(groups.get(item.date) ?? []), item]);

  return [...groups.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([date, dateItems]) => ({ date, items: dateItems }));
};
