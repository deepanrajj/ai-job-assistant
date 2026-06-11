import { translate } from '../../i18n';
import { AI_FALLBACK_ERROR_TRANSLATION_KEYS, type TAiFallbackErrorKey } from './ai.types';

/**
 * Resolves the localized fallback error message for an AI service operation.
 *
 * @param {TAiFallbackErrorKey} key AI operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getAiFallbackErrorMessage = (key: TAiFallbackErrorKey): string =>
  translate(AI_FALLBACK_ERROR_TRANSLATION_KEYS[key]);
