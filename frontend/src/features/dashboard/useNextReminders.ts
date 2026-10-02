import { useCallback, useEffect, useMemo } from 'react';

import {
  getNextReminders,
  mapNextReminderResponseToReminderItem,
  type TNextReminderResponse,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';
import { NEXT_REMINDERS_LIMIT } from '../reminders/reminders.constants';
import type { TReminderItem } from '../../types';

/**
 * Next reminders state returned by useNextReminders.
 */
export interface INextRemindersState {
  error: AppError | null;
  isLoading: boolean;
  reload: () => void;
  reminders: TReminderItem[];
}

/**
 * Declared at module level so `mutate` keeps a stable identity, as
 * `useJobsList` relies on for its own effect.
 */
const loadNextReminders = (): Promise<TNextReminderResponse[]> =>
  getNextReminders(NEXT_REMINDERS_LIMIT);

/**
 * Loads the earliest open reminders across every job for the dashboard,
 * stored and task-derived alike, in one request.
 *
 * Kept apart from `useJobsList` so a failure here is reported on the
 * reminders card alone and the job metrics stay on screen.
 *
 * @returns {INextRemindersState} Mapped reminders, load error, loading flag, and retry.
 */
export const useNextReminders = (): INextRemindersState => {
  const {
    mutate: loadReminders,
    request: { data, error, isIdle, isLoading },
  } = useAsyncMutation<void, TNextReminderResponse[]>(loadNextReminders);

  const reload = useCallback(() => {
    loadReminders().catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  }, [loadReminders]);

  useEffect(() => {
    reload();
  }, [reload]);

  const reminders = useMemo(
    () => (Array.isArray(data) ? data.map(mapNextReminderResponseToReminderItem) : []),
    [data],
  );

  return {
    error,
    isLoading: isIdle || isLoading,
    reload,
    reminders,
  };
};
