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
 * Declared at module level so `mutate` keeps a stable identity.
 */
const loadCalendarItems = ({ from, to }: ICalendarRange): Promise<TCalendarItemResponse[]> =>
  getCalendarItems(from, to);

/**
 * Loads every dated item across every job for one date range, and loads
 * again whenever the range changes. `useAsyncMutation` drops a response
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
  } = useAsyncMutation<ICalendarRange, TCalendarItemResponse[]>(loadCalendarItems);

  const reload = useCallback(() => {
    loadItems({ from, to }).catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  }, [from, loadItems, to]);

  useEffect(() => {
    reload();
  }, [reload]);

  const items = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  return {
    error,
    isLoading: isIdle || isLoading,
    items,
    reload,
  };
};
