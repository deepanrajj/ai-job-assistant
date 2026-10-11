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

/**
 * Dot and bar colours per status in the dashboard pipeline: the solid
 * shade of each status pill's colour family (`statusPillClasses`), so a
 * status looks the same in the pipeline and in its pill. They only support
 * the printed counts, so they need no text contrast.
 */
export const pipelineStatusColorClasses: Record<TJobStatus, string> = {
  WISHLIST: 'bg-slate-400',
  APPLIED: 'bg-primary-500',
  INTERVIEW: 'bg-warning-500',
  OFFER: 'bg-success-500',
  REJECTED: 'bg-danger-500',
  WITHDRAWN: 'bg-zinc-400',
};
