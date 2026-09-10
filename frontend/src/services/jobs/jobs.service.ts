import { deleteJson, getJson, postJson, putJson } from '../api';
import { getJobFallbackErrorMessage } from './jobs.utils';
import { APP_ERROR_CODES } from '../../types';
import type { TCreateJobRequest, TJobResponse, TUpdateJobRequest } from './jobs.types';

const JOBS_ENDPOINT = '/api/jobs';

/**
 * Builds the endpoint URL for a single job.
 *
 * @param {string} id Job identifier.
 * @returns {string} Endpoint URL for that job.
 */
const getJobEndpoint = (id: string): string => `${JOBS_ENDPOINT}/${id}`;

/**
 * Fetches every saved job, newest first.
 *
 * @returns {Promise<TJobResponse[]>} Saved jobs as the API returns them.
 */
export const getJobs = (): Promise<TJobResponse[]> =>
  getJson<TJobResponse[]>(JOBS_ENDPOINT, {
    errorCode: APP_ERROR_CODES.JOB_REQUEST_FAILED,
    fallbackErrorMessage: getJobFallbackErrorMessage('listJobs'),
  });

/**
 * Fetches a single saved job.
 *
 * @param {string} id Job identifier.
 * @returns {Promise<TJobResponse>} The requested job as the API returns it.
 */
export const getJobById = (id: string): Promise<TJobResponse> =>
  getJson<TJobResponse>(getJobEndpoint(id), {
    errorCode: APP_ERROR_CODES.JOB_REQUEST_FAILED,
    fallbackErrorMessage: getJobFallbackErrorMessage('getJob'),
  });

/**
 * Creates a job.
 *
 * @param {TCreateJobRequest} payload Job creation request body.
 * @returns {Promise<TJobResponse>} The created job, including its server-assigned id.
 */
export const createJob = (payload: TCreateJobRequest): Promise<TJobResponse> =>
  postJson<TJobResponse, TCreateJobRequest>(JOBS_ENDPOINT, payload, {
    errorCode: APP_ERROR_CODES.JOB_REQUEST_FAILED,
    fallbackErrorMessage: getJobFallbackErrorMessage('createJob'),
  });

/**
 * Replaces every editable field on a saved job.
 *
 * @param {string} id Job identifier.
 * @param {TUpdateJobRequest} payload Complete replacement request body.
 * @returns {Promise<TJobResponse>} The updated job as the API returns it.
 */
export const updateJob = (id: string, payload: TUpdateJobRequest): Promise<TJobResponse> =>
  putJson<TJobResponse, TUpdateJobRequest>(getJobEndpoint(id), payload, {
    errorCode: APP_ERROR_CODES.JOB_REQUEST_FAILED,
    fallbackErrorMessage: getJobFallbackErrorMessage('updateJob'),
  });

/**
 * Deletes a saved job.
 *
 * The API answers 204 with no body, so this resolves to undefined.
 *
 * @param {string} id Job identifier.
 * @returns {Promise<void>} Resolves once the job is deleted.
 */
export const deleteJob = (id: string): Promise<void> =>
  deleteJson<void>(getJobEndpoint(id), {
    errorCode: APP_ERROR_CODES.JOB_REQUEST_FAILED,
    fallbackErrorMessage: getJobFallbackErrorMessage('deleteJob'),
  });
