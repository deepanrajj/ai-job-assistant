/**
 * Translation keys used for preferences service fallback errors.
 */
export const PREFERENCES_FALLBACK_ERROR_TRANSLATION_KEYS = {
  getPreferences: 'preferences.fallbackError.getPreferences',
  savePreferences: 'preferences.fallbackError.savePreferences',
} as const;

/**
 * Supported preferences fallback error lookup keys.
 */
export type TPreferencesFallbackErrorKey = keyof typeof PREFERENCES_FALLBACK_ERROR_TRANSLATION_KEYS;

/**
 * Where the user wants to work. Matches the planned job `workMode` (R-07).
 */
export type TWorkMode = 'REMOTE' | 'HYBRID' | 'ONSITE';

/**
 * Seniority levels the user is looking for.
 */
export type TSeniorityLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';

/**
 * The user's skills and job preferences, as saved. Free-text lists are
 * normalized (see `normalizePreferenceList`).
 */
export type TProfilePreferences = {
  skills: string[];
  roles: string[];
  locations: string[];
  workModes: TWorkMode[];
  seniority: TSeniorityLevel[];
  keywords: string[];
};

/**
 * Wire representation of `GET /api/profile/preferences`. `updatedAt` is
 * null before the first save.
 */
export type TProfilePreferencesResponse = TProfilePreferences & {
  updatedAt: string | null;
};
