import { useCallback, useRef, useState } from 'react';

import { useUpdateJob } from './useUpdateJob';
import type { AppError } from '../../errors';
import type { TJobDetail, TJobStatus } from '../../types';

/**
 * Job status change state returned by useJobStatus.
 */
export interface IJobStatusState {
  changeStatus: (job: TJobDetail, status: TJobStatus) => Promise<void>;
  error: AppError | null;
  isChanging: boolean;
  optimisticStatus: TJobStatus | null;
}

/**
 * Changes a job's status against the backend, optimistically.
 *
 * `PUT /api/jobs/{id}` replaces every editable field, so `changeStatus`
 * sends the job's other fields unchanged alongside the new status - the
 * same full-replace shape `EditJobForm` already sends - but shows the new
 * status immediately rather than waiting for the round trip.
 *
 * A failed request restores whichever status this hook was showing before
 * that call, not necessarily the job's originally loaded status: a second
 * change can start before the first one's rejection is observed, and
 * rolling all the way back to the loaded value would regress past an
 * already-successful first change. The select is never disabled while a
 * change is in flight (Decision 5), so a second change can also *resolve*
 * before the first one does - a request-id guard makes sure only the
 * most recently started call's failure ever rolls anything back, so an
 * earlier call's late rejection cannot clobber a newer call's already
 * confirmed status.
 *
 * @param {string} jobId Job identifier. Resets the optimistic status when
 * this changes, since `JobDetailPage` does not remount across a route
 * navigation to a different job's detail page.
 * @returns {IJobStatusState} Status-change trigger, its error, in-flight flag, and the optimistic status to render.
 */
export const useJobStatus = (jobId: string): IJobStatusState => {
  const { error, isSaving, saveJob } = useUpdateJob();
  const [optimisticStatus, setOptimisticStatus] = useState<TJobStatus | null>(null);
  const requestIdRef = useRef(0);

  /**
   * Resets the optimistic status when `jobId` changes, adjusted during
   * render rather than in an effect (React's own recommended pattern for
   * this): an effect would commit the stale status for one extra render
   * before clearing it, which is exactly the cross-job leak this guards
   * against.
   */
  const [previousJobId, setPreviousJobId] = useState(jobId);

  if (jobId !== previousJobId) {
    setPreviousJobId(jobId);
    setOptimisticStatus(null);
  }

  const changeStatus = useCallback(
    (job: TJobDetail, status: TJobStatus) => {
      const previousStatus = optimisticStatus;
      const requestId = requestIdRef.current + 1;

      requestIdRef.current = requestId;
      setOptimisticStatus(status);

      return saveJob({
        fields: {
          company: job.company,
          description: job.description,
          jobUrl: job.jobUrl,
          location: job.location,
          roleTitle: job.roleTitle,
          salaryMax: job.salaryMax,
          salaryMin: job.salaryMin,
          status,
        },
        jobId: job.id,
      }).then(
        () => {},
        (caught: AppError) => {
          // A newer change already started (and may have already
          // resolved) since this one did - restoring this call's own
          // previous status would clobber it. Only the most recently
          // started call's failure is allowed to roll anything back.
          if (requestIdRef.current === requestId) setOptimisticStatus(previousStatus);

          throw caught;
        },
      );
    },
    [optimisticStatus, saveJob],
  );

  return {
    changeStatus,
    error,
    isChanging: isSaving,
    optimisticStatus,
  };
};
