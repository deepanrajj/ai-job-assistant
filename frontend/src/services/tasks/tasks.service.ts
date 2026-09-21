import { deleteJson, getJson, postJson, putJson } from '../api';
import { getTaskFallbackErrorMessage } from './tasks.utils';
import { APP_ERROR_CODES } from '../../types';
import type { TCreateTaskRequest, TTaskResponse, TUpdateTaskRequest } from './tasks.types';

/**
 * Builds the endpoint URL for a job's tasks.
 *
 * The job id is encoded because it reaches this service from a route param,
 * and an unencoded one does not stay a path segment.
 *
 * @param {string} jobId Job identifier.
 * @returns {string} Endpoint URL for that job's tasks.
 */
const getTasksEndpoint = (jobId: string): string => `/api/jobs/${encodeURIComponent(jobId)}/tasks`;

/**
 * Builds the endpoint URL for a single task under a job.
 *
 * @param {string} jobId Job identifier.
 * @param {string} taskId Task identifier.
 * @returns {string} Endpoint URL for that task.
 */
const getTaskEndpoint = (jobId: string, taskId: string): string =>
  `${getTasksEndpoint(jobId)}/${encodeURIComponent(taskId)}`;

/**
 * Fetches a job's tasks, oldest first.
 *
 * @param {string} jobId Job identifier.
 * @returns {Promise<TTaskResponse[]>} Tasks as the API returns them.
 */
export const getTasks = (jobId: string): Promise<TTaskResponse[]> =>
  getJson<TTaskResponse[]>(getTasksEndpoint(jobId), {
    errorCode: APP_ERROR_CODES.TASK_REQUEST_FAILED,
    fallbackErrorMessage: getTaskFallbackErrorMessage('listTasks'),
  });

/**
 * Creates a task under a job.
 *
 * @param {string} jobId Job identifier.
 * @param {TCreateTaskRequest} payload Task creation request body.
 * @returns {Promise<TTaskResponse>} The created task, including its server-assigned id.
 */
export const createTask = (jobId: string, payload: TCreateTaskRequest): Promise<TTaskResponse> =>
  postJson<TTaskResponse, TCreateTaskRequest>(getTasksEndpoint(jobId), payload, {
    errorCode: APP_ERROR_CODES.TASK_REQUEST_FAILED,
    fallbackErrorMessage: getTaskFallbackErrorMessage('createTask'),
  });

/**
 * Replaces every editable field on a task.
 *
 * @param {string} jobId Job identifier.
 * @param {string} taskId Task identifier.
 * @param {TUpdateTaskRequest} payload Complete replacement request body.
 * @returns {Promise<TTaskResponse>} The updated task as the API returns it.
 */
export const updateTask = (
  jobId: string,
  taskId: string,
  payload: TUpdateTaskRequest,
): Promise<TTaskResponse> =>
  putJson<TTaskResponse, TUpdateTaskRequest>(getTaskEndpoint(jobId, taskId), payload, {
    errorCode: APP_ERROR_CODES.TASK_REQUEST_FAILED,
    fallbackErrorMessage: getTaskFallbackErrorMessage('updateTask'),
  });

/**
 * Deletes a task.
 *
 * The API answers 204 with no body, so this resolves to undefined.
 *
 * @param {string} jobId Job identifier.
 * @param {string} taskId Task identifier.
 * @returns {Promise<void>} Resolves once the task is deleted.
 */
export const deleteTask = (jobId: string, taskId: string): Promise<void> =>
  deleteJson<void>(getTaskEndpoint(jobId, taskId), {
    errorCode: APP_ERROR_CODES.TASK_REQUEST_FAILED,
    fallbackErrorMessage: getTaskFallbackErrorMessage('deleteTask'),
  });
