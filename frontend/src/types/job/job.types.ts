/**
 * Supported lifecycle statuses for a tracked job opportunity.
 */
export type TJobStatus = 'WISHLIST' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';

/**
 * Represents a job opportunity tracked by the application.
 */
export type TJob = {
  id: string;
  company: string;
  roleTitle: string;
  location?: string;
  status: TJobStatus;
  jobUrl?: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  tags: string[];
  nextStep?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Maps each job status to its translation resource key.
 */
export const JOB_STATUS_TRANSLATION_KEYS: Record<TJobStatus, string> = {
  WISHLIST: 'status.wishlist',
  APPLIED: 'status.applied',
  INTERVIEW: 'status.interview',
  OFFER: 'status.offer',
  REJECTED: 'status.rejected',
  WITHDRAWN: 'status.withdrawn',
};
