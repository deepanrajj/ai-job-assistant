import type { TJobStatus } from '../../types';

/**
 * Job statuses shown in the dashboard status overview.
 */
export const dashboardStatusOrder: TJobStatus[] = [
  'WISHLIST',
  'APPLIED',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
];

/**
 * Job statuses excluded from the active application pipeline.
 */
export const inactiveJobStatuses: TJobStatus[] = ['REJECTED', 'WITHDRAWN'];

/**
 * Maximum number of jobs shown in recent dashboard activity.
 */
export const RECENT_JOBS_LIMIT = 4;
