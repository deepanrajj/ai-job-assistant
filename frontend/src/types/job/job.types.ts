/**
 * Supported lifecycle statuses for a tracked job opportunity.
 */
export type TJobStatus = 'WISHLIST' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';

/**
 * Supported places a tracked job opportunity can have come from.
 */
export type TJobSource =
  | 'LINKEDIN'
  | 'INDEED'
  | 'XING'
  | 'COMPANY_WEBSITE'
  | 'AI_SEARCH'
  | 'REFERRAL'
  | 'OTHER';

/**
 * Represents a job opportunity tracked by the application.
 */
export type TJob = {
  id: string;
  company: string;
  roleTitle: string;
  location?: string;
  status: TJobStatus;
  source?: TJobSource;
  jobUrl?: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
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

/**
 * Maps each job source to its translation resource key.
 */
export const JOB_SOURCE_TRANSLATION_KEYS: Record<TJobSource, string> = {
  LINKEDIN: 'jobSource.linkedin',
  INDEED: 'jobSource.indeed',
  XING: 'jobSource.xing',
  COMPANY_WEBSITE: 'jobSource.companyWebsite',
  AI_SEARCH: 'jobSource.aiSearch',
  REFERRAL: 'jobSource.referral',
  OTHER: 'jobSource.other',
};
