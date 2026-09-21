import { deleteJson, getJson, postJson, putJson } from '../api';
import { getNoteFallbackErrorMessage } from './notes.utils';
import { APP_ERROR_CODES } from '../../types';
import type { TCreateNoteRequest, TNoteResponse, TUpdateNoteRequest } from './notes.types';

/**
 * Builds the endpoint URL for a job's notes.
 *
 * The job id is encoded because it reaches this service from a route param,
 * and an unencoded one does not stay a path segment.
 *
 * @param {string} jobId Job identifier.
 * @returns {string} Endpoint URL for that job's notes.
 */
const getNotesEndpoint = (jobId: string): string => `/api/jobs/${encodeURIComponent(jobId)}/notes`;

/**
 * Builds the endpoint URL for a single note under a job.
 *
 * @param {string} jobId Job identifier.
 * @param {string} noteId Note identifier.
 * @returns {string} Endpoint URL for that note.
 */
const getNoteEndpoint = (jobId: string, noteId: string): string =>
  `${getNotesEndpoint(jobId)}/${encodeURIComponent(noteId)}`;

/**
 * Fetches a job's notes, oldest first.
 *
 * @param {string} jobId Job identifier.
 * @returns {Promise<TNoteResponse[]>} Notes as the API returns them.
 */
export const getNotes = (jobId: string): Promise<TNoteResponse[]> =>
  getJson<TNoteResponse[]>(getNotesEndpoint(jobId), {
    errorCode: APP_ERROR_CODES.NOTE_REQUEST_FAILED,
    fallbackErrorMessage: getNoteFallbackErrorMessage('listNotes'),
  });

/**
 * Creates a note under a job.
 *
 * @param {string} jobId Job identifier.
 * @param {TCreateNoteRequest} payload Note creation request body.
 * @returns {Promise<TNoteResponse>} The created note, including its server-assigned id.
 */
export const createNote = (jobId: string, payload: TCreateNoteRequest): Promise<TNoteResponse> =>
  postJson<TNoteResponse, TCreateNoteRequest>(getNotesEndpoint(jobId), payload, {
    errorCode: APP_ERROR_CODES.NOTE_REQUEST_FAILED,
    fallbackErrorMessage: getNoteFallbackErrorMessage('createNote'),
  });

/**
 * Replaces the body of a note.
 *
 * @param {string} jobId Job identifier.
 * @param {string} noteId Note identifier.
 * @param {TUpdateNoteRequest} payload Complete replacement request body.
 * @returns {Promise<TNoteResponse>} The updated note as the API returns it.
 */
export const updateNote = (
  jobId: string,
  noteId: string,
  payload: TUpdateNoteRequest,
): Promise<TNoteResponse> =>
  putJson<TNoteResponse, TUpdateNoteRequest>(getNoteEndpoint(jobId, noteId), payload, {
    errorCode: APP_ERROR_CODES.NOTE_REQUEST_FAILED,
    fallbackErrorMessage: getNoteFallbackErrorMessage('updateNote'),
  });

/**
 * Deletes a note.
 *
 * The API answers 204 with no body, so this resolves to undefined.
 *
 * @param {string} jobId Job identifier.
 * @param {string} noteId Note identifier.
 * @returns {Promise<void>} Resolves once the note is deleted.
 */
export const deleteNote = (jobId: string, noteId: string): Promise<void> =>
  deleteJson<void>(getNoteEndpoint(jobId, noteId), {
    errorCode: APP_ERROR_CODES.NOTE_REQUEST_FAILED,
    fallbackErrorMessage: getNoteFallbackErrorMessage('deleteNote'),
  });
