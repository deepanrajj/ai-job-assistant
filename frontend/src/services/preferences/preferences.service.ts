import { getJson, putJson } from '../api';
import {
  getPreferencesFallbackErrorMessage,
  mapProfilePreferencesResponse,
} from './preferences.utils';
// TEMPORARY: remove this import and the USE_MOCK_PREFERENCES branches
// below when the task 045 backend lands. See preferences.mock.ts.
import {
  USE_MOCK_PREFERENCES,
  mockGetProfilePreferences,
  mockSaveProfilePreferences,
} from './preferences.mock';
import { APP_ERROR_CODES } from '../../types';
import type { TProfilePreferences, TProfilePreferencesResponse } from './preferences.types';

const PREFERENCES_ENDPOINT = '/api/profile/preferences';

/**
 * Fetches the user's skills and job preferences. Answers with empty
 * lists, not an error, before anything was saved.
 *
 * @returns {Promise<TProfilePreferencesResponse>} The preferences record.
 */
export const getProfilePreferences = (): Promise<TProfilePreferencesResponse> =>
  (USE_MOCK_PREFERENCES
    ? mockGetProfilePreferences()
    : getJson<TProfilePreferencesResponse>(PREFERENCES_ENDPOINT, {
        errorCode: APP_ERROR_CODES.PREFERENCES_REQUEST_FAILED,
        fallbackErrorMessage: getPreferencesFallbackErrorMessage('getPreferences'),
      })
  ).then(mapProfilePreferencesResponse);

/**
 * Replaces the user's skills and job preferences.
 *
 * @param {TProfilePreferences} preferences Complete, normalized preferences.
 * @returns {Promise<TProfilePreferencesResponse>} The saved record.
 */
export const saveProfilePreferences = (
  preferences: TProfilePreferences,
): Promise<TProfilePreferencesResponse> =>
  (USE_MOCK_PREFERENCES
    ? mockSaveProfilePreferences(preferences)
    : putJson<TProfilePreferencesResponse, TProfilePreferences>(PREFERENCES_ENDPOINT, preferences, {
        errorCode: APP_ERROR_CODES.PREFERENCES_REQUEST_FAILED,
        fallbackErrorMessage: getPreferencesFallbackErrorMessage('savePreferences'),
      })
  ).then(mapProfilePreferencesResponse);
