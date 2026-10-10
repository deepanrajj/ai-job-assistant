import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  USE_MOCK_IMPORT_CANDIDATES,
  mockCreateImportCandidate,
  mockDeleteImportCandidate,
  mockGetImportCandidates,
  mockUpdateImportCandidate,
  resetMockImportCandidates,
} from './importCandidates.mock';
import {
  createImportCandidate,
  deleteImportCandidate,
  getImportCandidates,
  updateImportCandidate,
} from './importCandidates.service';
import { deleteJson, getJson, postJson, putJson } from '../api';
import { buildImportCandidateRequest } from './importCandidates.utils';
import { APP_ERROR_CODES } from '../../types';

vi.mock('../api', () => ({
  deleteJson: vi.fn(),
  getJson: vi.fn(),
  postJson: vi.fn(),
  putJson: vi.fn(),
}));

const body = buildImportCandidateRequest({
  company: 'N26',
  description: 'Text',
  location: '',
  roleTitle: 'Engineer',
  sourceUrl: '',
});

describe('importCandidates.utils', () => {
  it('trims text and sends a blank link as null', () => {
    expect(body).toEqual({
      content: { company: 'N26', description: 'Text', location: '', roleTitle: 'Engineer' },
      sourceUrl: null,
    });
  });
});

describe('importCandidates.service', () => {
  beforeEach(() => {
    vi.mocked(getJson).mockResolvedValue([]);
    vi.mocked(postJson).mockResolvedValue({});
    vi.mocked(putJson).mockResolvedValue({});
    vi.mocked(deleteJson).mockResolvedValue(undefined);
  });

  it('reads, creates, corrects, and deletes at /api/import-candidates', async () => {
    await getImportCandidates();
    await createImportCandidate(body);
    await updateImportCandidate('c 1', body);
    await deleteImportCandidate('c 1');

    const options = (message: string) => ({
      errorCode: APP_ERROR_CODES.IMPORT_CANDIDATE_REQUEST_FAILED,
      fallbackErrorMessage: message,
    });

    expect(getJson).toHaveBeenCalledWith(
      '/api/import-candidates',
      options('Failed to load import candidates'),
    );
    expect(postJson).toHaveBeenCalledWith(
      '/api/import-candidates',
      body,
      options('Failed to save candidate'),
    );
    expect(putJson).toHaveBeenCalledWith(
      '/api/import-candidates/c%201',
      body,
      options('Failed to save candidate changes'),
    );
    expect(deleteJson).toHaveBeenCalledWith(
      '/api/import-candidates/c%201',
      options('Failed to delete candidate'),
    );
  });
});

/*
 * TEMPORARY: covers importCandidates.mock.ts, and goes with it when the
 * task 047 backend lands.
 */
describe('importCandidates.mock', () => {
  beforeEach(() => {
    resetMockImportCandidates();
  });

  it('is off outside the dev server, including under Vitest', () => {
    expect(USE_MOCK_IMPORT_CANDIDATES).toBe(false);
  });

  it('creates manual, unchecked, pending candidates, then corrects and deletes them', async () => {
    expect(await mockGetImportCandidates()).toHaveLength(2);

    const created = await mockCreateImportCandidate(body);

    expect(created).toMatchObject({
      duplicateStatus: 'UNCHECKED',
      reviewStatus: 'PENDING',
      source: 'MANUAL',
    });

    const corrected = await mockUpdateImportCandidate(created.id, {
      ...body,
      sourceUrl: 'https://example.com',
    });

    expect(corrected.sourceUrl).toBe('https://example.com');

    await mockDeleteImportCandidate(created.id);

    expect(await mockGetImportCandidates()).toHaveLength(2);
    await expect(mockDeleteImportCandidate('missing')).rejects.toMatchObject({ status: 404 });
  });
});
