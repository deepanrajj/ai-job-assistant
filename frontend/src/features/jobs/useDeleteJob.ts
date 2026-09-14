import { deleteJob } from '../../services';
import { useAsyncMutation } from '../../hooks';
import type { AppError } from '../../errors';

/**
 * Job deletion state returned by useDeleteJob.
 */
export interface IDeleteJobState {
  deleteJob: (jobId: string) => Promise<void>;
  error: AppError | null;
  isDeleting: boolean;
}

/**
 * Deletes a job through the backend and reports the request state.
 *
 * `deleteJob` from the service layer is passed straight to
 * `useAsyncMutation`: it already takes the one argument the mutation
 * callback passes and its identity is a module-level import, so the
 * returned trigger stays stable across renders.
 *
 * There is deliberately no guard on the resolved value, unlike
 * `useCreateJob` and `useUpdateJob`. Those two reject a 2xx that carries no
 * entity, because a create or an update that answers with nothing has not
 * told the caller what it did. `DELETE /api/jobs/{id}` answers 204 with no
 * body by contract, so the same guard would reject every successful delete.
 *
 * `deleteJob` rejects when the request fails, after the error is recorded,
 * so callers have to catch for the same reason they do elsewhere in this
 * feature: an uncaught rejection surfaces as an unhandled one while the
 * error renders correctly from `error`.
 *
 * A 404 is reported as the failure it is. Whether an already-absent job
 * counts as success is the caller's question, and `JobDetailPage` answers
 * it with `isJobNotFoundError`; a bulk action might answer differently.
 *
 * @returns {IDeleteJobState} Delete trigger, delete error, and in-flight flag.
 */
export const useDeleteJob = (): IDeleteJobState => {
  const {
    mutate: sendDelete,
    request: { error, isLoading },
  } = useAsyncMutation<string, void>(deleteJob);

  return {
    deleteJob: sendDelete,
    error,
    isDeleting: isLoading,
  };
};
