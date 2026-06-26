import type { TJobAiAnalysis, TJobStatus } from '../../types';
import type { IUpdateJobTaskInput } from '../jobs/jobsStore.types';

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
  onCreateTask?: (jobId: string, title: string, dueDate: string) => void;
  onDeleteJob?: (jobId: string) => void;
  onDeleteNote?: (jobId: string, noteId: string) => void;
  onDeleteTask?: (jobId: string, taskId: string) => void;
  onStatusChange?: (jobId: string, status: TJobStatus) => void;
  onUpdateNote?: (jobId: string, noteId: string, body: string) => void;
  onUpdateTask?: (jobId: string, taskId: string, input: IUpdateJobTaskInput) => void;
}
