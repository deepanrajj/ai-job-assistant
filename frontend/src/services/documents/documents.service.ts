import { deleteJson, getJson, postJson, putJson } from '../api';
import { getDocumentFallbackErrorMessage } from './documents.utils';
// TEMPORARY: remove this import and every USE_MOCK_DOCUMENTS branch below
// when the task 041 backend lands. See documents.mock.ts.
import {
  USE_MOCK_DOCUMENTS,
  mockCreateDocument,
  mockDeleteDocument,
  mockGetAllApplicationDocuments,
  mockGetDocuments,
  mockUpdateDocument,
} from './documents.mock';
import { APP_ERROR_CODES } from '../../types';
import type {
  TApplicationDocumentResponse,
  TCreateDocumentRequest,
  TDocumentResponse,
  TUpdateDocumentRequest,
} from './documents.types';

/**
 * Builds the endpoint URL for a job's documents. The job id is encoded
 * because it reaches this service from a route param.
 *
 * @param {string} jobId Job identifier.
 * @returns {string} Endpoint URL for that job's documents.
 */
const getDocumentsEndpoint = (jobId: string): string =>
  `/api/jobs/${encodeURIComponent(jobId)}/documents`;

/**
 * Builds the endpoint URL for a single document under a job.
 *
 * @param {string} jobId Job identifier.
 * @param {string} documentId Document identifier.
 * @returns {string} Endpoint URL for that document.
 */
const getDocumentEndpoint = (jobId: string, documentId: string): string =>
  `${getDocumentsEndpoint(jobId)}/${encodeURIComponent(documentId)}`;

/**
 * Fetches a job's documents.
 *
 * @param {string} jobId Job identifier.
 * @returns {Promise<TDocumentResponse[]>} Documents as the API returns them.
 */
export const getDocuments = (jobId: string): Promise<TDocumentResponse[]> =>
  USE_MOCK_DOCUMENTS
    ? mockGetDocuments(jobId)
    : getJson<TDocumentResponse[]>(getDocumentsEndpoint(jobId), {
        errorCode: APP_ERROR_CODES.DOCUMENT_REQUEST_FAILED,
        fallbackErrorMessage: getDocumentFallbackErrorMessage('listDocuments'),
      });

/**
 * Creates a document under a job.
 *
 * @param {string} jobId Job identifier.
 * @param {TCreateDocumentRequest} payload Document creation request body.
 * @returns {Promise<TDocumentResponse>} The created document.
 */
export const createDocument = (
  jobId: string,
  payload: TCreateDocumentRequest,
): Promise<TDocumentResponse> =>
  USE_MOCK_DOCUMENTS
    ? mockCreateDocument(jobId, payload)
    : postJson<TDocumentResponse, TCreateDocumentRequest>(getDocumentsEndpoint(jobId), payload, {
        errorCode: APP_ERROR_CODES.DOCUMENT_REQUEST_FAILED,
        fallbackErrorMessage: getDocumentFallbackErrorMessage('createDocument'),
      });

/**
 * Replaces every editable field of a document.
 *
 * @param {string} jobId Job identifier.
 * @param {string} documentId Document identifier.
 * @param {TUpdateDocumentRequest} payload Complete replacement request body.
 * @returns {Promise<TDocumentResponse>} The updated document.
 */
export const updateDocument = (
  jobId: string,
  documentId: string,
  payload: TUpdateDocumentRequest,
): Promise<TDocumentResponse> =>
  USE_MOCK_DOCUMENTS
    ? mockUpdateDocument(jobId, documentId, payload)
    : putJson<TDocumentResponse, TUpdateDocumentRequest>(
        getDocumentEndpoint(jobId, documentId),
        payload,
        {
          errorCode: APP_ERROR_CODES.DOCUMENT_REQUEST_FAILED,
          fallbackErrorMessage: getDocumentFallbackErrorMessage('updateDocument'),
        },
      );

/**
 * Deletes a document. The API answers 204 with no body.
 *
 * @param {string} jobId Job identifier.
 * @param {string} documentId Document identifier.
 * @returns {Promise<void>} Resolves once the document is deleted.
 */
export const deleteDocument = (jobId: string, documentId: string): Promise<void> =>
  USE_MOCK_DOCUMENTS
    ? mockDeleteDocument(jobId, documentId)
    : deleteJson<void>(getDocumentEndpoint(jobId, documentId), {
        errorCode: APP_ERROR_CODES.DOCUMENT_REQUEST_FAILED,
        fallbackErrorMessage: getDocumentFallbackErrorMessage('deleteDocument'),
      });

/**
 * Fetches every job's documents in one list, most recently submitted
 * first and unsent documents last, for the Applications page.
 *
 * @returns {Promise<TApplicationDocumentResponse[]>} Documents with their job ids.
 */
export const getAllApplicationDocuments = (): Promise<TApplicationDocumentResponse[]> =>
  USE_MOCK_DOCUMENTS
    ? mockGetAllApplicationDocuments()
    : getJson<TApplicationDocumentResponse[]>('/api/application-documents', {
        errorCode: APP_ERROR_CODES.DOCUMENT_REQUEST_FAILED,
        fallbackErrorMessage: getDocumentFallbackErrorMessage('listAllDocuments'),
      });
