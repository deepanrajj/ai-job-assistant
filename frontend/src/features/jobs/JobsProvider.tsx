import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

import { JobsContext } from './JobsContext';
import {
  addStoredJob,
  addStoredJobNote,
  addStoredJobTask,
  deleteStoredJob,
  deleteStoredJobNote,
  deleteStoredJobTask,
  readStoredJobs,
  saveStoredJobAiAnalysis,
  updateStoredJob,
  updateStoredJobNote,
  updateStoredJobStatus,
  updateStoredJobTask,
  writeStoredJobs,
} from './jobsStore.utils';
import type { TJob, TJobAiAnalysis, TJobDetail, TJobStatus } from '../../types';
import type { IJobsContextValue, IJobsProviderProps, IUpdateJobTaskInput } from './jobsStore.types';

/**
 * localStorage key used to persist frontend-only job tracker data.
 */
const JOBS_STORAGE_KEY = 'smart-job-tracker-jobs';

/**
 * Provides localStorage-backed saved job state to the frontend.
 *
 * @param {IJobsProviderProps} props Component props.
 * @returns {JSX.Element} Jobs context provider.
 */
export const JobsProvider: FC<IJobsProviderProps> = ({ children }) => {
  const [jobs, setJobs] = useState<TJobDetail[]>(() =>
    readStoredJobs(window.localStorage, JOBS_STORAGE_KEY),
  );

  useEffect(() => {
    writeStoredJobs(window.localStorage, JOBS_STORAGE_KEY, jobs);
  }, [jobs]);

  const createJob = useCallback((job: TJob) => {
    setJobs((currentJobs) => addStoredJob(currentJobs, job));
  }, []);

  const updateJob = useCallback((job: TJob) => {
    setJobs((currentJobs) => updateStoredJob(currentJobs, job));
  }, []);

  const deleteJob = useCallback((jobId: string) => {
    setJobs((currentJobs) => deleteStoredJob(currentJobs, jobId));
  }, []);

  const updateJobStatus = useCallback((jobId: string, status: TJobStatus) => {
    setJobs((currentJobs) => updateStoredJobStatus(currentJobs, jobId, status));
  }, []);

  const createTask = useCallback((jobId: string, title: string, dueDate: string) => {
    setJobs((currentJobs) => addStoredJobTask(currentJobs, jobId, title, dueDate));
  }, []);

  const updateTask = useCallback((jobId: string, taskId: string, input: IUpdateJobTaskInput) => {
    setJobs((currentJobs) => updateStoredJobTask(currentJobs, jobId, taskId, input));
  }, []);

  const deleteTask = useCallback((jobId: string, taskId: string) => {
    setJobs((currentJobs) => deleteStoredJobTask(currentJobs, jobId, taskId));
  }, []);

  const createNote = useCallback((jobId: string, body: string) => {
    setJobs((currentJobs) => addStoredJobNote(currentJobs, jobId, body));
  }, []);

  const updateNote = useCallback((jobId: string, noteId: string, body: string) => {
    setJobs((currentJobs) => updateStoredJobNote(currentJobs, jobId, noteId, body));
  }, []);

  const deleteNote = useCallback((jobId: string, noteId: string) => {
    setJobs((currentJobs) => deleteStoredJobNote(currentJobs, jobId, noteId));
  }, []);

  const saveJobAiAnalysis = useCallback((jobId: string, analysis: TJobAiAnalysis) => {
    setJobs((currentJobs) => saveStoredJobAiAnalysis(currentJobs, jobId, analysis));
  }, []);

  const value = useMemo<IJobsContextValue>(
    () => ({
      createJob,
      createNote,
      createTask,
      deleteJob,
      deleteNote,
      deleteTask,
      jobs,
      saveJobAiAnalysis,
      updateJob,
      updateJobStatus,
      updateNote,
      updateTask,
    }),
    [
      createJob,
      createNote,
      createTask,
      deleteJob,
      deleteNote,
      deleteTask,
      jobs,
      saveJobAiAnalysis,
      updateJob,
      updateJobStatus,
      updateNote,
      updateTask,
    ],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
};
