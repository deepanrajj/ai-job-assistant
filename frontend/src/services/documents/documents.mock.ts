import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';
import type {
  TApplicationDocumentResponse,
  TCreateDocumentRequest,
  TDocumentResponse,
  TUpdateDocumentRequest,
} from './documents.types';
import { getJobs } from '../jobs';

/*
 * TEMPORARY MOCK - remove when the task 041 backend lands.
 *
 * Stands in for the document endpoints that do not exist yet, so the
 * Documents tab and the Applications page can be seen in the dev server
 * (`npm run dev:frontend`). Jobs still come from the real backend; only
 * documents are faked, in memory, so they reset on every page reload.
 *
 * To remove it, once the backend lands:
 * 1. Delete this file and `documents.mock.test.ts`.
 * 2. Delete the `USE_MOCK_DOCUMENTS` branches and the `./documents.mock`
 *    import in `documents.service.ts`.
 * 3. Delete `DOCUMENTS_FEATURE_ENABLED` in
 *    `features/documents/documents.constants.ts` and the places that read
 *    it, so built images show the documents UI.
 */

/**
 * On only in the Vite dev server (`development` mode). Off in built
 * images, where the documents UI is hidden by `DOCUMENTS_FEATURE_ENABLED`,
 * and off under Vitest, so every test uses the real request path.
 */
export const USE_MOCK_DOCUMENTS = import.meta.env.MODE === 'development';

/**
 * Documents per job, seeded the first time a job is read.
 */
const documentsByJob = new Map<string, TDocumentResponse[]>();

let createdCount = 0;

/**
 * Formats the local calendar date `offsetDays` from today as `YYYY-MM-DD`.
 */
const localDateFromToday = (offsetDays: number): string => {
  const date = new Date();

  date.setDate(date.getDate() + offsetDays);

  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

/**
 * A submitted CV and cover letter, and a portfolio link not sent yet.
 */
const seedDocuments = (jobId: string): TDocumentResponse[] => {
  const now = new Date().toISOString();
  const seed = (
    suffix: string,
    fields: Pick<TDocumentResponse, 'notes' | 'submittedAt' | 'title' | 'type' | 'url'>,
  ): TDocumentResponse => ({
    createdAt: now,
    id: `${jobId}-mock-${suffix}`,
    updatedAt: now,
    ...fields,
  });

  return [
    seed('cv', {
      notes: 'Backend-focused version with the payments project first.',
      submittedAt: localDateFromToday(-3),
      title: 'CV - backend v3',
      type: 'CV',
      url: null,
    }),
    seed('cover-letter', {
      notes: null,
      submittedAt: localDateFromToday(-3),
      title: 'Cover letter - platform team',
      type: 'COVER_LETTER',
      url: null,
    }),
    seed('portfolio', {
      notes: 'Send if they ask for code samples.',
      submittedAt: null,
      title: 'GitHub portfolio',
      type: 'PORTFOLIO',
      url: 'https://github.com/example/portfolio',
    }),
  ];
};

const getJobDocuments = (jobId: string): TDocumentResponse[] => {
  const existing = documentsByJob.get(jobId);

  if (existing) return existing;

  const seeded = seedDocuments(jobId);

  documentsByJob.set(jobId, seeded);

  return seeded;
};

const documentNotFound = (): AppError =>
  new AppError(
    'Document not found.',
    APP_ERROR_CODES.DOCUMENT_REQUEST_FAILED,
    404,
    'DOCUMENT_NOT_FOUND',
  );

/**
 * Mock of `GET /api/jobs/{jobId}/documents`.
 */
export const mockGetDocuments = async (jobId: string): Promise<TDocumentResponse[]> =>
  getJobDocuments(jobId).map((document) => ({ ...document }));

/**
 * Mock of `POST /api/jobs/{jobId}/documents`.
 */
export const mockCreateDocument = async (
  jobId: string,
  payload: TCreateDocumentRequest,
): Promise<TDocumentResponse> => {
  const now = new Date().toISOString();

  createdCount += 1;

  const created: TDocumentResponse = {
    ...payload,
    createdAt: now,
    id: `${jobId}-mock-created-${createdCount}`,
    updatedAt: now,
  };

  getJobDocuments(jobId).push(created);

  return { ...created };
};

/**
 * Mock of `PUT /api/jobs/{jobId}/documents/{documentId}`.
 */
export const mockUpdateDocument = async (
  jobId: string,
  documentId: string,
  payload: TUpdateDocumentRequest,
): Promise<TDocumentResponse> => {
  const document = getJobDocuments(jobId).find((candidate) => candidate.id === documentId);

  if (!document) throw documentNotFound();

  Object.assign(document, payload, { updatedAt: new Date().toISOString() });

  return { ...document };
};

/**
 * Mock of `DELETE /api/jobs/{jobId}/documents/{documentId}`.
 */
export const mockDeleteDocument = async (jobId: string, documentId: string): Promise<void> => {
  const documents = getJobDocuments(jobId);
  const index = documents.findIndex((candidate) => candidate.id === documentId);

  if (index === -1) throw documentNotFound();

  documents.splice(index, 1);
};

/**
 * Mock of `GET /api/application-documents`: every real job's mock
 * documents, most recently submitted first, unsent last.
 */
export const mockGetAllApplicationDocuments = async (): Promise<TApplicationDocumentResponse[]> => {
  const jobs = await getJobs();

  return jobs
    .flatMap((job) => getJobDocuments(job.id).map((document) => ({ ...document, jobId: job.id })))
    .sort((left, right) => {
      if (left.submittedAt === right.submittedAt) return left.id.localeCompare(right.id);
      if (left.submittedAt === null) return 1;
      if (right.submittedAt === null) return -1;

      return right.submittedAt.localeCompare(left.submittedAt);
    });
};

/**
 * Clears every mock document. For tests only.
 */
export const resetMockDocuments = (): void => {
  documentsByJob.clear();
  createdCount = 0;
};
