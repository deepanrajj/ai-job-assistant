import { deleteJson, getJson, postJson, putJson } from '../api';
import { getImportCandidateFallbackErrorMessage } from './importCandidates.utils';
// TEMPORARY: remove this import and every USE_MOCK_IMPORT_CANDIDATES
// branch below when the task 047 backend lands. See importCandidates.mock.ts.
import {
  USE_MOCK_IMPORT_CANDIDATES,
  mockCreateImportCandidate,
  mockDeleteImportCandidate,
  mockGetImportCandidates,
  mockImportCandidatesAsJobs,
  mockUpdateImportCandidate,
} from './importCandidates.mock';
import { APP_ERROR_CODES } from '../../types';
import type {
  TImportCandidateResponse,
  TImportCandidatesRequest,
  TImportCandidatesResponse,
  TSaveImportCandidateRequest,
} from './importCandidates.types';

const IMPORT_CANDIDATES_ENDPOINT = '/api/import-candidates';

/**
 * Builds the endpoint URL for one candidate; the id is encoded so it stays
 * one path segment.
 *
 * @param {string} candidateId Candidate identifier.
 * @returns {string} Endpoint URL for that candidate.
 */
const getImportCandidateEndpoint = (candidateId: string): string =>
  `${IMPORT_CANDIDATES_ENDPOINT}/${encodeURIComponent(candidateId)}`;

/**
 * Fetches every import candidate. Candidates are not jobs; nothing here
 * touches `/api/jobs`.
 *
 * @returns {Promise<TImportCandidateResponse[]>} Candidates as the API returns them.
 */
export const getImportCandidates = (): Promise<TImportCandidateResponse[]> =>
  USE_MOCK_IMPORT_CANDIDATES
    ? mockGetImportCandidates()
    : getJson<TImportCandidateResponse[]>(IMPORT_CANDIDATES_ENDPOINT, {
        errorCode: APP_ERROR_CODES.IMPORT_CANDIDATE_REQUEST_FAILED,
        fallbackErrorMessage: getImportCandidateFallbackErrorMessage('listCandidates'),
      });

/**
 * Saves a manually entered candidate.
 *
 * @param {TSaveImportCandidateRequest} payload Source link and job details.
 * @returns {Promise<TImportCandidateResponse>} The created candidate.
 */
export const createImportCandidate = (
  payload: TSaveImportCandidateRequest,
): Promise<TImportCandidateResponse> =>
  USE_MOCK_IMPORT_CANDIDATES
    ? mockCreateImportCandidate(payload)
    : postJson<TImportCandidateResponse, TSaveImportCandidateRequest>(
        IMPORT_CANDIDATES_ENDPOINT,
        payload,
        {
          errorCode: APP_ERROR_CODES.IMPORT_CANDIDATE_REQUEST_FAILED,
          fallbackErrorMessage: getImportCandidateFallbackErrorMessage('createCandidate'),
        },
      );

/**
 * Corrects a candidate's source link and job details.
 *
 * @param {string} candidateId Candidate identifier.
 * @param {TSaveImportCandidateRequest} payload Complete replacement.
 * @returns {Promise<TImportCandidateResponse>} The updated candidate.
 */
export const updateImportCandidate = (
  candidateId: string,
  payload: TSaveImportCandidateRequest,
): Promise<TImportCandidateResponse> =>
  USE_MOCK_IMPORT_CANDIDATES
    ? mockUpdateImportCandidate(candidateId, payload)
    : putJson<TImportCandidateResponse, TSaveImportCandidateRequest>(
        getImportCandidateEndpoint(candidateId),
        payload,
        {
          errorCode: APP_ERROR_CODES.IMPORT_CANDIDATE_REQUEST_FAILED,
          fallbackErrorMessage: getImportCandidateFallbackErrorMessage('updateCandidate'),
        },
      );

/**
 * Deletes a candidate. The API answers 204 with no body.
 *
 * @param {string} candidateId Candidate identifier.
 * @returns {Promise<void>} Resolves once the candidate is deleted.
 */
export const deleteImportCandidate = (candidateId: string): Promise<void> =>
  USE_MOCK_IMPORT_CANDIDATES
    ? mockDeleteImportCandidate(candidateId)
    : deleteJson<void>(getImportCandidateEndpoint(candidateId), {
        errorCode: APP_ERROR_CODES.IMPORT_CANDIDATE_REQUEST_FAILED,
        fallbackErrorMessage: getImportCandidateFallbackErrorMessage('deleteCandidate'),
      });

/**
 * Imports the selected, confirmed candidates as saved jobs. The server
 * creates each job through its normal job creation and marks the
 * candidate imported in the same transaction, one candidate at a time,
 * and reports each outcome.
 *
 * @param {string[]} candidateIds Candidates to import.
 * @returns {Promise<TImportCandidatesResponse>} One result per candidate.
 */
export const importCandidatesAsJobs = (
  candidateIds: string[],
): Promise<TImportCandidatesResponse> =>
  USE_MOCK_IMPORT_CANDIDATES
    ? mockImportCandidatesAsJobs(candidateIds)
    : postJson<TImportCandidatesResponse, TImportCandidatesRequest>(
        `${IMPORT_CANDIDATES_ENDPOINT}/import`,
        { candidateIds },
        {
          errorCode: APP_ERROR_CODES.IMPORT_CANDIDATE_REQUEST_FAILED,
          fallbackErrorMessage: getImportCandidateFallbackErrorMessage('importCandidates'),
        },
      );
