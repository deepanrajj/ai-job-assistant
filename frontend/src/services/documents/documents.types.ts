import type { TJobDocumentType } from '../../types';

/**
 * Translation keys used for document service fallback errors.
 */
export const DOCUMENT_FALLBACK_ERROR_TRANSLATION_KEYS = {
  listDocuments: 'documents.fallbackError.listDocuments',
  createDocument: 'documents.fallbackError.createDocument',
  updateDocument: 'documents.fallbackError.updateDocument',
  deleteDocument: 'documents.fallbackError.deleteDocument',
  listAllDocuments: 'documents.fallbackError.listAllDocuments',
} as const;

/**
 * Supported document fallback error lookup keys.
 */
export type TDocumentFallbackErrorKey = keyof typeof DOCUMENT_FALLBACK_ERROR_TRANSLATION_KEYS;

/**
 * Wire representation of a document exactly as
 * `/api/jobs/{jobId}/documents` returns it. Excludes `jobId`, which the
 * route already carries. The backend sends `null` for unset optional
 * fields; `submittedAt` is a `YYYY-MM-DD` date.
 */
export type TDocumentResponse = {
  id: string;
  type: TJobDocumentType;
  title: string;
  url: string | null;
  submittedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * One item of `GET /api/application-documents`, every job's documents in
 * one list. Carries `jobId`, which a cross-job read cannot leave out.
 */
export type TApplicationDocumentResponse = TDocumentResponse & {
  jobId: string;
};

/**
 * Request body accepted by `POST /api/jobs/{jobId}/documents`. `type` and
 * `title` are required; every other field must be sent, but may be null.
 */
export type TCreateDocumentRequest = {
  type: TJobDocumentType;
  title: string;
  url: string | null;
  submittedAt: string | null;
  notes: string | null;
};

/**
 * Request body accepted by `PUT /api/jobs/{jobId}/documents/{documentId}`:
 * a full replacement, the same shape as create.
 */
export type TUpdateDocumentRequest = TCreateDocumentRequest;
