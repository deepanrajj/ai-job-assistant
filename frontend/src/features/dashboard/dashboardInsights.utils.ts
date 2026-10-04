import type { TJob } from '../../types';
import type {
  IAgingApplication,
  IDashboardInsights,
  IRecordedApplication,
} from './dashboardInsights.types';
import type { TTimelineEventResponse } from '../../services';

const DAYS_PER_WEEK = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Number of aging applications the dashboard lists.
 */
export const AGING_APPLICATIONS_LIMIT = 5;

/**
 * Returns local midnight of `date`'s calendar day, `offsetDays` later.
 * Built from the local year, month, and day, so a daylight-saving change
 * in between moves neither midnight.
 *
 * @param {Date} date Any moment on the starting day.
 * @param {number} offsetDays Calendar days to add; may be negative.
 * @returns {Date} Local midnight of the resulting day.
 */
const getLocalMidnight = (date: Date, offsetDays = 0): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsetDays);

/**
 * Returns the current Monday-to-Monday week in the browser's timezone: local
 * midnight on the most recent Monday, and local midnight seven calendar days
 * later, which is exclusive.
 *
 * @param {Date} now The current moment.
 * @returns {{ start: Date; end: Date }} Week start (inclusive) and end (exclusive).
 */
export const getLocalWeek = (now: Date): { end: Date; start: Date } => {
  const daysSinceMonday = (now.getDay() + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK;
  const start = getLocalMidnight(now, -daysSinceMonday);

  return { end: getLocalMidnight(start, DAYS_PER_WEEK), start };
};

/**
 * Counts the local calendar days from `from` to `to`. Compares the two local
 * dates as UTC dates, so the answer is a whole number even when a
 * daylight-saving change makes the elapsed time 23 or 25 hours a day.
 *
 * @param {Date} from Earlier moment.
 * @param {Date} to Later moment.
 * @returns {number} Whole local calendar days between the two dates.
 */
export const getLocalCalendarDayDifference = (from: Date, to: Date): number =>
  Math.round(
    (Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
      Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
      MILLISECONDS_PER_DAY,
  );

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
 * Derives every dashboard insight from saved jobs and their recorded status
 * history. Pure: the same inputs and `now` always give the same result.
 *
 * - Applications this week: distinct jobs whose recorded application falls
 *   in the current local week.
 * - Interview rate: of every job with a recorded application, those with a
 *   recorded INTERVIEW transition at or after it, whatever their status is
 *   now. `null` when no job has a recorded application.
 * - Aging applications: jobs still in APPLIED, oldest application first,
 *   aged in local calendar days.
 *
 * A job past WISHLIST with no recorded application has an unknown
 * application date; it is counted apart rather than given a guessed one.
 *
 * @param {TJob[]} jobs Saved jobs.
 * @param {TTimelineEventResponse[]} events Complete status history across every job.
 * @param {Date} now The current moment.
 * @returns {IDashboardInsights} Dashboard insights.
 */
export const getDashboardInsights = (
  jobs: TJob[],
  events: TTimelineEventResponse[],
  now: Date,
): IDashboardInsights => {
  const applications = getRecordedApplications(jobs, events);
  const week = getLocalWeek(now);
  const isUnknownApplication = (job: TJob): boolean =>
    job.status !== 'WISHLIST' && !applications.has(job.id);

  const applicationsThisWeek = [...applications.values()].filter(
    ({ appliedAt }) => appliedAt >= week.start && appliedAt < week.end,
  ).length;

  const interviewedJobIds = new Set(
    events
      .filter((event) => {
        const application = applications.get(event.jobId);

        return (
          application !== undefined &&
          event.nextStatus === 'INTERVIEW' &&
          new Date(event.createdAt) >= application.appliedAt
        );
      })
      .map((event) => event.jobId),
  );

  const agingApplications: IAgingApplication[] = [...applications.values()]
    .filter(({ job }) => job.status === 'APPLIED')
    .sort((left, right) => left.appliedAt.getTime() - right.appliedAt.getTime())
    .map(({ appliedAt, job }) => ({
      ageDays: getLocalCalendarDayDifference(appliedAt, now),
      job,
    }));

  return {
    agingApplications: {
      items: agingApplications.slice(0, AGING_APPLICATIONS_LIMIT),
      total: agingApplications.length,
      unknownDateCount: jobs.filter((job) => job.status === 'APPLIED' && isUnknownApplication(job))
        .length,
    },
    applicationsThisWeek: {
      count: applicationsThisWeek,
      unknownDateCount: jobs.filter(isUnknownApplication).length,
      weekEnd: week.end,
      weekStart: week.start,
    },
    interviewRate: {
      cohortSize: applications.size,
      interviewed: interviewedJobIds.size,
      rate: applications.size === 0 ? null : interviewedJobIds.size / applications.size,
    },
  };
};
