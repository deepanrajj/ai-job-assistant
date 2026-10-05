import { deleteJson, getJson, postJson, putJson } from '../api';
import { getProfileFallbackErrorMessage } from './profiles.utils';
// TEMPORARY: remove this import and every USE_MOCK_PROFILES branch below
// when the task 044 backend lands. See profiles.mock.ts.
import {
  USE_MOCK_PROFILES,
  mockCreateResumeProfile,
  mockDeleteResumeProfile,
  mockGetResumeProfiles,
  mockUpdateResumeProfile,
} from './profiles.mock';
import { APP_ERROR_CODES } from '../../types';
import type { TResumeProfileResponse, TSaveResumeProfileRequest } from './profiles.types';

const PROFILES_ENDPOINT = '/api/resume-profiles';

/**
 * Builds the endpoint URL for one profile; the id is encoded so it stays
 * one path segment.
 *
 * @param {string} profileId Profile identifier.
 * @returns {string} Endpoint URL for that profile.
 */
const getProfileEndpoint = (profileId: string): string =>
  `${PROFILES_ENDPOINT}/${encodeURIComponent(profileId)}`;

/**
 * Fetches every resume profile.
 *
 * @returns {Promise<TResumeProfileResponse[]>} Profiles as the API returns them.
 */
export const getResumeProfiles = (): Promise<TResumeProfileResponse[]> =>
  USE_MOCK_PROFILES
    ? mockGetResumeProfiles()
    : getJson<TResumeProfileResponse[]>(PROFILES_ENDPOINT, {
        errorCode: APP_ERROR_CODES.PROFILE_REQUEST_FAILED,
        fallbackErrorMessage: getProfileFallbackErrorMessage('listProfiles'),
      });

/**
 * Creates a resume profile.
 *
 * @param {TSaveResumeProfileRequest} payload Name and content.
 * @returns {Promise<TResumeProfileResponse>} The created profile.
 */
export const createResumeProfile = (
  payload: TSaveResumeProfileRequest,
): Promise<TResumeProfileResponse> =>
  USE_MOCK_PROFILES
    ? mockCreateResumeProfile(payload)
    : postJson<TResumeProfileResponse, TSaveResumeProfileRequest>(PROFILES_ENDPOINT, payload, {
        errorCode: APP_ERROR_CODES.PROFILE_REQUEST_FAILED,
        fallbackErrorMessage: getProfileFallbackErrorMessage('createProfile'),
      });

/**
 * Replaces a resume profile's name and content.
 *
 * @param {string} profileId Profile identifier.
 * @param {TSaveResumeProfileRequest} payload Complete replacement.
 * @returns {Promise<TResumeProfileResponse>} The updated profile.
 */
export const updateResumeProfile = (
  profileId: string,
  payload: TSaveResumeProfileRequest,
): Promise<TResumeProfileResponse> =>
  USE_MOCK_PROFILES
    ? mockUpdateResumeProfile(profileId, payload)
    : putJson<TResumeProfileResponse, TSaveResumeProfileRequest>(
        getProfileEndpoint(profileId),
        payload,
        {
          errorCode: APP_ERROR_CODES.PROFILE_REQUEST_FAILED,
          fallbackErrorMessage: getProfileFallbackErrorMessage('updateProfile'),
        },
      );

/**
 * Deletes a resume profile. The API answers 204 with no body.
 *
 * @param {string} profileId Profile identifier.
 * @returns {Promise<void>} Resolves once the profile is deleted.
 */
export const deleteResumeProfile = (profileId: string): Promise<void> =>
  USE_MOCK_PROFILES
    ? mockDeleteResumeProfile(profileId)
    : deleteJson<void>(getProfileEndpoint(profileId), {
        errorCode: APP_ERROR_CODES.PROFILE_REQUEST_FAILED,
        fallbackErrorMessage: getProfileFallbackErrorMessage('deleteProfile'),
      });
