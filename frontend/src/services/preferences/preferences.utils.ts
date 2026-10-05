import { translate } from '../../i18n';
import {
  PREFERENCES_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TPreferencesFallbackErrorKey,
  type TProfilePreferences,
} from './preferences.types';

/**
 * Longest value a free-text preference list keeps.
 */
export const MAX_PREFERENCE_VALUE_LENGTH = 60;

/**
 * Most values a free-text preference list keeps.
 */
export const MAX_PREFERENCE_LIST_LENGTH = 50;

/**
 * Resolves the localized fallback error message for a preferences operation.
 *
 * @param {TPreferencesFallbackErrorKey} key Operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getPreferencesFallbackErrorMessage = (key: TPreferencesFallbackErrorKey): string =>
  translate(PREFERENCES_FALLBACK_ERROR_TRANSLATION_KEYS[key]);

/**
 * Normalizes one free-text value: trims it and collapses runs of
 * whitespace to one space.
 *
 * @param {string} value Raw value.
 * @returns {string} Normalized value, possibly empty.
 */
export const normalizePreferenceValue = (value: string): string =>
  value.trim().replace(/\s+/g, ' ');

/**
 * Normalizes a free-text preference list: each value trimmed and
 * collapsed, empty or over-long values dropped, case-insensitive
 * duplicates removed keeping the first spelling and the user's order,
 * and the list capped. "react", "React " and "REACT" are one value.
 *
 * @param {string[]} values Raw values in the user's order.
 * @returns {string[]} The normalized list.
 */
export const normalizePreferenceList = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of values) {
    const value = normalizePreferenceValue(raw);
    const key = value.toLocaleLowerCase();

    if (!value || value.length > MAX_PREFERENCE_VALUE_LENGTH || seen.has(key)) continue;

    seen.add(key);
    result.push(value);
  }

  return result.slice(0, MAX_PREFERENCE_LIST_LENGTH);
};

/**
 * Normalizes every list of a preferences record. The fixed-choice lists
 * only lose duplicates; the free-text ones follow `normalizePreferenceList`.
 *
 * @param {TProfilePreferences} preferences Preferences as edited.
 * @returns {TProfilePreferences} Preferences ready to save.
 */
export const normalizeProfilePreferences = (
  preferences: TProfilePreferences,
): TProfilePreferences => ({
  keywords: normalizePreferenceList(preferences.keywords),
  locations: normalizePreferenceList(preferences.locations),
  roles: normalizePreferenceList(preferences.roles),
  seniority: [...new Set(preferences.seniority)],
  skills: normalizePreferenceList(preferences.skills),
  workModes: [...new Set(preferences.workModes)],
});

/**
 * A preferences record with nothing chosen.
 *
 * @returns {TProfilePreferences} Empty preferences.
 */
export const createEmptyProfilePreferences = (): TProfilePreferences => ({
  keywords: [],
  locations: [],
  roles: [],
  seniority: [],
  skills: [],
  workModes: [],
});
