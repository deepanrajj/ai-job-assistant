import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  buildCreateReminderRequest,
  buildUpdateReminderRequest,
  createReminder,
  deleteReminder,
  getReminders,
  getTasks,
  mapReminderResponseToReminderItem,
  mapTaskResponseToReminderItem,
  updateReminder,
  updateTask,
  type IReminderFormValues,
  type TReminderResponse,
  type TTaskResponse,
  type TUpdateTaskRequest,
} from '../../services';
import { useAsyncMutation } from '../../hooks';
import { sortReminderItems } from '../reminders/reminders.utils';
import type { AppError } from '../../errors';
import type { TReminderItem } from '../../types';

/**
 * Everything the Reminders tab is built from: the job's stored reminders
 * and its tasks, whose due dates are reminders too. Loaded together so the
 * tab never shows one source without the other.
 */
interface IReminderSources {
  reminders: TReminderResponse[];
  tasks: TTaskResponse[];
}

/**
 * Arguments accepted by the reminder creation mutation.
 */
interface ICreateJobReminderInput {
  jobId: string;
  values: IReminderFormValues;
}

/**
 * Arguments accepted by the reminder update mutation.
 */
interface IUpdateJobReminderInput {
  completed: boolean;
  jobId: string;
  reminderId: string;
  values: IReminderFormValues;
}

/**
 * Arguments accepted by the reminder delete mutation.
 */
interface IDeleteJobReminderInput {
  jobId: string;
  reminderId: string;
}

/**
 * Arguments accepted by the task completion mutation.
 */
interface IUpdateReminderTaskInput {
  jobId: string;
  payload: TUpdateTaskRequest;
  taskId: string;
}

/**
 * Job reminders state returned by useJobReminders.
 *
 * Every write rejects when it fails, after `mutationError` is already set,
 * matching the contract `useJobContacts` uses: a caller that needs the
 * outcome can await and catch, and one that does not can rely on
 * `mutationError` alone.
 */
export interface IJobRemindersState {
  createJobReminder: (values: IReminderFormValues) => Promise<void>;
  deleteJobReminder: (reminderId: string) => Promise<void>;
  deletingReminderIds: ReadonlySet<string>;
  /**
   * True once this job has a list to show, even when the latest reload
   * failed, so a failed refresh can be reported without hiding the list.
   */
  hasLoadedReminders: boolean;
  isCreating: boolean;
  isLoading: boolean;
  isMutating: boolean;
  loadError: AppError | null;
  mutationError: AppError | null;
  /**
   * Stored reminders and dated tasks merged into one list, earliest due
   * date first.
   */
  reminders: TReminderItem[];
  reload: () => void;
  toggleReminderComplete: (item: TReminderItem) => Promise<void>;
  updateJobReminder: (reminderId: string, values: IReminderFormValues) => Promise<void>;
  updatingItemKeys: ReadonlySet<string>;
}

/**
 * Builds a key that is unique across both sources, for busy tracking and
 * React keys. A task and a reminder never share a UUID in practice, but
 * nothing guarantees it, so the source is part of the key.
 *
 * @param {TReminderItem} item Reminder item.
 * @returns {string} Source-qualified key.
 */
export const getReminderItemKey = (item: TReminderItem): string => `${item.source}:${item.id}`;

/**
 * Declared at module level so each mutation's identity stays stable across
 * renders, as `useJobContacts` does: `useAsyncMutation` keys `mutate` on
 * the mutation function.
 */
const loadReminderSources = (jobId: string): Promise<IReminderSources> =>
  Promise.all([getReminders(jobId), getTasks(jobId)]).then(([reminders, tasks]) => ({
    reminders,
    tasks,
  }));

const postReminderFields = ({
  jobId,
  values,
}: ICreateJobReminderInput): Promise<TReminderResponse> =>
  createReminder(jobId, buildCreateReminderRequest(values));

const putReminderFields = ({
  completed,
  jobId,
  reminderId,
  values,
}: IUpdateJobReminderInput): Promise<TReminderResponse> =>
  updateReminder(jobId, reminderId, buildUpdateReminderRequest(values, completed));

const removeReminder = ({ jobId, reminderId }: IDeleteJobReminderInput): Promise<void> =>
  deleteReminder(jobId, reminderId);

const putReminderTask = ({
  jobId,
  payload,
  taskId,
}: IUpdateReminderTaskInput): Promise<TTaskResponse> => updateTask(jobId, taskId, payload);

/**
 * Returns a copy of `keys` with `key` added or removed, for use as a state
 * updater so overlapping writes each change only their own entry.
 *
 * @param {ReadonlySet<string>} keys Current set of busy keys.
 * @param {string} key Key to add or remove.
 * @param {boolean} isBusy Whether the key should be in the result.
 * @returns {ReadonlySet<string>} Updated set of busy keys.
 */
