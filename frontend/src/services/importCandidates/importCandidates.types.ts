/**
 * Translation keys used for import candidate service fallback errors.
 */
export const IMPORT_CANDIDATE_FALLBACK_ERROR_TRANSLATION_KEYS = {
  listCandidates: 'importCandidates.fallbackError.listCandidates',
  createCandidate: 'importCandidates.fallbackError.createCandidate',
  updateCandidate: 'importCandidates.fallbackError.updateCandidate',
  deleteCandidate: 'importCandidates.fallbackError.deleteCandidate',
  importCandidates: 'importCandidates.fallbackError.importCandidates',
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
 * Where a candidate is in review: `PENDING` until it is imported as a
 * job, then `IMPORTED` for good.
 */
export type TImportCandidateReviewStatus = 'PENDING' | 'IMPORTED';

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

/**
 * Request body accepted by `POST /api/import-candidates/import`: the
 * candidates the user selected and confirmed.
 */
export type TImportCandidatesRequest = {
  candidateIds: string[];
};

/**
 * What happened to one candidate in an import. `jobId` is set when it was
 * imported; `errorCode` when it failed, e.g. `IMPORT_CANDIDATE_NOT_FOUND`
 * or `IMPORT_CANDIDATE_ALREADY_IMPORTED`.
 */
export type TImportCandidateResult = {
  candidateId: string;
  outcome: 'IMPORTED' | 'FAILED';
  jobId: string | null;
  errorCode: string | null;
};

/**
 * Response of `POST /api/import-candidates/import`: one result per
 * requested candidate. Each candidate is imported in its own transaction,
 * so some can succeed while others fail.
 */
export type TImportCandidatesResponse = {
  results: TImportCandidateResult[];
};
