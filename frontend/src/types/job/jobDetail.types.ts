import type { TJob } from './job.types';

/**
 * Supported tab ids for the job detail page.
 */
export type TJobDetailTab =
  | 'overview'
  | 'tasks'
  | 'notes'
  | 'contacts'
  | 'documents'
  | 'reminders'
  | 'timeline'
  | 'ai';

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
 * Supported kinds of application document.
 */
export type TJobDocumentType = 'CV' | 'COVER_LETTER' | 'PORTFOLIO' | 'OTHER';

/**
 * Maps each document type to its translation resource key.
 */
export const DOCUMENT_TYPE_TRANSLATION_KEYS: Record<TJobDocumentType, string> = {
  CV: 'documentType.cv',
  COVER_LETTER: 'documentType.coverLetter',
  PORTFOLIO: 'documentType.portfolio',
  OTHER: 'documentType.other',
};

/**
 * Represents one application document's metadata: which CV, cover letter,
 * or portfolio piece went with a job, and when. `title` is the version
 * label. `url`, `submittedAt` (a `YYYY-MM-DD` date), and `notes` are
 * optional; an unset `submittedAt` means the document has not been sent.
 * No file content is stored.
 */
export type TJobDocument = {
  id: string;
  type: TJobDocumentType;
  title: string;
  url?: string;
  submittedAt?: string;
  notes?: string;
};

/**
 * Supported kinds of reminder a user sets by hand. A task's due date is
 * also a reminder, but it has no type of its own (see `TReminderItem`).
 */
export type TJobReminderType = 'FOLLOW_UP' | 'INTERVIEW_PREP' | 'APPLICATION_DEADLINE' | 'OTHER';

/**
 * Maps each reminder type to its translation resource key.
 */
export const REMINDER_TYPE_TRANSLATION_KEYS: Record<TJobReminderType, string> = {
  FOLLOW_UP: 'reminderType.followUp',
  INTERVIEW_PREP: 'reminderType.interviewPrep',
  APPLICATION_DEADLINE: 'reminderType.applicationDeadline',
  OTHER: 'reminderType.other',
};

/**
 * Where a reminder comes from: a stored reminder the user set, or a task
 * whose due date makes it one. Task reminders are derived on every read
 * and never stored, so they cannot drift from the task.
 */
export type TReminderSource = 'REMINDER' | 'TASK';

/**
 * One reminder as every screen renders it, whichever source it came from.
 * `type` is null for a task reminder. `dueDate` is a date-only
 * `YYYY-MM-DD` string.
 */
export type TReminderItem = {
  id: string;
  jobId: string;
  source: TReminderSource;
  type: TJobReminderType | null;
  title: string;
  dueDate: string;
  isComplete: boolean;
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