const toggleKey = (
  keys: ReadonlySet<string>,
  key: string,
  isBusy: boolean,
): ReadonlySet<string> => {
  const next = new Set(keys);

  if (isBusy) next.add(key);
  else next.delete(key);

  return next;
};

const noKeys: ReadonlySet<string> = new Set();

/**
 * Replaces the entry with the same id, or leaves the list unchanged when
 * there is none.
 *
 * @param {T[]} items Current list.
 * @param {T} updated Confirmed replacement.
 * @returns {T[]} Updated list.
 */
const replaceById = <T extends { id: string }>(items: T[], updated: T): T[] =>
  items.map((item) => (item.id === updated.id ? updated : item));

/**
 * Loads a job's reminders - its stored reminders and its dated tasks - and
 * offers the writes the Reminders tab needs.
 *
 * Stored reminders can be created, edited, completed, reopened, and
 * deleted. A task reminder can only be completed or reopened here; that
 * writes the task itself through `PUT /api/jobs/{jobId}/tasks/{taskId}`
 * with its title and due date unchanged, so the task and its reminder are
 * one record and cannot disagree.
 *
 * Like `useJobContacts`, every write applies its confirmed result to the
 * cached lists and then reloads, and a failed reload keeps the last list
 * on screen.
 *
 * @param {string} jobId Job identifier the reminders belong to.
 * @returns {IJobRemindersState} Loaded reminders, request state, and the writes.
 */
