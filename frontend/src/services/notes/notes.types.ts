/**
 * Translation keys used for note service fallback errors.
 */
export const NOTE_FALLBACK_ERROR_TRANSLATION_KEYS = {
  listNotes: 'notes.fallbackError.listNotes',
  createNote: 'notes.fallbackError.createNote',
  updateNote: 'notes.fallbackError.updateNote',
  deleteNote: 'notes.fallbackError.deleteNote',
} as const;

/**
 * Supported note fallback error lookup keys.
 */
export type TNoteFallbackErrorKey = keyof typeof NOTE_FALLBACK_ERROR_TRANSLATION_KEYS;

/**
 * Wire representation of a note exactly as
 * `/api/jobs/{jobId}/notes` returns it.
 *
 * Excludes `jobId`: every route already carries it in the path, so the
 * backend does not repeat it in the response body.
 */
export type TNoteResponse = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Request body accepted by `POST /api/jobs/{jobId}/notes`.
 */
export type TCreateNoteRequest = {
  body: string;
};

/**
 * Request body accepted by `PUT /api/jobs/{jobId}/notes/{noteId}`.
 */
export type TUpdateNoteRequest = {
  body: string;
};
