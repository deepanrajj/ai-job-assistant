import { translate } from '../../i18n';
import {
  SAVED_SEARCH_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TSavedSearchCriteria,
  type TSavedSearchFallbackErrorKey,
} from './savedSearches.types';
import { cleanPreferenceList, normalizePreferenceValue } from '../preferences';

/**
 * Resolves the localized fallback error message for a saved search operation.
 *
 * @param {TSavedSearchFallbackErrorKey} key Operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getSavedSearchFallbackErrorMessage = (key: TSavedSearchFallbackErrorKey): string =>
  translate(SAVED_SEARCH_FALLBACK_ERROR_TRANSLATION_KEYS[key]);

/**
 * Criteria a new saved search starts with.
 *
 * @returns {TSavedSearchCriteria} Empty criteria.
 */
export const createEmptySavedSearchCriteria = (): TSavedSearchCriteria => ({
  location: '',
  name: '',
  notes: '',
  role: '',
  seniority: [],
  skills: [],
  workModes: [],
});

/**
 * Cleans criteria before saving: single-line text normalized as in task
 * 045, notes trimmed, skills normalized, fixed choices de-duplicated.
 *
 * @param {TSavedSearchCriteria} criteria Criteria as edited.
 * @returns {TSavedSearchCriteria} Criteria ready to send.
 */
export const normalizeSavedSearchCriteria = (
  criteria: TSavedSearchCriteria,
): TSavedSearchCriteria => ({
  location: normalizePreferenceValue(criteria.location),
  name: normalizePreferenceValue(criteria.name),
  notes: criteria.notes.trim(),
  role: normalizePreferenceValue(criteria.role),
  seniority: [...new Set(criteria.seniority)],
  skills: cleanPreferenceList(criteria.skills),
  workModes: [...new Set(criteria.workModes)],
});

/**
 * Checks whether a search can be saved: it needs a name.
 *
 * @param {TSavedSearchCriteria} criteria Criteria as edited.
 * @returns {boolean} True when the search is ready to save.
 */
export const isSavedSearchValid = (criteria: TSavedSearchCriteria): boolean =>
  Boolean(normalizePreferenceValue(criteria.name));
