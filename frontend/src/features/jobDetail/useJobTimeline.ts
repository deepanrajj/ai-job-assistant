import { useCallback, useEffect, useMemo } from 'react';

import {
  getTimelineEvents,
  mapTimelineEventResponseToJobTimelineEvent,
  type TTimelineEventResponse,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';
import type { TJobTimelineEvent } from '../../types';

/**
 * Job timeline state returned by useJobTimeline.
 */
export interface IJobTimelineState {
  events: TJobTimelineEvent[];
  isLoading: boolean;
  loadError: AppError | null;
  reload: () => void;
}

/**
 * Loads a job's timeline events from the backend.
 *
 * Read-only: unlike `useJobTasks`/`useJobNotes`, there is no write to
 * offer - the backend has no create, update, or delete route for timeline
 * events, so this only wraps `getTimelineEvents` the way the read half of
 * `useJob` wraps `getJobById`.
 *
 * @param {string} jobId Job identifier the timeline belongs to.
 * @returns {IJobTimelineState} Loaded timeline events, request state, and retry.
 */
export const useJobTimeline = (jobId: string): IJobTimelineState => {
  const {
    mutate: loadTimelineEvents,
    request: { data, error: loadError, isIdle, isLoading },
  } = useAsyncMutation<string, TTimelineEventResponse[]>(getTimelineEvents);

  const reload = useCallback(() => {
    loadTimelineEvents(jobId).catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  }, [jobId, loadTimelineEvents]);

  useEffect(() => {
    reload();
  }, [reload]);

  const events = useMemo(
    () => (Array.isArray(data) ? data.map(mapTimelineEventResponseToJobTimelineEvent) : []),
    [data],
  );

  return {
    events,
    isLoading: isIdle || isLoading,
    loadError,
    reload,
  };
};
