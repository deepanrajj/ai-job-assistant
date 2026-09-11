import { useEffect, useMemo } from 'react';

import { getJobs, mapJobResponseToJob } from '../../services';
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
}

/**
 * Loads the saved jobs list from the backend on mount.
 *
 * Wraps `useAsyncMutation` rather than adding a query hook. Three details
 * of that hook shape this one: `mutate` keeps a stable identity because
 * `getJobs` is a module-level import, so the effect runs once; `mutate`
 * rethrows after recording the error, so the rejection has to be caught
 * here; and its initial status is `idle`, which is reported as loading so
 * the table does not flash empty before the request starts.
 *
 * @returns {IJobsListState} Mapped jobs, load error, and loading flag.
 */
export const useJobsList = (): IJobsListState => {
  const {
    mutate: loadJobs,
    request: { data, error, isIdle, isLoading },
  } = useAsyncMutation(getJobs);

  useEffect(() => {
    loadJobs(undefined).catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  }, [loadJobs]);

  const jobs = useMemo(() => (data ?? []).map(mapJobResponseToJob), [data]);

  return {
    error,
    isLoading: isIdle || isLoading,
    jobs,
  };
};
