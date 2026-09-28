import type { TJob } from './job.types';

/**
 * Supported tab ids for the job detail page.
 */
export type TJobDetailTab = 'overview' | 'tasks' | 'notes' | 'contacts' | 'timeline' | 'ai';

/**
 * Translation keys used by job detail tab labels.
 */
export type TJobDetailTabLabelKey = `jobDetail.tabs.${TJobDetailTab}`;

/**
 * Represents a tab item rendered by the job detail tabs.
 */
export interface IJobDetailTabConfig {
  id: TJobDetailTab;
  labelKey: TJobDetailTabLabelKey;
}

/**
 * Supported task statuses for a tracked job task.
 */
export type TJobTaskStatus = 'TODO' | 'DONE';

/**
 * Represents a task attached to a saved job.
 */
export type TJobTask = {
  id: string;
  title: string;
  dueDate: string;
  status: TJobTaskStatus;
};

/**
 * Represents a note attached to a saved job.
 */
export type TJobNote = {
  id: string;
  body: string;
  createdAt: string;
};

/**
 * Supported roles a contact can play for a saved job.
 */
export type TJobContactType = 'RECRUITER' | 'HIRING_MANAGER' | 'REFERRAL' | 'OTHER';

/**
 * Maps each contact type to its translation resource key.
 */
export const CONTACT_TYPE_TRANSLATION_KEYS: Record<TJobContactType, string> = {
  RECRUITER: 'contactType.recruiter',
  HIRING_MANAGER: 'contactType.hiringManager',
  REFERRAL: 'contactType.referral',
  OTHER: 'contactType.other',
};

/**
 * Represents a contact attached to a saved job: a recruiter, hiring
 * manager, referral, or anyone else connected to the job. `email`,
 * `phone`, `profileUrl`, `lastContactedAt`, and `notes` are optional;
 * `lastContactedAt` being unset means the contact has not been reached
 * yet.
 */
export type TJobContact = {
  id: string;
  type: TJobContactType;
  name: string;
  email?: string;
  phone?: string;
  profileUrl?: string;
  lastContactedAt?: string;
  notes?: string;
};

/**
 * Represents a timeline event for a saved job.
 */
export type TJobTimelineEvent = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};

/**
 * Represents saved AI insight data for a job detail page.
 */
export type TJobAiInsights = {
  summary: string;
  strengths: string[];
  gaps: string[];
};

/**
 * Represents the richer job data needed by the frontend job detail workflow.
 */
export type TJobDetail = Omit<
  TJob,
  'description' | 'jobUrl' | 'location' | 'salaryMax' | 'salaryMin'
> & {
  description: string;
  jobUrl: string;
  location: string;
  salaryMax: number;
  salaryMin: number;
  aiInsights: TJobAiInsights;
  contacts: TJobContact[];
  notes: TJobNote[];
  tasks: TJobTask[];
  timeline: TJobTimelineEvent[];
};
