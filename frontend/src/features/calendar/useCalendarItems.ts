import { useCallback, useEffect, useMemo } from 'react';

import { getCalendarItems, type TCalendarItemResponse } from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';
import type { TCalendarItem } from './calendar.types';

/**
 * Arguments accepted by the calendar range request.
 */
interface ICalendarRange {
  from: string;
  to: string;
}

/**
 * Calendar items state returned by useCalendarItems.
 */
export interface ICalendarItemsState {
  error: AppError | null;
  isLoading: boolean;
  items: TCalendarItem[];
  reload: () => void;
}

/**
 * Items loaded for one range, tagged with that range so a response is
 * never shown for a different one.
 */
interface ILoadedCalendarItems {
  items: TCalendarItemResponse[];
  rangeKey: string;
}

/**
 * Identifies a range, to tell whether loaded items belong to it.
 *
 * @param {ICalendarRange} range The range.
 * @returns {string} The range's key.
 */
const getRangeKey = ({ from, to }: ICalendarRange): string => `${from}/${to}`;

/**
 * Declared at module level so `mutate` keeps a stable identity.
 */
const loadCalendarItems = (range: ICalendarRange): Promise<ILoadedCalendarItems> =>
  getCalendarItems(range.from, range.to).then((items) => ({
    items,
    rangeKey: getRangeKey(range),
  }));

/**
 * Loads every dated item across every job for one date range, and loads
 * again whenever the range changes, reporting loading from the first
 * render with the new range. `useAsyncMutation` drops a response
 * that arrives after a newer request started, so paging quickly through
 * months never shows an earlier month's items under a later heading.
 *
 * @param {string} from First date of the range, `YYYY-MM-DD`.
 * @param {string} to Last date of the range, `YYYY-MM-DD`.
 * @returns {ICalendarItemsState} Items, load error, loading flag, and retry.
 */
export const useCalendarItems = (from: string, to: string): ICalendarItemsState => {
  const {
    mutate: loadItems,
    request: { data, error, isIdle, isLoading },
  } = useAsyncMutation<ICalendarRange, ILoadedCalendarItems>(loadCalendarItems);

  const reload = useCallback(() => {
    loadItems({ from, to }).catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  }, [from, loadItems, to]);

  useEffect(() => {
    reload();
  }, [reload]);

  // The request for a new range starts in an effect, after the first
  // render with that range; until then the loaded items are another
  // range's, so they count as loading rather than as this range's items.
  const isStale = data !== null && data.rangeKey !== getRangeKey({ from, to });
  const items = useMemo(
    () => (data !== null && Array.isArray(data.items) ? data.items : []),
    [data],
  );

  return {
    error,
    isLoading: isIdle || isLoading || isStale,
    items,
    reload,
  };
};