export const useJobReminders = (jobId: string): IJobRemindersState => {
  const {
    mutate: loadSources,
    request: { data, error: loadError, isIdle, isLoading },
  } = useAsyncMutation<string, IReminderSources>(loadReminderSources);
  const {
    mutate: postReminder,
    request: { isLoading: isCreating },
  } = useAsyncMutation<ICreateJobReminderInput, TReminderResponse>(postReminderFields);
  const {
    mutate: putReminder,
    request: { isLoading: isUpdating },
  } = useAsyncMutation<IUpdateJobReminderInput, TReminderResponse>(putReminderFields);
  const {
    mutate: deleteStoredReminder,
    request: { isLoading: isDeleting },
  } = useAsyncMutation<IDeleteJobReminderInput, void>(removeReminder);
  const {
    mutate: putTask,
    request: { isLoading: isUpdatingTask },
  } = useAsyncMutation<IUpdateReminderTaskInput, TTaskResponse>(putReminderTask);

  /**
   * Tracked here rather than derived from each mutation's own error, for
   * the reason `useJobContacts` gives: those only clear when the same
   * mutation runs again, so an older failure would outlive a newer success.
   */
  const [mutationError, setMutationError] = useState<AppError | null>(null);
  const [updatingItemKeys, setUpdatingItemKeys] = useState(noKeys);
  const [deletingReminderIds, setDeletingReminderIds] = useState(noKeys);

  /**
   * The last sources this job loaded successfully, so a reload in flight or
   * a failed one does not empty the list. Keyed by job so a different job
   * never shows this one's reminders.
   */
  const [lastLoaded, setLastLoaded] = useState<{
    jobId: string;
    sources: IReminderSources;
  } | null>(null);

  /**
   * Numbers each reload so only the latest one may replace `lastLoaded`.
   */
  const latestReloadIdRef = useRef(0);

  /**
   * Reloads both sources and resolves once the reload has settled. It never
   * rejects: a failed reload is recorded in `loadError` and rendered from
   * there.
   */
  const refreshSources = useCallback((): Promise<void> => {
    latestReloadIdRef.current += 1;
    const reloadId = latestReloadIdRef.current;

    return loadSources(jobId).then(
      (sources) => {
        if (reloadId === latestReloadIdRef.current) setLastLoaded({ jobId, sources });
      },
      () => {
        // Error is already recorded in request state and rendered from it.
      },
    );
  }, [jobId, loadSources]);

  const reload = useCallback(() => {
    void refreshSources();
  }, [refreshSources]);

  useEffect(() => {
    reload();
  }, [reload]);

  const loadedSources = data ?? (lastLoaded?.jobId === jobId ? lastLoaded.sources : null);

  /**
   * `Array.isArray` for the reason `useJobsList` gives: a response body is
   * cast, not validated, so a 2xx carrying an object would otherwise throw
   * during render instead of showing an empty list.
   */
  const reminders = useMemo(() => {
    if (!loadedSources) return [];

    const storedItems = (Array.isArray(loadedSources.reminders) ? loadedSources.reminders : []).map(
      (reminder) => mapReminderResponseToReminderItem(reminder, jobId),
    );
    const taskItems = (Array.isArray(loadedSources.tasks) ? loadedSources.tasks : [])
      .map((task) => mapTaskResponseToReminderItem(task, jobId))
      .filter((item): item is TReminderItem => item !== null);

    return sortReminderItems([...storedItems, ...taskItems]);
  }, [jobId, loadedSources]);

  /**
   * The success/error contract every write shares: on success, clear the
   * previous error, apply the confirmed result to the cached sources, and
   * resolve once the reload has settled; on failure, record the error and
   * re-throw it.
   *
   * @param {Promise<T>} request The in-flight write.
   * @param {(sources: IReminderSources, result: T) => IReminderSources} applyToSources
   *   Applies the write's confirmed result to the cached sources.
   * @returns {Promise<void>} Resolves on success; rejects with the same error on failure.
   */
  const settleMutation = useCallback(
    <T>(
      request: Promise<T>,
      applyToSources: (sources: IReminderSources, result: T) => IReminderSources,
    ): Promise<void> =>
      request.then(
        (result) => {
          setMutationError(null);
          setLastLoaded((current) =>
            current?.jobId === jobId
              ? { jobId, sources: applyToSources(current.sources, result) }
              : current,
          );

          return refreshSources();
        },
        (error: AppError) => {
          setMutationError(error);
          throw error;
        },
      ),
    [jobId, refreshSources],
  );

  /**
   * Drops any entry with the created reminder's id before appending it: a
   * reload started by another write can land first and already include it.
   */
  const createJobReminder = useCallback(
    (values: IReminderFormValues) =>
      settleMutation(postReminder({ jobId, values }), (sources, created) => ({
        ...sources,
        reminders: [...sources.reminders.filter((item) => item.id !== created.id), created],
      })),
    [jobId, postReminder, settleMutation],
  );

  /**
   * Runs a stored-reminder update while marking that row busy.
   */
  const runReminderUpdate = useCallback(
    (reminderId: string, values: IReminderFormValues, completed: boolean) => {
      const key = `REMINDER:${reminderId}`;

      setUpdatingItemKeys((keys) => toggleKey(keys, key, true));

      return settleMutation(
        putReminder({ completed, jobId, reminderId, values }),
        (sources, updated) => ({ ...sources, reminders: replaceById(sources.reminders, updated) }),
      ).finally(() => setUpdatingItemKeys((keys) => toggleKey(keys, key, false)));
    },
    [jobId, putReminder, settleMutation],
  );

  /**
   * Saves edited fields and keeps the reminder's completion state as it is.
   */
  const updateJobReminder = useCallback(
    (reminderId: string, values: IReminderFormValues) => {
      const current = loadedSources?.reminders.find((reminder) => reminder.id === reminderId);

      return runReminderUpdate(reminderId, values, Boolean(current?.completedAt));
    },
    [loadedSources, runReminderUpdate],
  );

  /**
   * Flips completion from the loaded record rather than the rendered item,
   * so the rest of the full-replacement body is exactly what was loaded.
   */
  const toggleReminderComplete = useCallback(
    (item: TReminderItem) => {
      if (item.source === 'REMINDER') {
        const reminder = loadedSources?.reminders.find((candidate) => candidate.id === item.id);

        if (!reminder) return Promise.resolve();

        return runReminderUpdate(
          reminder.id,
          { dueDate: reminder.dueDate, title: reminder.title, type: reminder.type },
          reminder.completedAt === null,
        );
      }

      const task = loadedSources?.tasks.find((candidate) => candidate.id === item.id);

      if (!task) return Promise.resolve();

      const key = getReminderItemKey(item);
      const payload: TUpdateTaskRequest = {
        dueDate: task.dueDate,
        status: task.status === 'DONE' ? 'TODO' : 'DONE',
        title: task.title,
      };

      setUpdatingItemKeys((keys) => toggleKey(keys, key, true));

      return settleMutation(putTask({ jobId, payload, taskId: task.id }), (sources, updated) => ({
        ...sources,
        tasks: replaceById(sources.tasks, updated),
      })).finally(() => setUpdatingItemKeys((keys) => toggleKey(keys, key, false)));
    },
    [jobId, loadedSources, putTask, runReminderUpdate, settleMutation],
  );

  const deleteJobReminder = useCallback(
    (reminderId: string) => {
      setDeletingReminderIds((ids) => toggleKey(ids, reminderId, true));

      return settleMutation(deleteStoredReminder({ jobId, reminderId }), (sources) => ({
        ...sources,
        reminders: sources.reminders.filter((item) => item.id !== reminderId),
      })).finally(() => setDeletingReminderIds((ids) => toggleKey(ids, reminderId, false)));
    },
    [deleteStoredReminder, jobId, settleMutation],
  );

  return {
    createJobReminder,
    deleteJobReminder,
    deletingReminderIds,
    hasLoadedReminders: loadedSources !== null,
    isCreating,
    isLoading: (isIdle || isLoading) && !loadedSources,
    isMutating: isCreating || isUpdating || isDeleting || isUpdatingTask,
    loadError,
    mutationError,
    reload,
    reminders,
    toggleReminderComplete,
    updateJobReminder,
    updatingItemKeys,
  };
};
