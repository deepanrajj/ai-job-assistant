import type { TJobStatus } from '../../types';
import type { TStatusFilter } from './jobs.types';

/**
 * Status options available when creating or editing a job.
 */
export const jobStatusOptions = [
  'WISHLIST',
  'APPLIED',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
] as const satisfies readonly TJobStatus[];

/**
 * Status options shown in the jobs filter dropdown.
 */
export const statusOptions: TStatusFilter[] = ['ALL', ...jobStatusOptions];

/**
 * Tailwind class map for job status pills.
 */
export const statusPillClasses: Record<TJobStatus, string> = {
  WISHLIST: 'bg-slate-100 text-slate-700 ring-slate-200',
  APPLIED: 'bg-primary-50 text-primary-700 ring-primary-100',
  INTERVIEW: 'bg-warning-50 text-warning-800 ring-warning-100',
  OFFER: 'bg-success-50 text-success-700 ring-success-100',
  REJECTED: 'bg-danger-50 text-danger-700 ring-danger-100',
  WITHDRAWN: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
};
