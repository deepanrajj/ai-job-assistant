import { useCallback, useEffect, useMemo } from 'react';

import { getJobs, mapJobResponseToJob, type TJobResponse } from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';
import type { TJob } from '../../types';

/**
 * Jobs list state returned by useJobsList.
 */
export interface IJobsListState {
  error: AppError | null;
  isLoading: boolean;
  jobs: TJob[];
  reload: () => void;
}

/**
 * Loads the saved jobs list from the backend on mount.
 *
 * Wraps `useAsyncMutation` rather than adding a query hook. Three details
 * of that hook shape this one: `mutate` keeps a stable identity because
 * `getJobs` is a module-level import, so the effect body runs once per
 * mount; `mutate` rethrows after recording the error, so the rejection has
 * to be caught here; and its initial status is `idle`, which is reported as
 * loading so the table does not flash empty before the request starts.
 *
 * Under `StrictMode` React deliberately mounts, unmounts and remounts in
 * development, so two requests go out per page load. That is a development
 * behaviour rather than a loop: `useAsyncMutation` keeps its request id in a
 * ref that survives the remount and discards the stale response.
 *
 * `reload` reuses `mutate`, which sets `loading` immediately, so a retry
 * never parks in `idle`. Calling `reset` instead would, and `idle` is
 * reported as loading here, which would leave a spinner with no request.
 *
 * @returns {IJobsListState} Mapped jobs, load error, loading flag, and retry.
 */
export const useJobsList = (): IJobsListState => {
  const {
    mutate: loadJobs,
    request: { data, error, isIdle, isLoading },
  } = useAsyncMutation<void, TJobResponse[]>(getJobs);

  const reload = useCallback(() => {
    loadJobs().catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  }, [loadJobs]);

  useEffect(() => {
    reload();
  }, [reload]);

  /**
   * `Array.isArray` rather than a bare `map`: the response body is cast, not
   * validated, so a 2xx carrying an object would otherwise throw during
   * render and escape past this hook's own error state to the route error
   * boundary.
   */
  const jobs = useMemo(() => (Array.isArray(data) ? data.map(mapJobResponseToJob) : []), [data]);

  return {
    error,
    isLoading: isIdle || isLoading,
    jobs,
    reload,
  };
};
