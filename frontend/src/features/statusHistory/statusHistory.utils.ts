import type { TJob } from '../../types';
import type {
  IApplicationHistory,
  IRecordedApplication,
  TMissingApplicationReason,
} from './statusHistory.types';
import type { TTimelineEventResponse } from '../../services';

/**
 * Orders events oldest first, using the id to break ties, so "first" means
 * the same event however the API ordered them.
 */
const byCreatedAtThenId = (left: TTimelineEventResponse, right: TTimelineEventResponse): number => {
  const timeDifference = Date.parse(left.createdAt) - Date.parse(right.createdAt);

  if (timeDifference !== 0) return timeDifference;

  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
};

/**
 * Finds each job's recorded application: its first transition into
 * APPLIED. Events for jobs that are not in `jobs` are ignored. A later,
 * repeated APPLIED transition never replaces the first, and edits that do
 * not change the status record no event, so neither can move the date.
 *
 * @param {TJob[]} jobs Saved jobs.
 * @param {TTimelineEventResponse[]} events Status history across every job.
 * @returns {Map<string, IRecordedApplication>} Recorded application by job id.
 */
export const getRecordedApplications = (
  jobs: TJob[],
  events: TTimelineEventResponse[],
): Map<string, IRecordedApplication> => {
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const applications = new Map<string, IRecordedApplication>();

  for (const event of [...events].sort(byCreatedAtThenId)) {
    const job = jobsById.get(event.jobId);

    if (!job || event.nextStatus !== 'APPLIED' || applications.has(job.id)) continue;

    applications.set(job.id, { appliedAt: new Date(event.createdAt), job });
  }

  return applications;
};

/**
 * Finds jobs that are WITHDRAWN now and got there straight from WISHLIST:
 * their latest status change is WISHLIST -> WITHDRAWN. That history is
 * evidence the user dropped the job before applying, so it is not an
 * application with an unknown date.
 *
 * Deliberately narrow. A job saved directly as WITHDRAWN has no history
 * and may have been applied for outside the tracker, and a job that moved
 * on again after the withdrawal is judged by its later history; both stay
 * unknown.
 *
 * @param {TJob[]} jobs Saved jobs.
 * @param {TTimelineEventResponse[]} events Status history across every job.
 * @returns {Set<string>} Ids of jobs withdrawn straight from WISHLIST.
 */
export const getJobsWithdrawnFromWishlist = (
  jobs: TJob[],
  events: TTimelineEventResponse[],
): Set<string> => {
  const latestEventByJob = new Map<string, TTimelineEventResponse>();

  for (const event of [...events].sort(byCreatedAtThenId)) latestEventByJob.set(event.jobId, event);

  return new Set(
    jobs
      .filter((job) => {
        const latest = latestEventByJob.get(job.id);

        return (
          job.status === 'WITHDRAWN' &&
          latest?.previousStatus === 'WISHLIST' &&
          latest.nextStatus === 'WITHDRAWN'
        );
      })
      .map((job) => job.id),
  );
};

/**
 * Derives the application facts the dashboard reads from status history,
 * so the insights and recent activity share one derivation.
 *
 * @param {TJob[]} jobs Saved jobs.
 * @param {TTimelineEventResponse[]} events Status history across every job.
 * @returns {IApplicationHistory} Recorded applications and wishlist withdrawals.
 */
export const getApplicationHistory = (
  jobs: TJob[],
  events: TTimelineEventResponse[],
): IApplicationHistory => ({
  applications: getRecordedApplications(jobs, events),
  withdrawnFromWishlist: getJobsWithdrawnFromWishlist(jobs, events),
});

/**
 * Explains a job's missing application date, the same way wherever such a
 * date is shown.
 *
 * @param {TJob} job Job without a recorded application date.
 * @param {IApplicationHistory | null} history Application history, or null while unavailable.
 * @returns {TMissingApplicationReason} Why the date is missing.
 */
export const getMissingApplicationReason = (
  job: TJob,
  history: IApplicationHistory | null,
): TMissingApplicationReason => {
  if (job.status === 'WISHLIST' || history?.withdrawnFromWishlist.has(job.id)) return 'notApplied';

  return history ? 'notRecorded' : 'unavailable';
};
