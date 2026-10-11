import { useCallback, useMemo, useRef, useState } from 'react';

import {
  getJobFallbackErrorMessage,
  mapJobResponseToJob,
  mapJobToUpdateRequest,
  updateJob,
} from '../../services';
import { AppError } from '../../errors';
import { APP_ERROR_CODES, type TJob, type TJobStatus } from '../../types';

/**
 * The outcome of the latest status move, for the announcement and focus.
 */
export interface IJobStatusMove {
  company: string;
  error: AppError | null;
  jobId: string;
  status: TJobStatus;
}

/**
 * Job status moves returned by useMoveJobStatus.
 */
export interface IMoveJobStatusState {
  /** The jobs with every move applied, optimistically until it settles. */
  jobs: TJob[];
  lastMove: IJobStatusMove | null;
  moveJob: (job: TJob, status: TJobStatus) => Promise<void>;
}

/**
 * Moves jobs to another status from a list or board, optimistically.
 *
 * Each move sends the existing `PUT /api/jobs/{id}` with the job's other
 * fields unchanged, the same full-replace body `useJobStatus` sends from
 * job detail. It calls `updateJob` directly rather than through
 * `useUpdateJob`, whose single shared request discards an older response
 * when a newer one starts: two quick moves of different jobs would then
 * lose the first one's result.
 *
 * The moved job shows its new status at once and takes the saved job from
 * the response. A failure restores the job as it was before that move,
 * unless a newer move of the same job has started since. Moves are
 * forgotten whenever `jobs` itself changes, such as after a reload, so
 * fresher data from the server always wins.
 *
 * @param {TJob[]} jobs Jobs as loaded.
 * @returns {IMoveJobStatusState} Jobs with moves applied, the latest move, and the move trigger.
 */
export const useMoveJobStatus = (jobs: TJob[]): IMoveJobStatusState => {
  const [moved, setMoved] = useState<Map<string, TJob>>(() => new Map());
  const [lastMove, setLastMove] = useState<IJobStatusMove | null>(null);
  const [loadedJobs, setLoadedJobs] = useState(jobs);
  const latestRequestByJob = useRef(new Map<string, number>());
  const requestCounter = useRef(0);

  // Adjusted during render, React's pattern for resetting state on a prop
  // change: an effect would show the stale moves for one extra render.
  if (loadedJobs !== jobs) {
    setLoadedJobs(jobs);
    setMoved(new Map());
  }

  const setMovedJob = useCallback((job: TJob) => {
    setMoved((current) => new Map(current).set(job.id, job));
  }, []);

  const moveJob = useCallback(
    async (job: TJob, status: TJobStatus) => {
      requestCounter.current += 1;
      const requestId = requestCounter.current;

      latestRequestByJob.current.set(job.id, requestId);
      setMovedJob({ ...job, status });
      setLastMove({ company: job.company, error: null, jobId: job.id, status });

      const isLatest = () => latestRequestByJob.current.get(job.id) === requestId;

      try {
        const response = await updateJob(job.id, mapJobToUpdateRequest({ ...job, status }));

        // The body is cast, not validated: a 2xx without a job is a failure.
        if (!response?.id)
          throw new AppError(
            getJobFallbackErrorMessage('updateJob'),
            APP_ERROR_CODES.JOB_REQUEST_FAILED,
          );

        if (isLatest()) setMovedJob(mapJobResponseToJob(response));
      } catch (caught) {
        if (!isLatest()) return;

        setMovedJob(job);
        setLastMove({
          company: job.company,
          error:
            caught instanceof AppError
              ? caught
              : new AppError(
                  getJobFallbackErrorMessage('updateJob'),
                  APP_ERROR_CODES.JOB_REQUEST_FAILED,
                ),
          jobId: job.id,
          status,
        });
      }
    },
    [setMovedJob],
  );

  const displayedJobs = useMemo(() => jobs.map((job) => moved.get(job.id) ?? job), [jobs, moved]);

  return { jobs: displayedJobs, lastMove, moveJob };
};
