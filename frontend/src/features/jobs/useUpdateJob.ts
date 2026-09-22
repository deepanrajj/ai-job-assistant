import { useCallback } from 'react';

import {
  getJobFallbackErrorMessage,
  mapJobResponseToJob,
  mapJobToUpdateRequest,
  updateJob,
  type TJobFormPayload,
  type TJobResponse,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import { AppError } from '../../errors';
import { APP_ERROR_CODES, type TJob } from '../../types';

/**
 * Arguments accepted by the job update mutation.
 */
export interface IUpdateJobInput {
  fields: TJobFormPayload;
  jobId: string;
}

/**
 * Job update state returned by useUpdateJob.
 */
export interface IUpdateJobState {
  error: AppError | null;
  isSaving: boolean;
  reset: () => void;
  saveJob: (input: IUpdateJobInput) => Promise<TJob>;
}

/**
 * Sends editable job fields as a full replacement of one job.
 *
 * Declared at module level so its identity is stable, as in `useCreateJob`:
 * `useAsyncMutation` keys its `mutate` callback on the mutation function, so
 * an inline arrow would hand back a new `saveJob` on every render. The id
 * and the fields travel together in one object because that callback passes
 * a single argument.
 *
 * @param {IUpdateJobInput} input Job id and the editable fields to write.
 * @returns {Promise<TJobResponse>} The updated job as the API returns it.
 */
const putJobFields = ({ fields, jobId }: IUpdateJobInput): Promise<TJobResponse> =>
  updateJob(jobId, mapJobToUpdateRequest(fields));

/**
 * Updates a job through the backend and reports the request state.
 *
 * `saveJob` rejects when the request fails, after `useAsyncMutation` has
 * already recorded the error, so callers have to catch for the same reason
 * they do in `useCreateJob`: React Hook Form's `handleSubmit` rethrows what
 * the handler rejects with, which surfaces as an unhandled rejection even
 * though the error renders correctly from `error`.
 *
 * @returns {IUpdateJobState} Save trigger, save error, in-flight flag, and a reset for callers that outlive one save's error, such as `useJobStatus`.
 */
export const useUpdateJob = (): IUpdateJobState => {
  const {
    mutate: putJob,
    request: { error, isLoading, reset, setError },
  } = useAsyncMutation<IUpdateJobInput, TJobResponse>(putJobFields);

  /**
   * The response body is cast, not validated, so a 2xx that carries no job
   * has to be turned into a recorded error here, exactly as `useCreateJob`
   * does. Without it a 204 would reach `mapJobResponseToJob` and throw past
   * every error state, leaving the save silently doing nothing.
   */
  const saveJob = useCallback(
    (input: IUpdateJobInput) =>
      putJob(input).then((response) => {
        if (!response?.id) {
          const invalidResponseError = new AppError(
            getJobFallbackErrorMessage('updateJob'),
            APP_ERROR_CODES.JOB_REQUEST_FAILED,
          );

          setError(invalidResponseError);

          throw invalidResponseError;
        }

        return mapJobResponseToJob(response);
      }),
    [putJob, setError],
  );

  return {
    error,
    isSaving: isLoading,
    reset,
    saveJob,
  };
};
