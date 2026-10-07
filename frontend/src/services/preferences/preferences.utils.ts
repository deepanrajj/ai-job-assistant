import { translate } from '../../i18n';
import {
  PREFERENCES_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TPreferencesFallbackErrorKey,
  type TProfilePreferences,
  type TProfilePreferencesResponse,
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
 * Why a value cannot join a free-text preference list.
 */
export type TPreferenceValueError = 'TOO_LONG' | 'DUPLICATE' | 'LIST_FULL';

/**
 * Checks a value before it joins a list, so the editor can refuse it out
 * loud instead of `normalizePreferenceList` dropping it silently.
 *
 * @param {string[]} values The list as it is.
 * @param {string} raw The value being added.
 * @returns {TPreferenceValueError | null} Why it cannot be added, or null
 *   when it can (or is blank, which adds nothing).
 */
export const getPreferenceValueError = (
  values: string[],
  raw: string,
): TPreferenceValueError | null => {
  const value = normalizePreferenceValue(raw);

  if (!value) return null;
  if (value.length > MAX_PREFERENCE_VALUE_LENGTH) return 'TOO_LONG';

  const key = value.toLocaleLowerCase();

  if (values.some((existing) => existing.toLocaleLowerCase() === key)) return 'DUPLICATE';
  if (values.length >= MAX_PREFERENCE_LIST_LENGTH) return 'LIST_FULL';

  return null;
};

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
 * Cleans a free-text list without applying the limits: each value trimmed
 * and collapsed, empty values and case-insensitive duplicates dropped.
 * Used for values already stored, which the client must not delete
 * behind the user's back; the limits apply when a value is added.
 *
 * @param {string[]} values Raw values in the user's order.
 * @returns {string[]} The cleaned list.
 */
export const cleanPreferenceList = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of values) {
    const value = normalizePreferenceValue(raw);
    const key = value.toLocaleLowerCase();

    if (!value || seen.has(key)) continue;

    seen.add(key);
    result.push(value);
  }

  return result;
};

/**
 * Normalizes every list of a preferences record before saving. Values can
 * only have joined a list through `getPreferenceValueError`, so this only
 * cleans: a stored value outside the limits is kept, not silently dropped.
 *
 * @param {TProfilePreferences} preferences Preferences as edited.
 * @returns {TProfilePreferences} Preferences ready to save.
 */
export const normalizeProfilePreferences = (
  preferences: TProfilePreferences,
): TProfilePreferences => ({
  keywords: cleanPreferenceList(preferences.keywords),
  locations: cleanPreferenceList(preferences.locations),
  roles: cleanPreferenceList(preferences.roles),
  seniority: [...new Set(preferences.seniority)],
  skills: cleanPreferenceList(preferences.skills),
  workModes: [...new Set(preferences.workModes)],
});

/**
 * Reads a list from a response that is cast, not validated.
 *
 * @param {unknown} value The field as received.
 * @returns {T[]} Its string entries, or an empty list when it is not a list.
 */
const readList = <T extends string>(value: unknown): T[] =>
  Array.isArray(value) ? value.filter((entry): entry is T => typeof entry === 'string') : [];

/**
 * Makes a received preferences record safe to edit: a missing or `null`
 * list becomes empty rather than crashing the form, and case-insensitive
 * duplicates are merged, since each value is also its chip's React key.
 *
 * @param {unknown} response The response body.
 * @returns {TProfilePreferencesResponse} A record every list of which is a list.
 */
export const mapProfilePreferencesResponse = (response: unknown): TProfilePreferencesResponse => {
  const record = (response ?? {}) as Partial<Record<keyof TProfilePreferencesResponse, unknown>>;

  return {
    keywords: cleanPreferenceList(readList(record.keywords)),
    locations: cleanPreferenceList(readList(record.locations)),
    roles: cleanPreferenceList(readList(record.roles)),
    seniority: [...new Set(readList<TProfilePreferences['seniority'][number]>(record.seniority))],
    skills: cleanPreferenceList(readList(record.skills)),
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : null,
    workModes: [...new Set(readList<TProfilePreferences['workModes'][number]>(record.workModes))],
  };
};

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
