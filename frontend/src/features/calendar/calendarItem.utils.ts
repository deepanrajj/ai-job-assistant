import type { TTranslationContextValue } from '../../i18n';
import { DOCUMENT_TYPE_TRANSLATION_KEYS, REMINDER_TYPE_TRANSLATION_KEYS } from '../../types';
import type { TCalendarItem } from './calendar.types';

/**
 * Names what kind of item this is: the reminder's type, "Task", or
 * "Submitted" with the document's type.
 *
 * @param {TCalendarItem} item Calendar item.
 * @param {TTranslationContextValue['t']} t Translation function.
 * @returns {string} Localized kind label.
 */
export const getCalendarItemKindLabel = (
  item: TCalendarItem,
  t: TTranslationContextValue['t'],
): string => {
  if (item.source === 'REMINDER' && item.reminderType)
    return t(REMINDER_TYPE_TRANSLATION_KEYS[item.reminderType]);

  if (item.source === 'DOCUMENT' && item.documentType)
    return t('calendar.submittedKind', {
      type: t(DOCUMENT_TYPE_TRANSLATION_KEYS[item.documentType]),
    });

  return t('calendar.taskKind');
};

/**
 * Builds a key unique across the three sources, which can share ids.
 *
 * @param {TCalendarItem} item Calendar item.
 * @returns {string} Source-qualified key.
 */
export const getCalendarItemKey = (item: TCalendarItem): string => `${item.source}:${item.id}`;
