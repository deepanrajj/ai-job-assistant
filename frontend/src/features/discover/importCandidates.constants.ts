/**
 * TEMPORARY - remove when the task 047 backend lands.
 *
 * False in built images (`production` mode), where `/api/import-candidates`
 * does not exist yet: the candidate review section is left out and no
 * request is made. True in the dev server, where
 * `USE_MOCK_IMPORT_CANDIDATES` stands in for the endpoints, and under
 * Vitest, so the feature stays tested.
 */
export const IMPORT_CANDIDATES_FEATURE_ENABLED = import.meta.env.MODE !== 'production';
