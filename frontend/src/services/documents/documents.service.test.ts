import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createDocument,
  deleteDocument,
  getAllApplicationDocuments,
  getDocuments,
  updateDocument,
} from './documents.service';
import { deleteJson, getJson, postJson, putJson } from '../api';
import { AppError } from '../../errors';
import { createMockDocumentResponse } from '../../test/mockDocuments';
import { APP_ERROR_CODES } from '../../types';

vi.mock('../api', () => ({
  deleteJson: vi.fn(),
  getJson: vi.fn(),
  postJson: vi.fn(),
  putJson: vi.fn(),
}));

const JOB_ID = '6d58e422-3f47-4fd3-b08c-84b3a75347fc';
const DOCUMENT_ID = 'a3f1c9d2-8b4e-4f6a-9c2d-1e5f7a8b9c0d';
const documentResponse = createMockDocumentResponse({ id: DOCUMENT_ID });
const payload = {
  notes: null,
  submittedAt: '2026-05-10',
  title: 'CV - backend v3',
  type: 'CV' as const,
  url: null,
};

describe('documents.service', () => {
  beforeEach(() => {
    vi.mocked(getJson).mockResolvedValue([documentResponse]);
    vi.mocked(postJson).mockResolvedValue(documentResponse);
    vi.mocked(putJson).mockResolvedValue(documentResponse);
    vi.mocked(deleteJson).mockResolvedValue(undefined);
  });

  it("requests a job's documents with the list error mapping", async () => {
    expect(await getDocuments(JOB_ID)).toEqual([documentResponse]);
    expect(getJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/documents`, {
      errorCode: APP_ERROR_CODES.DOCUMENT_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to load documents',
    });
  });

  it('posts every field when creating a document', async () => {
    await createDocument(JOB_ID, payload);

    expect(postJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/documents`, payload, {
      errorCode: APP_ERROR_CODES.DOCUMENT_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to create document',
    });
  });

  it('replaces every field when updating a document', async () => {
    await updateDocument(JOB_ID, DOCUMENT_ID, payload);

    expect(putJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/documents/${DOCUMENT_ID}`, payload, {
      errorCode: APP_ERROR_CODES.DOCUMENT_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to update document',
    });
  });

  it('deletes a document', async () => {
    expect(await deleteDocument(JOB_ID, DOCUMENT_ID)).toBeUndefined();
    expect(deleteJson).toHaveBeenCalledWith(`/api/jobs/${JOB_ID}/documents/${DOCUMENT_ID}`, {
      errorCode: APP_ERROR_CODES.DOCUMENT_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to delete document',
    });
  });

  it('requests every job’s documents for the Applications page', async () => {
    await getAllApplicationDocuments();

    expect(getJson).toHaveBeenCalledWith('/api/application-documents', {
      errorCode: APP_ERROR_CODES.DOCUMENT_REQUEST_FAILED,
      fallbackErrorMessage: 'Failed to load application documents',
    });
  });

  it('encodes both ids so neither can escape its path segment', async () => {
    await updateDocument('../ai/health', '../x/documents/y', payload);
    await deleteDocument('../ai/health', '../x/documents/y');

    const expectedUrl = '/api/jobs/..%2Fai%2Fhealth/documents/..%2Fx%2Fdocuments%2Fy';
    expect(putJson).toHaveBeenCalledWith(expectedUrl, expect.anything(), expect.anything());
    expect(deleteJson).toHaveBeenCalledWith(expectedUrl, expect.anything());
  });

  it('lets AppError instances from the API client through untouched', async () => {
    const apiError = new AppError('Job not found', APP_ERROR_CODES.DOCUMENT_REQUEST_FAILED);
    vi.mocked(getJson).mockRejectedValue(apiError);

    await expect(getDocuments(JOB_ID)).rejects.toBe(apiError);
  });
});
