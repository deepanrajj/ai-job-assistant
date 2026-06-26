import type { TJob } from './job.types';

/**
 * Supported tab ids for the job detail page.
 */
export type TJobDetailTab = 'overview' | 'tasks' | 'notes' | 'timeline' | 'ai';

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
  'description' | 'jobUrl' | 'location' | 'nextStep' | 'salaryMax' | 'salaryMin'
> & {
  description: string;
  jobUrl: string;
  location: string;
  nextStep: string;
  salaryMax: number;
  salaryMin: number;
  aiInsights: TJobAiInsights;
  notes: TJobNote[];
  tasks: TJobTask[];
  timeline: TJobTimelineEvent[];
};
