import { translate } from '../../i18n';
import {
  CALENDAR_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TCalendarFallbackErrorKey,
} from './calendar.types';

/**
 * Resolves the localized fallback error message for a calendar service operation.
 *
 * @param {TCalendarFallbackErrorKey} key Calendar operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getCalendarFallbackErrorMessage = (key: TCalendarFallbackErrorKey): string =>
  translate(CALENDAR_FALLBACK_ERROR_TRANSLATION_KEYS[key]);
