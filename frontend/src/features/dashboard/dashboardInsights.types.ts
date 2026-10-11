import type { TJob } from '../../types';

/**
 * A job's recorded application: the moment of its first transition into
 * APPLIED.
 */
export interface IRecordedApplication {
  appliedAt: Date;
  job: TJob;
}

/**
 * What status history says about applications, derived once and shared by
 * the insights and recent activity: each job's recorded application, and
 * the jobs withdrawn straight from WISHLIST, which were never applied for.
 */
export interface IApplicationHistory {
  applications: Map<string, IRecordedApplication>;
  withdrawnFromWishlist: Set<string>;
}

/**
 * Why a job has no recorded application date: it was never applied for
 * (still on the wishlist, or withdrawn straight from it), its history holds
 * no application, or the history is unavailable (loading or failed).
 */
export type TMissingApplicationReason = 'notApplied' | 'notRecorded' | 'unavailable';

/**
 * A job still in APPLIED, with how many local calendar days ago it applied.
 */
export interface IAgingApplication {
  ageDays: number;
  job: TJob;
}

/**
 * Every dashboard insight, as `getDashboardInsights` derives it.
 * `weekEnd` is exclusive: local midnight on the following Monday.
 * `lastWeekToDateCount` counts last week from its Monday through the same
 * weekday as today, so a week in progress is compared with the same span
 * of the week before rather than with all of it.
 * `interviewRate.rate` is null when no job has a recorded application, so
 * an empty cohort can never read as 0%.
 */
export interface IDashboardInsights {
  agingApplications: {
    items: IAgingApplication[];
    total: number;
    unknownDateCount: number;
  };
  applicationsThisWeek: {
    count: number;
    lastWeekToDateCount: number;
    unknownDateCount: number;
    weekEnd: Date;
    weekStart: Date;
  };
  interviewRate: {
    cohortSize: number;
    interviewed: number;
    rate: number | null;
  };
}
