import { translate } from '../../i18n';
import type { TJobTask } from '../../types';
import {
  TASK_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TTaskFallbackErrorKey,
  type TTaskResponse,
} from './tasks.types';

/**
 * Resolves the localized fallback error message for a task service operation.
 *
 * @param {TTaskFallbackErrorKey} key Task operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getTaskFallbackErrorMessage = (key: TTaskFallbackErrorKey): string =>
  translate(TASK_FALLBACK_ERROR_TRANSLATION_KEYS[key]);

/**
 * Converts a task API response into the task model the UI renders.
 *
 * A null wire due date becomes an empty string rather than being defaulted
 * to a real date, so the UI renders a genuine "no due date" state.
 *
 * @param {TTaskResponse} response Task exactly as `/api/jobs/{jobId}/tasks` returned it.
 * @returns {TJobTask} Task in the shape every screen consumes.
 */
export const mapTaskResponseToJobTask = (response: TTaskResponse): TJobTask => ({
  id: response.id,
  title: response.title,
  status: response.status,
  dueDate: response.dueDate ?? '',
});
