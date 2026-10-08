import type { TProfilePreferences, TProfilePreferencesResponse } from './preferences.types';

/*
 * TEMPORARY MOCK - remove when the task 045 backend lands.
 *
 * Stands in for `/api/profile/preferences`, which does not exist yet, so
 * the preferences section can be seen in the dev server
 * (`npm run dev:frontend`). The record lives in memory and resets on
 * every page reload.
 *
 * To remove it, once the backend lands:
 * 1. Delete this file and `preferences.mock.test.ts`.
 * 2. Delete the `USE_MOCK_PREFERENCES` branches and the
 *    `./preferences.mock` import in `preferences.service.ts`.
 * 3. Delete `PREFERENCES_FEATURE_ENABLED` in
 *    `features/profile/preferences.constants.ts` and the places that read
 *    it, so built images show the section.
 */

/**
 * On only in the Vite dev server (`development` mode). Off in built images
 * and under Vitest.
 */
export const USE_MOCK_PREFERENCES = import.meta.env.MODE === 'development';

const seedPreferences = (): TProfilePreferencesResponse => ({
  keywords: ['payments', 'platform'],
  locations: ['Berlin', 'Remote EU'],
  roles: ['Backend Engineer', 'Full-stack Engineer'],
  seniority: ['SENIOR'],
  skills: ['Kotlin', 'Spring Boot', 'React', 'TypeScript', 'PostgreSQL'],
  updatedAt: null,
  workModes: ['REMOTE', 'HYBRID'],
});

let stored: TProfilePreferencesResponse | null = null;

const copy = (value: TProfilePreferencesResponse): TProfilePreferencesResponse =>
  JSON.parse(JSON.stringify(value)) as TProfilePreferencesResponse;

/**
 * Mock of `GET /api/profile/preferences`.
 */
export const mockGetProfilePreferences = async (): Promise<TProfilePreferencesResponse> => {
  if (!stored) stored = seedPreferences();

  return copy(stored);
};

/**
 * Mock of `PUT /api/profile/preferences`.
 */
export const mockSaveProfilePreferences = async (
  preferences: TProfilePreferences,
): Promise<TProfilePreferencesResponse> => {
  stored = copy({ ...preferences, updatedAt: new Date().toISOString() });

  return copy(stored);
};

/**
 * Restores the seeded record. For tests only.
 */
export const resetMockProfilePreferences = (): void => {
  stored = null;
};
