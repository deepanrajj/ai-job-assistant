import { deleteJson, getJson, postJson, putJson } from '../api';
import { getSavedSearchFallbackErrorMessage } from './savedSearches.utils';
// TEMPORARY: remove this import and every USE_MOCK_SAVED_SEARCHES branch
// below when the task 046 backend lands. See savedSearches.mock.ts.
import {
  USE_MOCK_SAVED_SEARCHES,
  mockCreateSavedSearch,
  mockDeleteSavedSearch,
  mockGetSavedSearches,
  mockUpdateSavedSearch,
} from './savedSearches.mock';
import { APP_ERROR_CODES } from '../../types';
import type { TSavedSearchResponse, TSaveSavedSearchRequest } from './savedSearches.types';

const SAVED_SEARCHES_ENDPOINT = '/api/saved-searches';

/**
 * Builds the endpoint URL for one saved search; the id is encoded so it
 * stays one path segment.
 *
 * @param {string} searchId Saved search identifier.
 * @returns {string} Endpoint URL for that search.
 */
const getSavedSearchEndpoint = (searchId: string): string =>
  `${SAVED_SEARCHES_ENDPOINT}/${encodeURIComponent(searchId)}`;

/**
 * Fetches every saved search.
 *
 * @returns {Promise<TSavedSearchResponse[]>} Saved searches as the API returns them.
 */
export const getSavedSearches = (): Promise<TSavedSearchResponse[]> =>
  USE_MOCK_SAVED_SEARCHES
    ? mockGetSavedSearches()
    : getJson<TSavedSearchResponse[]>(SAVED_SEARCHES_ENDPOINT, {
        errorCode: APP_ERROR_CODES.SAVED_SEARCH_REQUEST_FAILED,
        fallbackErrorMessage: getSavedSearchFallbackErrorMessage('listSearches'),
      });

/**
 * Creates a saved search.
 *
 * @param {TSaveSavedSearchRequest} payload The search's criteria.
 * @returns {Promise<TSavedSearchResponse>} The created search.
 */
export const createSavedSearch = (
  payload: TSaveSavedSearchRequest,
): Promise<TSavedSearchResponse> =>
  USE_MOCK_SAVED_SEARCHES
    ? mockCreateSavedSearch(payload)
    : postJson<TSavedSearchResponse, TSaveSavedSearchRequest>(SAVED_SEARCHES_ENDPOINT, payload, {
        errorCode: APP_ERROR_CODES.SAVED_SEARCH_REQUEST_FAILED,
        fallbackErrorMessage: getSavedSearchFallbackErrorMessage('createSearch'),
      });

/**
 * Replaces a saved search's criteria.
 *
 * @param {string} searchId Saved search identifier.
 * @param {TSaveSavedSearchRequest} payload Complete replacement.
 * @returns {Promise<TSavedSearchResponse>} The updated search.
 */
export const updateSavedSearch = (
  searchId: string,
  payload: TSaveSavedSearchRequest,
): Promise<TSavedSearchResponse> =>
  USE_MOCK_SAVED_SEARCHES
    ? mockUpdateSavedSearch(searchId, payload)
    : putJson<TSavedSearchResponse, TSaveSavedSearchRequest>(
        getSavedSearchEndpoint(searchId),
        payload,
        {
          errorCode: APP_ERROR_CODES.SAVED_SEARCH_REQUEST_FAILED,
          fallbackErrorMessage: getSavedSearchFallbackErrorMessage('updateSearch'),
        },
      );

/**
 * Deletes a saved search. The API answers 204 with no body.
 *
 * @param {string} searchId Saved search identifier.
 * @returns {Promise<void>} Resolves once the search is deleted.
 */
export const deleteSavedSearch = (searchId: string): Promise<void> =>
  USE_MOCK_SAVED_SEARCHES
    ? mockDeleteSavedSearch(searchId)
    : deleteJson<void>(getSavedSearchEndpoint(searchId), {
        errorCode: APP_ERROR_CODES.SAVED_SEARCH_REQUEST_FAILED,
        fallbackErrorMessage: getSavedSearchFallbackErrorMessage('deleteSearch'),
      });
