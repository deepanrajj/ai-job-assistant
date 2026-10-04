import { useCallback, useEffect } from 'react';

import { getAllTimelineEvents, type TTimelineEventResponse } from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';

/**
 * Status history state returned by useStatusHistory. `events` is null
 * until every page has loaded, and stays null after a failure, so a
 * caller cannot compute from part of the history.
 */
export interface IStatusHistoryState {
  error: AppError | null;
  events: TTimelineEventResponse[] | null;
  isLoading: boolean;
  reload: () => void;
}

/**
 * Loads every job's complete status history for the dashboard insights,
 * apart from the jobs list, so a history failure leaves the job counts on
 * screen.
 *
 * @returns {IStatusHistoryState} Complete history or null, load error, loading flag, and retry.
 */
export const useStatusHistory = (): IStatusHistoryState => {
  const {
    mutate: loadHistory,
    request: { data, error, isIdle, isLoading },
  } = useAsyncMutation<void, TTimelineEventResponse[]>(getAllTimelineEvents);

  const reload = useCallback(() => {
    loadHistory().catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  }, [loadHistory]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    error,
    events: Array.isArray(data) ? data : null,
    isLoading: isIdle || isLoading,
    reload,
  };
};
