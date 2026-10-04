import type { TDocumentResponse } from '../services';

/**
 * Ids of the documents a test can address without hardcoding a UUID.
 */
export const MOCK_DOCUMENT_IDS = {
  primary: 'a5555555-5555-4555-8555-555555555555',
  secondary: 'b6666666-6666-4666-8666-666666666666',
} as const;

/**
 * Creates a mock wire document, shaped exactly as
 * `GET /api/jobs/{jobId}/documents` returns one. Not sent by default.
 *
 * @param {Partial<TDocumentResponse>} overrides Wire fields that should differ from the default.
 * @returns {TDocumentResponse} Mock document response.
 */
export const createMockDocumentResponse = (
  overrides: Partial<TDocumentResponse> = {},
): TDocumentResponse => ({
  id: MOCK_DOCUMENT_IDS.primary,
  type: 'CV',
  title: 'CV - backend v3',
  url: null,
  submittedAt: null,
  notes: null,
  createdAt: '2026-05-01T09:00:00.123456Z',
  updatedAt: '2026-05-01T09:00:00.123456Z',
  ...overrides,
});
