import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';
import type { TResumeProfileResponse, TSaveResumeProfileRequest } from './profiles.types';

/*
 * TEMPORARY MOCK - remove when the task 044 backend lands.
 *
 * Stands in for `/api/resume-profiles`, which does not exist yet, so the
 * Profile page can be seen in the dev server (`npm run dev:frontend`).
 * Profiles live in memory and reset on every page reload.
 *
 * To remove it, once the backend lands:
 * 1. Delete this file and `profiles.mock.test.ts`.
 * 2. Delete the `USE_MOCK_PROFILES` branches and the `./profiles.mock`
 *    import in `profiles.service.ts`.
 * 3. Delete `PROFILES_FEATURE_ENABLED` in
 *    `features/profile/profile.constants.ts` and the places that read
 *    it, so built images show the Profile page.
 */

/**
 * On only in the Vite dev server (`development` mode). Off in built images
 * and under Vitest.
 */
export const USE_MOCK_PROFILES = import.meta.env.MODE === 'development';

const seedProfiles = (): TResumeProfileResponse[] => {
  const now = new Date().toISOString();

  return [
    {
      createdAt: now,
      id: 'mock-profile-base',
      name: 'Base profile',
      profile: {
        education: [{ id: 'mock-education-1', text: 'BSc Computer Science' }],
        highlights: [
          { id: 'mock-highlight-1', text: 'Led the payments platform migration to Kotlin.' },
          { id: 'mock-highlight-2', text: 'Built an accessible React design system.' },
        ],
        links: [{ id: 'mock-link-1', label: 'GitHub', url: 'https://github.com/example' }],
        notes: '',
        summary: 'Full-stack engineer focused on Kotlin services and React frontends.',
        targetRole: 'BASE',
      },
      updatedAt: now,
    },
  ];
};

let profiles: TResumeProfileResponse[] | null = null;
let createdCount = 0;

const getProfiles = (): TResumeProfileResponse[] => {
  if (!profiles) profiles = seedProfiles();

  return profiles;
};

const profileNotFound = (): AppError =>
  new AppError(
    'Resume profile not found.',
    APP_ERROR_CODES.PROFILE_REQUEST_FAILED,
    404,
    'PROFILE_NOT_FOUND',
  );

/**
 * A deep copy, so nothing outside the mock can change its store.
 */
const copy = (profile: TResumeProfileResponse): TResumeProfileResponse =>
  JSON.parse(JSON.stringify(profile)) as TResumeProfileResponse;

/**
 * Mock of `GET /api/resume-profiles`.
 */
export const mockGetResumeProfiles = async (): Promise<TResumeProfileResponse[]> =>
  getProfiles().map(copy);

/**
 * Mock of `POST /api/resume-profiles`.
 */
export const mockCreateResumeProfile = async (
  payload: TSaveResumeProfileRequest,
): Promise<TResumeProfileResponse> => {
  const now = new Date().toISOString();

  createdCount += 1;

  const created: TResumeProfileResponse = copy({
    ...payload,
    createdAt: now,
    id: `mock-profile-created-${createdCount}`,
    updatedAt: now,
  });

  getProfiles().push(created);

  return copy(created);
};

/**
 * Mock of `PUT /api/resume-profiles/{id}`.
 */
export const mockUpdateResumeProfile = async (
  profileId: string,
  payload: TSaveResumeProfileRequest,
): Promise<TResumeProfileResponse> => {
  const profile = getProfiles().find((candidate) => candidate.id === profileId);

  if (!profile) throw profileNotFound();

  Object.assign(profile, copy({ ...profile, ...payload }), {
    updatedAt: new Date().toISOString(),
  });

  return copy(profile);
};

/**
 * Mock of `DELETE /api/resume-profiles/{id}`.
 */
export const mockDeleteResumeProfile = async (profileId: string): Promise<void> => {
  const list = getProfiles();
  const index = list.findIndex((candidate) => candidate.id === profileId);

  if (index === -1) throw profileNotFound();

  list.splice(index, 1);
};

/**
 * Restores the seeded profiles. For tests only.
 */
export const resetMockProfiles = (): void => {
  profiles = null;
  createdCount = 0;
};
