import { AppError } from '../../errors';
import { APP_ERROR_CODES } from '../../types';
import type { TSavedSearchResponse, TSaveSavedSearchRequest } from './savedSearches.types';

/*
 * TEMPORARY MOCK - remove when the task 046 backend lands.
 *
 * Stands in for `/api/saved-searches`, which does not exist yet, so the
 * Discover page can be seen in the dev server (`npm run dev:frontend`).
 * Searches live in memory and reset on every page reload.
 *
 * To remove it, once the backend lands:
 * 1. Delete this file and `savedSearches.mock.test.ts`.
 * 2. Delete the `USE_MOCK_SAVED_SEARCHES` branches and the
 *    `./savedSearches.mock` import in `savedSearches.service.ts`.
 * 3. Delete `SAVED_SEARCHES_FEATURE_ENABLED` in
 *    `features/discover/discover.constants.ts` and the places that read
 *    it, so built images show the Discover page.
 */

/**
 * On only in the Vite dev server (`development` mode). Off in built images
 * and under Vitest.
 */
export const USE_MOCK_SAVED_SEARCHES = import.meta.env.MODE === 'development';

const seedSearches = (): TSavedSearchResponse[] => {
  const now = new Date().toISOString();

  return [
    {
      createdAt: now,
      criteria: {
        location: 'Berlin',
        name: 'Senior backend in Berlin',
        notes: 'Payments or platform teams preferred.',
        role: 'Backend Engineer',
        seniority: ['SENIOR'],
        skills: ['Kotlin', 'Spring Boot', 'PostgreSQL'],
        workModes: ['HYBRID', 'REMOTE'],
      },
      id: 'mock-search-1',
      updatedAt: now,
    },
  ];
};

let searches: TSavedSearchResponse[] | null = null;
let createdCount = 0;

const getSearches = (): TSavedSearchResponse[] => {
  if (!searches) searches = seedSearches();

  return searches;
};

const copy = (search: TSavedSearchResponse): TSavedSearchResponse =>
  JSON.parse(JSON.stringify(search)) as TSavedSearchResponse;

const searchNotFound = (): AppError =>
  new AppError(
    'Saved search not found.',
    APP_ERROR_CODES.SAVED_SEARCH_REQUEST_FAILED,
    404,
    'SAVED_SEARCH_NOT_FOUND',
  );

/**
 * Mock of `GET /api/saved-searches`.
 */
export const mockGetSavedSearches = async (): Promise<TSavedSearchResponse[]> =>
  getSearches().map(copy);

/**
 * Mock of `POST /api/saved-searches`.
 */
export const mockCreateSavedSearch = async (
  payload: TSaveSavedSearchRequest,
): Promise<TSavedSearchResponse> => {
  const now = new Date().toISOString();

  createdCount += 1;

  const created = copy({
    createdAt: now,
    criteria: payload.criteria,
    id: `mock-search-created-${createdCount}`,
    updatedAt: now,
  });

  getSearches().push(created);

  return copy(created);
};

/**
 * Mock of `PUT /api/saved-searches/{id}`.
 */
export const mockUpdateSavedSearch = async (
  searchId: string,
  payload: TSaveSavedSearchRequest,
): Promise<TSavedSearchResponse> => {
  const search = getSearches().find((candidate) => candidate.id === searchId);

  if (!search) throw searchNotFound();

  search.criteria = copy({ ...search, criteria: payload.criteria }).criteria;
  search.updatedAt = new Date().toISOString();

  return copy(search);
};

/**
 * Mock of `DELETE /api/saved-searches/{id}`.
 */
export const mockDeleteSavedSearch = async (searchId: string): Promise<void> => {
  const list = getSearches();
  const index = list.findIndex((candidate) => candidate.id === searchId);

  if (index === -1) throw searchNotFound();

  list.splice(index, 1);
};

/**
 * Restores the seeded searches. For tests only.
 */
export const resetMockSavedSearches = (): void => {
  searches = null;
  createdCount = 0;
};
