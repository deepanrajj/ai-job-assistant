import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createTask,
  deleteTask,
  getTasks,
  mapTaskResponseToJobTask,
  updateTask,
  type TCreateTaskRequest,
  type TTaskResponse,
  type TUpdateTaskRequest,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import { buildJobTaskUpdateRequest } from './jobDetail.utils';
import type { AppError } from '../../errors';
import type { TJobTask } from '../../types';
import type { IUpdateJobTaskInput } from './jobDetail.types';

/**
 * Arguments accepted by the task creation mutation.
 */
interface ICreateJobTaskInput {
  jobId: string;
  payload: TCreateTaskRequest;
}

/**
 * Arguments accepted by the task update mutation.
 */
interface IUpdateJobTaskFieldsInput {
  jobId: string;
  payload: TUpdateTaskRequest;
  taskId: string;
}

/**
 * Arguments accepted by the task delete mutation.
 */
interface IDeleteJobTaskInput {
  jobId: string;
  taskId: string;
}

/**
 * Job tasks state returned by useJobTasks.
 *
 * `createJobTask`, `updateJobTask`, and `deleteJobTask` all reject when
 * their write fails, after `mutationError` is already set, the same
 * contract `useCreateJob`/`useUpdateJob` use for jobs: a caller that needs
 * to react to the outcome can await and catch, and one that does not can
 * ignore the rejection and rely on `mutationError` alone.
 */
export interface IJobTasksState {
  createJobTask: (title: string, dueDate: string) => Promise<void>;
  deleteJobTask: (taskId: string) => Promise<void>;
  isLoading: boolean;
  isMutating: boolean;
  loadError: AppError | null;
  mutationError: AppError | null;
  reload: () => void;
  tasks: TJobTask[];
  updateJobTask: (taskId: string, input: IUpdateJobTaskInput) => Promise<void>;
}

/**
 * Declared at module level so each mutation's identity stays stable across
 * renders, as `useUpdateJob` does for jobs: `useAsyncMutation` keys `mutate`
 * on the mutation function, and a closure built inside the hook body would
 * get a new identity on every render.
 */
const postTaskFields = ({ jobId, payload }: ICreateJobTaskInput): Promise<TTaskResponse> =>
  createTask(jobId, payload);

const putTaskFields = ({
  jobId,
  payload,
  taskId,
}: IUpdateJobTaskFieldsInput): Promise<TTaskResponse> => updateTask(jobId, taskId, payload);

const removeTaskFields = ({ jobId, taskId }: IDeleteJobTaskInput): Promise<void> =>
  deleteTask(jobId, taskId);

/**
 * Loads a job's tasks from the backend and offers create, update, and
 * delete against the same job.
 *
 * Every write reloads the list from the server rather than patching it
 * locally, so the rendered tasks are always what the last `GET` returned.
 * Optimistic local updates are task 035's concern.
 *
 * @param {string} jobId Job identifier the tasks belong to.
 * @returns {IJobTasksState} Loaded tasks, request state, and the three writes.
 */
export const useJobTasks = (jobId: string): IJobTasksState => {
  const {
    mutate: loadTasks,
    request: { data, error: loadError, isIdle, isLoading },
  } = useAsyncMutation<string, TTaskResponse[]>(getTasks);
  const {
    mutate: postTask,
    request: { isLoading: isCreating },
  } = useAsyncMutation<ICreateJobTaskInput, TTaskResponse>(postTaskFields);
  const {
    mutate: putTask,
    request: { isLoading: isUpdating },
  } = useAsyncMutation<IUpdateJobTaskFieldsInput, TTaskResponse>(putTaskFields);
  const {
    mutate: removeTask,
    request: { isLoading: isDeleting },
  } = useAsyncMutation<IDeleteJobTaskInput, void>(removeTaskFields);

  /**
   * Tracked here rather than derived from the three mutations' own error
   * states. Each of those only clears when that same mutation runs again,
   * so a failed create followed by a successful update would otherwise
   * still show the create's stale error: nothing ever re-invoked `postTask`
   * to clear it.
   */
  const [mutationError, setMutationError] = useState<AppError | null>(null);

  const reload = useCallback(() => {
    loadTasks(jobId).catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  }, [jobId, loadTasks]);

  useEffect(() => {
    reload();
  }, [reload]);

  const tasks = useMemo(
    () => (Array.isArray(data) ? data.map(mapTaskResponseToJobTask) : []),
    [data],
  );

  const createJobTask = useCallback(
    (title: string, dueDate: string) =>
      postTask({ jobId, payload: { title, dueDate } }).then(
        () => {
          setMutationError(null);
          reload();
        },
        (error: AppError) => {
          setMutationError(error);
          throw error;
        },
      ),
    [jobId, postTask, reload],
  );

  const updateJobTask = useCallback(
    (taskId: string, input: IUpdateJobTaskInput) => {
      const currentTask = tasks.find((task) => task.id === taskId);

      if (!currentTask) return Promise.resolve();

      return putTask({
        jobId,
        payload: buildJobTaskUpdateRequest(currentTask, input),
        taskId,
      }).then(
        () => {
          setMutationError(null);
          reload();
        },
        (error: AppError) => {
          setMutationError(error);
          throw error;
        },
      );
    },
    [jobId, putTask, reload, tasks],
  );

  const deleteJobTask = useCallback(
    (taskId: string) =>
      removeTask({ jobId, taskId }).then(
        () => {
          setMutationError(null);
          reload();
        },
        (error: AppError) => {
          setMutationError(error);
          throw error;
        },
      ),
    [jobId, removeTask, reload],
  );

  return {
    createJobTask,
    deleteJobTask,
    isLoading: isIdle || isLoading,
    isMutating: isCreating || isUpdating || isDeleting,
    loadError,
    mutationError,
    reload,
    tasks,
    updateJobTask,
  };
};
