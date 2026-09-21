import type { TJobTaskStatus } from '../../types';

/**
 * Translation keys used for task service fallback errors.
 */
export const TASK_FALLBACK_ERROR_TRANSLATION_KEYS = {
  listTasks: 'tasks.fallbackError.listTasks',
  createTask: 'tasks.fallbackError.createTask',
  updateTask: 'tasks.fallbackError.updateTask',
  deleteTask: 'tasks.fallbackError.deleteTask',
} as const;

/**
 * Supported task fallback error lookup keys.
 */
export type TTaskFallbackErrorKey = keyof typeof TASK_FALLBACK_ERROR_TRANSLATION_KEYS;

/**
 * Wire representation of a task exactly as
 * `/api/jobs/{jobId}/tasks` returns it.
 *
 * Excludes `jobId`: every route already carries it in the path, so the
 * backend does not repeat it in the response body.
 */
export type TTaskResponse = {
  id: string;
  title: string;
  status: TJobTaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Request body accepted by `POST /api/jobs/{jobId}/tasks`.
 *
 * `status` is optional because the backend defaults it to `TODO`.
 */
export type TCreateTaskRequest = {
  title: string;
  status?: TJobTaskStatus;
  dueDate?: string | null;
};

/**
 * Request body accepted by `PUT /api/jobs/{jobId}/tasks/{taskId}`.
 *
 * Deliberately not `Partial<TCreateTaskRequest>`. An update replaces every
 * editable field, and the backend requires `status`; `dueDate` must be sent
 * explicitly as `null` to clear it.
 */
export type TUpdateTaskRequest = {
  title: string;
  status: TJobTaskStatus;
  dueDate: string | null;
};
