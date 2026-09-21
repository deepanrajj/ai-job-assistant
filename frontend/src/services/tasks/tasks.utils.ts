import { translate } from '../../i18n';
import { TASK_FALLBACK_ERROR_TRANSLATION_KEYS, type TTaskFallbackErrorKey } from './tasks.types';

/**
 * Resolves the localized fallback error message for a task service operation.
 *
 * @param {TTaskFallbackErrorKey} key Task operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getTaskFallbackErrorMessage = (key: TTaskFallbackErrorKey): string =>
  translate(TASK_FALLBACK_ERROR_TRANSLATION_KEYS[key]);
