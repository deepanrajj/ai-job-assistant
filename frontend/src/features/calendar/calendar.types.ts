import type { TCalendarItemResponse } from '../../services';

/**
 * One calendar item as the page renders it: the API's shape, unchanged.
 */
export type TCalendarItem = TCalendarItemResponse;

/**
 * A calendar month: the year and the zero-based month, as `Date` counts
 * them.
 */
export interface ICalendarMonth {
  month: number;
  year: number;
}

/**
 * One cell of the month grid.
 */
export interface ICalendarDay {
  date: string;
  dayOfMonth: number;
  isInMonth: boolean;
}

/**
 * The items on one date, for the date-grouped list.
 */
export interface ICalendarDateGroup {
  date: string;
  items: TCalendarItem[];
}
