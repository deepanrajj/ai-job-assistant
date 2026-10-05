import type { TSeniorityLevel, TWorkMode } from '../preferences';

/**
 * Translation keys used for saved search service fallback errors.
 */
export const SAVED_SEARCH_FALLBACK_ERROR_TRANSLATION_KEYS = {
  listSearches: 'savedSearches.fallbackError.listSearches',
  createSearch: 'savedSearches.fallbackError.createSearch',
  updateSearch: 'savedSearches.fallbackError.updateSearch',
  deleteSearch: 'savedSearches.fallbackError.deleteSearch',
} as const;

/**
 * Supported saved search fallback error lookup keys.
 */
export type TSavedSearchFallbackErrorKey =
  keyof typeof SAVED_SEARCH_FALLBACK_ERROR_TRANSLATION_KEYS;

/**
 * The criteria of a saved search, stored by the backend as one JSON
 * document (`criteriaJson`). `name` lives here because the locked model
 * has no column for it. Seniority and work modes share task 045's
 * vocabulary, so a search compares directly with the user's preferences.
 */
export type TSavedSearchCriteria = {
  name: string;
  role: string;
  location: string;
  seniority: TSeniorityLevel[];
  skills: string[];
  workModes: TWorkMode[];
  notes: string;
};

/**
 * Wire representation of a saved search as `/api/saved-searches` returns it.
 */
export type TSavedSearchResponse = {
  id: string;
  criteria: TSavedSearchCriteria;
  createdAt: string;
  updatedAt: string;
};

/**
 * Request body accepted by `POST /api/saved-searches` and, as a full
 * replacement, `PUT /api/saved-searches/{id}`.
 */
export type TSaveSavedSearchRequest = {
  criteria: TSavedSearchCriteria;
};
