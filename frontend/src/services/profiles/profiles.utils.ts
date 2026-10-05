import { translate } from '../../i18n';
import {
  PROFILE_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TProfileFallbackErrorKey,
} from './profiles.types';

/**
 * Resolves the localized fallback error message for a resume profile operation.
 *
 * @param {TProfileFallbackErrorKey} key Profile operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getProfileFallbackErrorMessage = (key: TProfileFallbackErrorKey): string =>
  translate(PROFILE_FALLBACK_ERROR_TRANSLATION_KEYS[key]);
