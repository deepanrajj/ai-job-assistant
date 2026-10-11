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
