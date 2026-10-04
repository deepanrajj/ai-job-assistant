import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useJobDocuments } from './useJobDocuments';
import { MOCK_DOCUMENT_IDS, createMockDocumentResponse } from '../../test/mockDocuments';
import { MOCK_JOB_IDS } from '../../test/mockJobs';
import { server } from '../../test/server';
import type { IDocumentFormValues } from '../../services';

const JOB_ID = MOCK_JOB_IDS.celonis;
const documentsEndpoint = `/api/jobs/${JOB_ID}/documents`;
const documentEndpoint = `${documentsEndpoint}/${MOCK_DOCUMENT_IDS.primary}`;

const values: IDocumentFormValues = {
  notes: '',
  submittedAt: '2026-05-10',
  title: '  Cover letter v1 ',
  type: 'COVER_LETTER',
  url: '',
};

const renderLoadedHook = async () => {
  const hook = renderHook(() => useJobDocuments(JOB_ID));

  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));

  return hook;
};

describe('useJobDocuments', () => {
  it('loads and maps the job’s documents', async () => {
    server.use(
      http.get(documentsEndpoint, () =>
        HttpResponse.json([createMockDocumentResponse({ url: 'https://example.com' })]),
      ),
    );
    const { result } = await renderLoadedHook();

    expect(result.current.documents).toEqual([
      expect.objectContaining({ title: 'CV - backend v3', url: 'https://example.com' }),
    ]);
  });

  it('creates a document from raw form values and lists it', async () => {
    let body: unknown;
    const created = createMockDocumentResponse({ title: 'Cover letter v1' });
    server.use(
      http.post(documentsEndpoint, async ({ request }) => {
        body = await request.json();
        server.use(http.get(documentsEndpoint, () => HttpResponse.json([created])));

        return HttpResponse.json(created, { status: 201 });
      }),
    );
    const { result } = await renderLoadedHook();

    await act(() => result.current.createJobDocument(values));

    expect(body).toEqual({
      notes: null,
      submittedAt: '2026-05-10',
      title: 'Cover letter v1',
      type: 'COVER_LETTER',
      url: null,
    });
    expect(result.current.documents.map((document) => document.title)).toEqual(['Cover letter v1']);
  });

  it('keeps an updated document when the refresh after it fails', async () => {
    server.use(
      http.get(documentsEndpoint, () => HttpResponse.json([createMockDocumentResponse()])),
      http.put(documentEndpoint, () => {
        server.use(http.get(documentsEndpoint, () => new HttpResponse(null, { status: 500 })));

        return HttpResponse.json(createMockDocumentResponse({ submittedAt: '2026-05-12' }));
      }),
    );
    const { result } = await renderLoadedHook();

    await act(() => result.current.updateJobDocument(MOCK_DOCUMENT_IDS.primary, values));

    expect(result.current.loadError?.message).toBe('Failed to load documents');
    expect(result.current.documents[0]?.submittedAt).toBe('2026-05-12');
  });

  it('records a failed delete and rejects with it', async () => {
    server.use(
      http.get(documentsEndpoint, () => HttpResponse.json([createMockDocumentResponse()])),
      http.delete(documentEndpoint, () => new HttpResponse(null, { status: 500 })),
    );
    const { result } = await renderLoadedHook();

    await act(async () => {
      await expect(result.current.deleteJobDocument(MOCK_DOCUMENT_IDS.primary)).rejects.toThrow(
        'Failed to delete document',
      );
    });

    expect(result.current.mutationError?.message).toBe('Failed to delete document');
    expect(result.current.documents).toHaveLength(1);
  });
});
