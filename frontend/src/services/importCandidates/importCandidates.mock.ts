import { mapCandidateToJobRequest } from './importCandidates.utils';
import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';
import type {
  TImportCandidateResponse,
  TImportCandidateResult,
  TImportCandidatesResponse,
  TSaveImportCandidateRequest,
} from './importCandidates.types';
import { createJob } from '../jobs';

/*
 * TEMPORARY MOCK - remove when the task 047 backend lands.
 *
 * Stands in for `/api/import-candidates`, which does not exist yet, so the
 * candidate review can be seen in the dev server (`npm run dev:frontend`).
 * Candidates live in memory and reset on every page reload.
 *
 * To remove it, once the backend lands:
 * 1. Delete this file and the mock block in `importCandidates.test.ts`.
 * 2. Delete the `USE_MOCK_IMPORT_CANDIDATES` branches and the
 *    `./importCandidates.mock` import in `importCandidates.service.ts`.
 * 3. Delete `IMPORT_CANDIDATES_FEATURE_ENABLED` in
 *    `features/discover/importCandidates.constants.ts` and the places that
 *    read it, so built images show the section.
 */

/**
 * On only in the Vite dev server (`development` mode). Off in built images
 * and under Vitest.
 */
export const USE_MOCK_IMPORT_CANDIDATES = import.meta.env.MODE === 'development';

const seedCandidates = (): TImportCandidateResponse[] => {
  const now = new Date().toISOString();
  const candidate = (
    id: string,
    content: TImportCandidateResponse['content'],
    sourceUrl: string | null,
  ): TImportCandidateResponse => ({
    content,
    createdAt: now,
    duplicateStatus: 'UNCHECKED',
    id,
    reviewStatus: 'PENDING',
    source: 'MANUAL',
    sourceUrl,
    updatedAt: now,
  });

  return [
    candidate(
      'mock-candidate-1',
      {
        company: 'N26',
        description: 'Build payment APIs in Kotlin.\nOwn services end to end.',
        location: 'Berlin',
        roleTitle: 'Senior Backend Engineer',
      },
      'https://example.com/jobs/n26-backend',
    ),
    candidate(
      'mock-candidate-2',
      {
        company: 'Zalando',
        description: 'React and TypeScript for the checkout team.',
        location: 'Remote EU',
        roleTitle: 'Frontend Engineer',
      },
      null,
    ),
  ];
};

let candidates: TImportCandidateResponse[] | null = null;
let createdCount = 0;

const getCandidates = (): TImportCandidateResponse[] => {
  if (!candidates) candidates = seedCandidates();

  return candidates;
};

const copy = (candidate: TImportCandidateResponse): TImportCandidateResponse =>
  JSON.parse(JSON.stringify(candidate)) as TImportCandidateResponse;

const candidateNotFound = (): AppError =>
  new AppError(
    'Import candidate not found.',
    APP_ERROR_CODES.IMPORT_CANDIDATE_REQUEST_FAILED,
    404,
    'IMPORT_CANDIDATE_NOT_FOUND',
  );

/**
 * Mock of `GET /api/import-candidates`.
 */
export const mockGetImportCandidates = async (): Promise<TImportCandidateResponse[]> =>
  getCandidates().map(copy);

/**
 * Mock of `POST /api/import-candidates`: a manual, unchecked, pending
 * candidate.
 */
export const mockCreateImportCandidate = async (
  payload: TSaveImportCandidateRequest,
): Promise<TImportCandidateResponse> => {
  const now = new Date().toISOString();

  createdCount += 1;

  const created = copy({
    content: payload.content,
    createdAt: now,
    duplicateStatus: 'UNCHECKED',
    id: `mock-candidate-created-${createdCount}`,
    reviewStatus: 'PENDING',
    source: 'MANUAL',
    sourceUrl: payload.sourceUrl,
    updatedAt: now,
  });

  getCandidates().push(created);

  return copy(created);
};

/**
 * Mock of `PUT /api/import-candidates/{id}`.
 */
export const mockUpdateImportCandidate = async (
  candidateId: string,
  payload: TSaveImportCandidateRequest,
): Promise<TImportCandidateResponse> => {
  const candidate = getCandidates().find((item) => item.id === candidateId);

  if (!candidate) throw candidateNotFound();

  candidate.content = { ...payload.content };
  candidate.sourceUrl = payload.sourceUrl;
  candidate.updatedAt = new Date().toISOString();

  return copy(candidate);
};

/**
 * Mock of `DELETE /api/import-candidates/{id}`.
 */
export const mockDeleteImportCandidate = async (candidateId: string): Promise<void> => {
  const list = getCandidates();
  const index = list.findIndex((item) => item.id === candidateId);

  if (index === -1) throw candidateNotFound();

  list.splice(index, 1);
};

/**
 * Mock of `POST /api/import-candidates/import`. Creates each job through
 * the real `POST /api/jobs` with the import mapping, then marks the
 * candidate imported, so imported jobs really appear in the dev server's
 * Jobs list. One candidate failing does not stop the others.
 */
export const mockImportCandidatesAsJobs = async (
  candidateIds: string[],
): Promise<TImportCandidatesResponse> => {
  const results: TImportCandidateResult[] = [];

  for (const candidateId of candidateIds) {
    const candidate = getCandidates().find((item) => item.id === candidateId);
    const failed = (errorCode: string): TImportCandidateResult => ({
      candidateId,
      errorCode,
      jobId: null,
      outcome: 'FAILED',
    });

    if (!candidate) {
      results.push(failed('IMPORT_CANDIDATE_NOT_FOUND'));
      continue;
    }

    if (candidate.reviewStatus === 'IMPORTED') {
      results.push(failed('IMPORT_CANDIDATE_ALREADY_IMPORTED'));
      continue;
    }

    try {
      const job = await createJob(mapCandidateToJobRequest(candidate));

      candidate.reviewStatus = 'IMPORTED';
      candidate.updatedAt = new Date().toISOString();
      results.push({ candidateId, errorCode: null, jobId: job.id, outcome: 'IMPORTED' });
    } catch (error) {
      results.push(
        failed(error instanceof AppError && error.apiCode ? error.apiCode : 'JOB_CREATE_FAILED'),
      );
    }
  }

  return { results };
};

/**
 * Restores the seeded candidates. For tests only.
 */
export const resetMockImportCandidates = (): void => {
  candidates = null;
  createdCount = 0;
};
