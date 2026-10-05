import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  USE_MOCK_SAVED_SEARCHES,
  mockCreateSavedSearch,
  mockDeleteSavedSearch,
  mockGetSavedSearches,
  mockUpdateSavedSearch,
  resetMockSavedSearches,
} from './savedSearches.mock';
import {
  createSavedSearch,
  deleteSavedSearch,
  getSavedSearches,
  updateSavedSearch,
} from './savedSearches.service';
import { deleteJson, getJson, postJson, putJson } from '../api';
import {
  createEmptySavedSearchCriteria,
  isSavedSearchValid,
  normalizeSavedSearchCriteria,
} from './savedSearches.utils';
import { APP_ERROR_CODES } from '../../types';

vi.mock('../api', () => ({
  deleteJson: vi.fn(),
  getJson: vi.fn(),
  postJson: vi.fn(),
  putJson: vi.fn(),
}));

const body = { criteria: { ...createEmptySavedSearchCriteria(), name: 'Backend' } };

describe('savedSearches.utils', () => {
  it('normalizes text, skills, and choices', () => {
    expect(
      normalizeSavedSearchCriteria({
        location: ' Berlin  Mitte ',
        name: '  Backend ',
        notes: ' note ',
        role: 'Backend   Engineer',
        seniority: ['SENIOR', 'SENIOR'],
        skills: ['Kotlin', ' kotlin'],
        workModes: ['REMOTE', 'REMOTE'],
      }),
    ).toEqual({
      location: 'Berlin Mitte',
      name: 'Backend',
      notes: 'note',
      role: 'Backend Engineer',
      seniority: ['SENIOR'],
      skills: ['Kotlin'],
      workModes: ['REMOTE'],
    });
  });

  it('requires a name', () => {
    expect(isSavedSearchValid(createEmptySavedSearchCriteria())).toBe(false);
    expect(isSavedSearchValid({ ...createEmptySavedSearchCriteria(), name: '  ' })).toBe(false);
    expect(isSavedSearchValid(body.criteria)).toBe(true);
  });
});

describe('savedSearches.service', () => {
  beforeEach(() => {
    vi.mocked(getJson).mockResolvedValue([]);
    vi.mocked(postJson).mockResolvedValue({});
    vi.mocked(putJson).mockResolvedValue({});
    vi.mocked(deleteJson).mockResolvedValue(undefined);
  });

  it('reads, creates, replaces, and deletes at /api/saved-searches', async () => {
    await getSavedSearches();
    await createSavedSearch(body);
    await updateSavedSearch('s 1', body);
    await deleteSavedSearch('s 1');

    const options = (message: string) => ({
      errorCode: APP_ERROR_CODES.SAVED_SEARCH_REQUEST_FAILED,
      fallbackErrorMessage: message,
    });

    expect(getJson).toHaveBeenCalledWith(
      '/api/saved-searches',
      options('Failed to load saved searches'),
    );
    expect(postJson).toHaveBeenCalledWith(
      '/api/saved-searches',
      body,
      options('Failed to create saved search'),
    );
    expect(putJson).toHaveBeenCalledWith(
      '/api/saved-searches/s%201',
      body,
      options('Failed to save search'),
    );
    expect(deleteJson).toHaveBeenCalledWith(
      '/api/saved-searches/s%201',
      options('Failed to delete saved search'),
    );
  });
});

/*
 * TEMPORARY: covers savedSearches.mock.ts, and goes with it when the task
 * 046 backend lands.
 */
describe('savedSearches.mock', () => {
  beforeEach(() => {
    resetMockSavedSearches();
  });

  it('is off outside the dev server, including under Vitest', () => {
    expect(USE_MOCK_SAVED_SEARCHES).toBe(false);
  });

  it('seeds one search, then creates, updates, and deletes', async () => {
    expect(await mockGetSavedSearches()).toHaveLength(1);

    const created = await mockCreateSavedSearch(body);
    const updated = await mockUpdateSavedSearch(created.id, {
      criteria: { ...body.criteria, name: 'Renamed' },
    });

    expect(updated.criteria.name).toBe('Renamed');

    await mockDeleteSavedSearch(created.id);

    expect(await mockGetSavedSearches()).toHaveLength(1);
    await expect(mockDeleteSavedSearch('missing')).rejects.toMatchObject({ status: 404 });
  });
});
