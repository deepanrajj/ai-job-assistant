import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';

import {
  USE_MOCK_DOCUMENTS,
  mockCreateDocument,
  mockDeleteDocument,
  mockGetAllApplicationDocuments,
  mockGetDocuments,
  mockUpdateDocument,
  resetMockDocuments,
} from './documents.mock';
import { MOCK_JOB_IDS, createMockJobResponses } from '../../test/mockJobs';
import { server } from '../../test/server';

/*
 * TEMPORARY: covers documents.mock.ts, and goes with it when the task 041
 * backend lands.
 */

const JOB_ID = MOCK_JOB_IDS.celonis;
const payload = {
  notes: null,
  submittedAt: null,
  title: 'Cover letter v2',
  type: 'COVER_LETTER' as const,
  url: null,
};

describe('documents.mock', () => {
  beforeEach(() => {
    resetMockDocuments();
  });

  it('is off outside the dev server, including under Vitest', () => {
    expect(USE_MOCK_DOCUMENTS).toBe(false);
  });

  it('seeds a submitted CV and cover letter and an unsent portfolio link per job', async () => {
    const documents = await mockGetDocuments(JOB_ID);

    expect(documents.map((document) => [document.type, document.submittedAt === null])).toEqual([
      ['CV', false],
      ['COVER_LETTER', false],
      ['PORTFOLIO', true],
    ]);
  });

  it('creates, updates, and deletes a document', async () => {
    const created = await mockCreateDocument(JOB_ID, payload);
    const updated = await mockUpdateDocument(JOB_ID, created.id, {
      ...payload,
      submittedAt: '2026-05-10',
    });

    expect(updated.submittedAt).toBe('2026-05-10');

    await mockDeleteDocument(JOB_ID, created.id);

    expect((await mockGetDocuments(JOB_ID)).map((document) => document.id)).not.toContain(
      created.id,
    );
  });

  it('rejects an unknown document like the API would', async () => {
    await expect(mockUpdateDocument(JOB_ID, 'missing', payload)).rejects.toMatchObject({
      apiCode: 'DOCUMENT_NOT_FOUND',
      status: 404,
    });
    await expect(mockDeleteDocument(JOB_ID, 'missing')).rejects.toMatchObject({ status: 404 });
  });

  it('lists every real job’s documents, most recently submitted first and unsent last', async () => {
    server.use(
      http.get('/api/jobs', () => HttpResponse.json(createMockJobResponses().slice(0, 2))),
    );
    await mockCreateDocument(JOB_ID, { ...payload, submittedAt: '2999-01-01' });

    const documents = await mockGetAllApplicationDocuments();

    expect(documents).toHaveLength(7);
    expect(documents[0]).toMatchObject({ jobId: JOB_ID, submittedAt: '2999-01-01' });
    expect(documents.slice(-2).every((document) => document.submittedAt === null)).toBe(true);
  });
});
