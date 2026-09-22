import { translate } from '../../i18n';
import type { TJobNote } from '../../types';
import {
  NOTE_FALLBACK_ERROR_TRANSLATION_KEYS,
  type TNoteFallbackErrorKey,
  type TNoteResponse,
} from './notes.types';

/**
 * Resolves the localized fallback error message for a note service operation.
 *
 * @param {TNoteFallbackErrorKey} key Note operation key used to select the fallback message.
 * @returns {string} Localized fallback error message.
 */
export const getNoteFallbackErrorMessage = (key: TNoteFallbackErrorKey): string =>
  translate(NOTE_FALLBACK_ERROR_TRANSLATION_KEYS[key]);

/**
 * Converts a note API response into the note model the UI renders.
 *
 * Drops `updatedAt`, which `TJobNote` has no field for.
 *
 * @param {TNoteResponse} response Note exactly as `/api/jobs/{jobId}/notes` returned it.
 * @returns {TJobNote} Note in the shape every screen consumes.
 */
export const mapNoteResponseToJobNote = (response: TNoteResponse): TJobNote => ({
  id: response.id,
  body: response.body,
  createdAt: response.createdAt,
});
