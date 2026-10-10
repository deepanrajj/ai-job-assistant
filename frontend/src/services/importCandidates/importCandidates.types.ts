/**
 * Translation keys used for import candidate service fallback errors.
 */
export const IMPORT_CANDIDATE_FALLBACK_ERROR_TRANSLATION_KEYS = {
  listCandidates: 'importCandidates.fallbackError.listCandidates',
  createCandidate: 'importCandidates.fallbackError.createCandidate',
  updateCandidate: 'importCandidates.fallbackError.updateCandidate',
  deleteCandidate: 'importCandidates.fallbackError.deleteCandidate',
} as const;

/**
 * Supported import candidate fallback error lookup keys.
 */
export type TImportCandidateFallbackErrorKey =
  keyof typeof IMPORT_CANDIDATE_FALLBACK_ERROR_TRANSLATION_KEYS;

/**
 * Where a candidate came from. Only manual intake exists so far; CSV,
 * browser extension, and AI discovery add values later.
 */
export type TImportCandidateSource = 'MANUAL';

/**
 * Whether a candidate duplicates a saved job. `UNCHECKED` until task 048
 * classifies it.
 */
export type TImportCandidateDuplicateStatus = 'UNCHECKED';

/**
 * Where a candidate is in review. `PENDING` until task 049 imports it.
 */
export type TImportCandidateReviewStatus = 'PENDING';

/**
 * The job details a candidate carries, stored by the backend as one JSON
 * document (`contentJson`). `description` is the pasted text, shown as
 * text only.
 */
export type TImportCandidateContent = {
  company: string;
  roleTitle: string;
  location: string;
  description: string;
};

/**
 * Wire representation of a candidate as `/api/import-candidates` returns
 * it. `sourceUrl` is metadata only and is never fetched.
 */
export type TImportCandidateResponse = {
  id: string;
  source: TImportCandidateSource;
  sourceUrl: string | null;
  content: TImportCandidateContent;
  duplicateStatus: TImportCandidateDuplicateStatus;
  reviewStatus: TImportCandidateReviewStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * Request body accepted by `POST /api/import-candidates` and, as a full
 * replacement of what the user controls, `PUT /api/import-candidates/{id}`.
 * The server sets the source and both statuses.
 */
export type TSaveImportCandidateRequest = {
  sourceUrl: string | null;
  content: TImportCandidateContent;
};
