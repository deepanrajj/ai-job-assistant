import type { TJob, TJobStatus } from '../../types';

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
