import { translate } from '../../i18n';
import { JOB_FALLBACK_ERROR_TRANSLATION_KEYS, type TJobFallbackErrorKey } from './jobs.types';

/**
 * Resolves the localized fallback error message for a job service operation.
 *
 * @param {TJobFallbackErrorKey} key Job operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getJobFallbackErrorMessage = (key: TJobFallbackErrorKey): string =>
  translate(JOB_FALLBACK_ERROR_TRANSLATION_KEYS[key]);
