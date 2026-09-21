import { translate } from '../../i18n';
import { NOTE_FALLBACK_ERROR_TRANSLATION_KEYS, type TNoteFallbackErrorKey } from './notes.types';

/**
 * Resolves the localized fallback error message for a note service operation.
 *
 * @param {TNoteFallbackErrorKey} key Note operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getNoteFallbackErrorMessage = (key: TNoteFallbackErrorKey): string =>
  translate(NOTE_FALLBACK_ERROR_TRANSLATION_KEYS[key]);
