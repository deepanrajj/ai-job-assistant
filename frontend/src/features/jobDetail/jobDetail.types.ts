import type { TJobAiAnalysis, TJobStatus, TJobTaskStatus } from '../../types';

/**
 * Represents one metadata item rendered in the job detail header.
 */
export interface IJobDetailMetadataItem {
  id: string;
  label: string;
  value: string;
}

/**
 * Represents job-level actions available from the job detail page.
 */
export interface IJobDetailPageActions {
  onAnalyzeJob?: (jobId: string, analysis: TJobAiAnalysis) => void;
  onCreateNote?: (jobId: string, body: string) => void;
  onDeleteJob?: (jobId: string) => void;
  onDeleteNote?: (jobId: string, noteId: string) => void;
  onStatusChange?: (jobId: string, status: TJobStatus) => void;
  onUpdateNote?: (jobId: string, noteId: string, body: string) => void;
}

/**
 * Represents fields that can be changed on a saved job task.
 */
export interface IUpdateJobTaskInput {
  dueDate?: string;
  status?: TJobTaskStatus;
  title?: string;
}
