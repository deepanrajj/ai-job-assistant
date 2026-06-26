import type { ReactNode } from 'react';

import type { TJob, TJobAiAnalysis, TJobDetail, TJobStatus, TJobTaskStatus } from '../../types';

/**
 * Props used by the local jobs provider.
 */
export interface IJobsProviderProps {
  children: ReactNode;
}

/**
 * Represents fields that can be changed on a saved job task.
 */
export interface IUpdateJobTaskInput {
  dueDate?: string;
  status?: TJobTaskStatus;
  title?: string;
}

/**
 * Represents the local job tracker state and mutation actions.
 */
export interface IJobsContextValue {
  createJob: (job: TJob) => void;
  createNote: (jobId: string, body: string) => void;
  createTask: (jobId: string, title: string, dueDate: string) => void;
  deleteJob: (jobId: string) => void;
  deleteNote: (jobId: string, noteId: string) => void;
  deleteTask: (jobId: string, taskId: string) => void;
  jobs: TJobDetail[];
  saveJobAiAnalysis: (jobId: string, analysis: TJobAiAnalysis) => void;
  updateJob: (job: TJob) => void;
  updateJobStatus: (jobId: string, status: TJobStatus) => void;
  updateNote: (jobId: string, noteId: string, body: string) => void;
  updateTask: (jobId: string, taskId: string, input: IUpdateJobTaskInput) => void;
}
