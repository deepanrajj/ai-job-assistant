import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
 * Options for useMoveJobStatus.
 */
interface IMoveJobStatusOptions {
  /** Called after each saved move, such as to reload what depends on status. */
  onMoved?: () => void;
}

/**
 * Turns a failed move's error into an `AppError` the board can show.
 *
 * @param {unknown} caught What the request rejected with.
 * @returns {AppError} The error to report.
 */
const toMoveError = (caught: unknown): AppError =>
  caught instanceof AppError
    ? caught
    : new AppError(getJobFallbackErrorMessage('updateJob'), APP_ERROR_CODES.JOB_REQUEST_FAILED);

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
 * - **Order.** Moves of one job are sent one after another, each once the
 *   previous one settles, so the server applies them in the order they
 *   were made and ends on the last one. Moves of different jobs run side
 *   by side.
 * - **Display.** A moved job shows its new status at once and takes the
 *   saved job from the response of its latest move. A failure of the
 *   latest move restores the job as last saved, or as loaded if no move
 *   of it has saved yet.
 * - **Reloads.** Moves are forgotten whenever `jobs` itself changes, such
 *   as after a reload, and a move still in flight then is ignored when it
 *   settles, so fresher data from the server always wins.
 *
 * @param {TJob[]} jobs Jobs as loaded.
 * @param {IMoveJobStatusOptions} options Optional callbacks.
 * @returns {IMoveJobStatusState} Jobs with moves applied, the latest move, and the move trigger.
 */
export const useMoveJobStatus = (
  jobs: TJob[],
  { onMoved }: IMoveJobStatusOptions = {},
): IMoveJobStatusState => {
  const [moved, setMoved] = useState<Map<string, TJob>>(() => new Map());
  const [lastMove, setLastMove] = useState<IJobStatusMove | null>(null);
  const [loadedJobs, setLoadedJobs] = useState(jobs);
  const jobsRef = useRef(jobs);
  const latestRequestByJob = useRef(new Map<string, number>());
  const savedJobById = useRef(new Map<string, TJob>());
  const queueByJob = useRef(new Map<string, Promise<void>>());
  const requestCounter = useRef(0);
  const onMovedRef = useRef(onMoved);

  // Adjusted during render, React's pattern for resetting state on a prop
  // change: an effect would show the stale moves for one extra render.
  if (loadedJobs !== jobs) {
    setLoadedJobs(jobs);
    setMoved(new Map());
  }

  // Refs are written in effects, not during render (`react-hooks/refs`).
  useEffect(() => {
    jobsRef.current = jobs;
    latestRequestByJob.current.clear();
    savedJobById.current.clear();
  }, [jobs]);

  useEffect(() => {
    onMovedRef.current = onMoved;
  }, [onMoved]);

  const setMovedJob = useCallback((job: TJob) => {
    setMoved((current) => new Map(current).set(job.id, job));
  }, []);

  const moveJob = useCallback(
    (job: TJob, status: TJobStatus) => {
      requestCounter.current += 1;
      const requestId = requestCounter.current;
      const loadedAtStart = jobsRef.current;

      latestRequestByJob.current.set(job.id, requestId);
      if (!savedJobById.current.has(job.id)) savedJobById.current.set(job.id, job);
      setMovedJob({ ...job, status });
      setLastMove({ company: job.company, error: null, jobId: job.id, status });

      // Still the latest move of this job, and its jobs have not reloaded.
      const isCurrent = () =>
        jobsRef.current === loadedAtStart && latestRequestByJob.current.get(job.id) === requestId;

      const send = async () => {
        try {
          const response = await updateJob(job.id, mapJobToUpdateRequest({ ...job, status }));

          // The body is cast, not validated: a 2xx without a job is a failure.
          if (!response?.id)
            throw new AppError(
              getJobFallbackErrorMessage('updateJob'),
              APP_ERROR_CODES.JOB_REQUEST_FAILED,
            );

          const savedJob = mapJobResponseToJob(response);

          if (jobsRef.current === loadedAtStart) savedJobById.current.set(job.id, savedJob);
          if (isCurrent()) setMovedJob(savedJob);
          onMovedRef.current?.();
        } catch (caught) {
          if (!isCurrent()) return;

          setMovedJob(savedJobById.current.get(job.id) ?? job);
          setLastMove({
            company: job.company,
            error: toMoveError(caught),
            jobId: job.id,
            status,
          });
        }
      };

      const queued = (queueByJob.current.get(job.id) ?? Promise.resolve()).then(send);

      queueByJob.current.set(job.id, queued);

      return queued;
    },
    [setMovedJob],
  );

  const displayedJobs = useMemo(() => jobs.map((job) => moved.get(job.id) ?? job), [jobs, moved]);

  return { jobs: displayedJobs, lastMove, moveJob };
};
