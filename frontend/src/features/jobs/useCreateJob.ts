import { useCallback } from 'react';

import {
  createJob,
  getJobFallbackErrorMessage,
  mapJobResponseToJob,
  mapJobToCreateRequest,
  type TJobFormPayload,
  type TJobResponse,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import { AppError } from '../../errors';
import { APP_ERROR_CODES, type TJob } from '../../types';

/**
 * Job creation state returned by useCreateJob.
 */
export interface ICreateJobState {
  error: AppError | null;
  isSaving: boolean;
  saveJob: (payload: TJobFormPayload) => Promise<TJob>;
}

/**
 * Posts editable job fields as a create request.
 *
 * Declared at module level so its identity is stable. `useAsyncMutation`
 * keys its `mutate` callback on the mutation function, so an inline arrow
 * would hand back a new `saveJob` on every render.
 *
 * @param {TJobFormPayload} payload Editable job fields.
 * @returns {Promise<TJobResponse>} The created job as the API returns it.
 */
const postJobFields = (payload: TJobFormPayload): Promise<TJobResponse> =>
  createJob(mapJobToCreateRequest(payload));

/**
 * Creates a job through the backend and reports the request state.
 *
 * `saveJob` rejects when the request fails, after `useAsyncMutation` has
 * already recorded the error. Callers therefore have to catch: a React Hook
 * Form submit handler that lets the rejection through gets rethrown by
 * `handleSubmit`, which surfaces as an unhandled rejection even though the
 * error renders correctly from `error`.
 *
 * Unlike `useJobsList`, the idle status is not reported as saving. Nothing
 * starts on mount here, so folding `isIdle` in would report a save in
 * flight before the user ever submitted.
 *
 * @returns {ICreateJobState} Save trigger, save error, and in-flight flag.
 */
export const useCreateJob = (): ICreateJobState => {
  const {
    mutate: postJob,
    request: { error, isLoading, setError },
  } = useAsyncMutation<TJobFormPayload, TJobResponse>(postJobFields);

  /**
   * The response body is cast, not validated, so a 2xx that carries no job
   * has to be turned into a recorded error here. `parseJsonResponse`
   * resolves a 204 as `undefined`, which would otherwise reach
   * `mapJobResponseToJob` and throw a bare TypeError past every error state,
   * leaving the submit silently doing nothing. `useJobsList` guards the
   * list response the same way.
   */
  const saveJob = useCallback(
    (payload: TJobFormPayload) =>
      postJob(payload).then((response) => {
        if (!response?.id) {
          const invalidResponseError = new AppError(
            getJobFallbackErrorMessage('createJob'),
            APP_ERROR_CODES.JOB_REQUEST_FAILED,
          );

          setError(invalidResponseError);

          throw invalidResponseError;
        }

        return mapJobResponseToJob(response);
      }),
    [postJob, setError],
  );

  return {
    error,
    isSaving: isLoading,
    saveJob,
  };
};
