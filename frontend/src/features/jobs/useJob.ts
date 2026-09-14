import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  getJobById,
  getJobFallbackErrorMessage,
  mapJobResponseToJob,
  type TJobResponse,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import { AppError } from '../../errors';
import { APP_ERROR_CODES, type TJob } from '../../types';

/**
 * Job request state returned by useJob.
 */
export interface IJobState {
  error: AppError | null;
  isLoading: boolean;
  isNotFound: boolean;
  job: TJob | null;
  reload: () => void;
}

/**
 * Backend error codes that mean the route id does not name a job.
 *
 * `JOB_NOT_FOUND` is the job that does not exist. `INVALID_REQUEST_PARAMETER`
 * is the id that cannot be one: `GET /api/jobs/{id}` declares its path
 * variable as a UUID, so anything else fails conversion before the
 * controller runs. A stale link or an old localStorage id is exactly that,
 * and to the reader of the page both are the same answer.
 *
 * Matched on the code rather than the status because only the code says the
 * API meant it. A 404 from a proxy carries no code, and reading that as "no
 * such job" would report a request that never arrived as an answer.
 */
const MISSING_JOB_API_CODES = ['INVALID_REQUEST_PARAMETER', 'JOB_NOT_FOUND'];

/**
 * Checks whether a request failed because the job no longer exists.
 *
 * `JOB_NOT_FOUND` only, deliberately narrower than the loader's set. The
 * loader also accepts `INVALID_REQUEST_PARAMETER`, which on a GET can only be
 * the path id; a write carries a body, and that code would be the backend
 * rejecting the body rather than the id.
 *
 * The status is not consulted. A 404 the API did not send - a proxy, a
 * gateway - carries no code, and treating it as a deleted job would report
 * a request that never arrived as a completed one.
 *
 * @param {AppError | null} error Recorded job request error.
 * @returns {boolean} True when the API said the job does not exist.
 */
export const isJobNotFoundError = (error: AppError | null): boolean =>
  error?.apiCode === 'JOB_NOT_FOUND';

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
 * `reload` depends on `jobId`, so pointing a screen at another job issues a
 * new request and the request-id guard discards whichever response is stale.
 *
 * This returns the job as the API models it. `useJobDetail` widens the same
 * result for screens that render a `TJobDetail`; a screen that round-trips
 * values through a form wants this one, because the widening turns an absent
 * salary into a real zero.
 *
 * @param {string} jobId Job identifier from the route.
 * @returns {IJobState} Mapped job, request state, and retry.
 */
export const useJob = (jobId: string): IJobState => {
  const requestIdRef = useRef(0);
  const {
    mutate: loadJob,
    request: { data, error, isIdle, isLoading, setError },
  } = useAsyncMutation<string, TJobResponse>(getJobById);

  /**
   * The response body is cast, not validated, so a 2xx that carries no job
   * has to become a recorded error here. `parseJsonResponse` resolves a 204
   * as `undefined`, which would otherwise leave the caller with no job, no
   * error and nothing loading, rendering nothing at all. This is a load
   * failure rather than a missing job: the server answered that the job
   * exists and then sent none, and that is worth retrying. `useCreateJob`
   * guards its own response the same way.
   *
   * The request id is this hook's own, because `useAsyncMutation` applies its
   * guard only to the state it sets: `mutate` still resolves with a stale
   * response, so without this an abandoned request answering 204 would
   * report a failure over the request that replaced it.
   */
  const reload = useCallback(() => {
    const requestId = requestIdRef.current + 1;

    requestIdRef.current = requestId;

    loadJob(jobId)
      .then((response) => {
        if (requestId !== requestIdRef.current) return;

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

  const job = useMemo(() => (data?.id ? mapJobResponseToJob(data) : null), [data]);

  return {
    error,
    isLoading: isIdle || isLoading,
    isNotFound: error?.apiCode !== undefined && MISSING_JOB_API_CODES.includes(error.apiCode),
    job,
    reload,
  };
};
