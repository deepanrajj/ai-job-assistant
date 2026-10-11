import type { TJob, TJobStatus, TReminderItem } from '../../types';

/**
 * Stores the number of jobs assigned to every supported status.
 */
export type TJobStatusCounts = Record<TJobStatus, number>;

/**
 * Represents the derived job data displayed by the dashboard.
 */
export interface IDashboardData {
  activeJobCount: number;
  recentJobs: TJob[];
  statusCounts: TJobStatusCounts;
  totalJobCount: number;
}

/**
 * Where a reminder falls relative to the current week.
 */
export type TReminderGroupKind = 'day' | 'later' | 'overdue';

/**
 * Reminders that share a group on the dashboard's weekly agenda. `date` is
 * the `YYYY-MM-DD` day for `day` groups and null otherwise.
 */
export interface IReminderGroup {
  date: string | null;
  kind: TReminderGroupKind;
  reminders: TReminderItem[];
}

/**
 * What status history says about the recent jobs: each one's recorded
 * application date, and the jobs withdrawn straight from WISHLIST, which
 * were never applied for (see `getJobsWithdrawnFromWishlist`).
 */
export interface IRecentApplications {
  appliedDates: Map<string, Date>;
  withdrawnFromWishlist: Set<string>;
}
