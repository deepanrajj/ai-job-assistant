import { useCallback, useEffect, useMemo } from 'react';

import {
  getJobById,
  getJobFallbackErrorMessage,
  mapJobResponseToJob,
  type TJobResponse,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import { mapJobToJobDetail } from './jobs.utils';
import { AppError } from '../../errors';
import { APP_ERROR_CODES, type TJobDetail } from '../../types';

/**
 * Job detail state returned by useJobDetail.
 */
export interface IJobDetailState {
  error: AppError | null;
  isLoading: boolean;
  isNotFound: boolean;
  job: TJobDetail | null;
  reload: () => void;
}

/**
 * Response statuses that mean the route id does not name a job.
 *
 * 404 is the job that does not exist. 400 is the id that cannot be one:
 * `GET /api/jobs/{id}` declares its path variable as a UUID, so anything
 * else fails conversion before the controller runs and comes back as
 * `INVALID_REQUEST_PARAMETER`. A stale link or an old localStorage id is
 * exactly that, and to the reader of the page both are the same answer.
 * The endpoint takes one parameter, so a 400 from it can only be the id.
 */
const NOT_FOUND_STATUSES = [400, 404];

/**
 * Loads one saved job from the backend and reports the request state.
 *
 * Wraps `useAsyncMutation` in the shape `useJobsList` established, so the
 * request-id guard and error recording are shared rather than rebuilt. Two
 * of that hook's details carry over: `mutate` keeps a stable identity
 * because `getJobById` is a module-level import, so the effect runs once per
 * id rather than on every render, and the initial `idle` status is reported
 * as loading so the first render does not show "not found" for a job whose
 * request has not started.
 *
 * `reload` depends on `jobId`, so pointing the page at another job issues a
 * new request and the request-id guard discards whichever response is stale.
 *
 * @param {string} jobId Job identifier from the route.
 * @returns {IJobDetailState} Mapped job, request state, and retry.
 */
export const useJobDetail = (jobId: string): IJobDetailState => {
  const {
    mutate: loadJob,
    request: { data, error, isIdle, isLoading, setError },
  } = useAsyncMutation<string, TJobResponse>(getJobById);

  /**
   * The response body is cast, not validated, so a 2xx that carries no job
   * has to become a recorded error here. `parseJsonResponse` resolves a 204
   * as `undefined`, which would otherwise leave the page with no job, no
   * error and nothing loading, rendering nothing at all. This is a load
   * failure rather than a missing job: the server answered that the job
   * exists and then sent none, and that is worth retrying. `useCreateJob`
   * guards its own response the same way.
   */
  const reload = useCallback(() => {
    loadJob(jobId)
      .then((response) => {
        if (!response?.id)
          setError(
            new AppError(getJobFallbackErrorMessage('getJob'), APP_ERROR_CODES.JOB_REQUEST_FAILED),
          );
      })
      .catch(() => {
        // Error is already recorded in request state and rendered from it.
      });
  }, [jobId, loadJob, setError]);

  useEffect(() => {
    reload();
  }, [reload]);

  const job = useMemo(
    () => (data?.id ? mapJobToJobDetail(mapJobResponseToJob(data)) : null),
    [data],
  );

  return {
    error,
    isLoading: isIdle || isLoading,
    isNotFound: error !== null && NOT_FOUND_STATUSES.includes(error.status ?? 0),
    job,
    reload,
  };
};
